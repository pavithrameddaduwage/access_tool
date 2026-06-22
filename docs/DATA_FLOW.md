# User Access Tool — Data Flow, APIs & Time Calculation

This document describes how data moves through the system: which APIs are called,
how report **time-spent** is calculated, and where everything is stored.

- **Backend:** NestJS, runs on port **4006** (`main.ts`)
- **Frontend:** Angular, API base `http://localhost:4006/` (`frontend/src/environments/environment.ts`)
- **Database:** PostgreSQL (`access_tool`)
- **All usage/analytics data is API-fed** — there is no seeding or mock data.

---

## 1. High-level architecture

```
┌─ Microsoft 365 / Power BI Audit API ─┐      ┌─ User's browser (Angular SPA) ─┐
│  external, pulled hourly by a cron   │      │  active-time tracking          │
└──────────────┬───────────────────────┘      └─────────────┬──────────────────┘
               │ raw audit "ViewReport" logs                 │ POST active seconds
               ▼                                             ▼
        ┌──────────────────── NestJS backend (:4006) ───────────────────────┐
        │  saveRawLogs()  ──► infers time      recordTimeSpent() ──► stores  │
        └──────────────────────────────┬────────────────────────────────────┘
                                        ▼
                          PostgreSQL  (access_tool)
        power_bi_log · power_bi_time_spent · login_event · …catalog/config tables
```

There are **three independent data sources**:

1. **Microsoft 365 Audit API** — the source of truth for *who viewed which report, when*.
2. **Browser active-time tracker** — precise *how long was the report actually watched*.
3. **Active Directory (LDAP)** — authentication + login history.

---

## 2. APIs used

### 2.1 External APIs (data the backend pulls in)

All in `backend/src/powerbi-metrics/powerbi-metrics.service.ts`.

| Purpose | Endpoint | Auth |
|---|---|---|
| Get OAuth token | `POST https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token` | client-credentials (`CLIENT_ID` / `CLIENT_SECRET`) |
| Ensure audit subscription | `…/manage.office.com/api/v1.0/{TENANT_ID}/activity/feed/subscriptions/start` (contentType `Audit.General`) | Bearer token |
| List available log blobs | `…/activity/feed/subscriptions/content?contentType=Audit.General&startTime=…&endTime=…` | Bearer token |
| Download log blob | each `contentUri` returned above | Bearer token |

The backend filters every blob down to `Workload === 'PowerBI'` **and** `Operation === 'ViewReport'`.

Auth uses **Active Directory over LDAP** (`backend/src/auth/auth.service.ts`) — credentials and
LDAP URL come from configuration; on success a row is written to `login_event`.

### 2.2 Internal REST API (consumed by the Angular frontend)

Base URL: `http://localhost:4006/`.

**Power BI metrics** — `@Controller('powerbi-metrics')`:

| Method | Route | Returns |
|---|---|---|
| GET | `unique-user-count` | distinct users in range |
| GET | `unique-report-count` | distinct reports in range |
| GET | `user-activity-trend` | daily active-user counts |
| GET | `views-by-date` | view counts per day |
| GET | `top-users` / `top-reports` | leaderboards |
| GET | `user-report-views-distribution` | per-user report view breakdown |
| GET | `daily-user-reports` | per-user daily report activity |
| GET | `user-consumption-methods` | web vs mobile, etc. |
| GET | `dashboard-usage` | usage for one dashboard |
| GET | `unused-reports` | reports with no views |
| **POST** | **`time-spent`** | **records active seconds from the browser** |
| GET | `user-time-spent` | time-spent distribution for a user |
| GET | `time-spent-overview` | aggregated time-spent |
| GET | `last-refresh` | timestamp of latest collected log |
| GET | `collect-raw` | manual trigger of log collection |

**Other modules** (standard CRUD): `users`, `user-dashboards`, `webtool` / `user-webtools` /
`webtool-user`, `roles`, `groups`, `departments`, `workspace` / `workspace-mappings`,
`report-mappings`, `dashboard`, and `analytics/*` (login dashboards: `daily-logins`,
`logins-by-hour`, `department-logins`, `top-active-users`, `record-login`, …).

---

## 3. How data is collected

### 3.1 Power BI usage logs (scheduled pull)

`backend/src/powerbi-metrics/tasks/powerbi-logs-collector.task.ts`

- **`@Cron('0 0 * * * *')` → runs every hour, on the hour.**
- Each run pulls the **last 24 hours** (deliberate overlap so nothing is missed if
  Microsoft delivers logs late).
- Also runs once on application startup (`onApplicationBootstrap`), which additionally
  syncs workspace/report mappings and the user roster from logs.
- Flow: `getAccessToken()` → `ensureSubscription()` → `getContentUris()` →
  `getLogEntries()` (per blob) → filter to PowerBI/ViewReport → **`filterExistingLogs()`
  dedupes by log `Id`** → `saveRawLogs()`.
- Result is **append-only**: existing rows are never updated or deleted; duplicates are skipped.

### 3.2 Browser active-time (real-time push)

`frontend/src/app/Services/active-time-tracker.service.ts`, wired into
`powerbi-dashboard.component.ts` (`startTracking` / `switchContext` on report/tab change).

- On report open: `startTracking(context)` where context = `{ reportId, reportName, tabName,
  workspaceId, workspaceName }`.
- Switching report/tab calls `switchContext()`, which **flushes** the accumulated time first.
- On flush / unload, posts to `POST /powerbi-metrics/time-spent` →
  backend `saveTimeSpent()` → `power_bi_time_spent`.

---

## 4. How **time-spent** is calculated

There are **two** mechanisms, both writing to `power_bi_time_spent`.

### Method A — Inferred from audit logs (server-side, approximate)

In `saveRawLogs()` (`powerbi-metrics.service.ts`). Power BI audit logs only record *that* a
report was opened — not duration — so duration is inferred from the gap between consecutive
opens by the same user on the same report:

```
Constants:
  SESSION_TIMEOUT_MS   = 30 min   // a gap longer than this = session ended
  DEFAULT_PAGE_VIEW_MS = 2 min    // assumed duration for the last/only view

Algorithm:
  1. Group ViewReport events by (userId + reportId), sorted by CreationTime.
  2. For each event:
       duration = time until the NEXT event for that key
       if no next event              → duration = DEFAULT_PAGE_VIEW_MS (2 min)
       if gap > SESSION_TIMEOUT_MS    → duration = DEFAULT_PAGE_VIEW_MS (2 min)
       else                           → duration = the gap
  3. Sum seconds per (userId, reportId, tabName) and persist.
       tabName = ArtifactName | ItemName | ReportName | 'Main Page'
```

This is a heuristic estimate — good for trends, not exact attention time.

### Method B — Real active time from the browser (precise)

`active-time-tracker.service.ts`. Measures **actual engaged time**:

```
Constants:
  IDLE_THRESHOLD_MS = 5 min   // no input for 5 min ⇒ user is idle

Algorithm:
  - A timer ticks every 1 second.
  - A second is counted ONLY if:
        not idle  AND  tab is visible (!document.hidden)
  - Idle is reset by: mousemove, click, keydown, scroll, touchstart.
  - Idle gaps are excluded (the time the user was away is not counted).
  - Accumulated activeSeconds are flushed to the backend on tab switch / navigation / unload.
```

This is the accurate measure of how long a report was actually watched.

> **Note (potential double-count):** both methods write to the same `power_bi_time_spent`
> table without a `source` column. If the hourly job infers time for a session that the
> browser tracker also reported, the two can overlap. If exact numbers matter, treat the
> browser tracker (Method B) as authoritative, or add a source discriminator. See §6.

### Login "time" / activity

`login_event` stores a row per login with `loginTime`, `department`, `location`, `timezone`,
IP and user-agent. The `analytics/*` endpoints aggregate these into logins-by-hour/day and
per-department dashboards. (This tracks *logins*, not report duration.)

---

## 5. Where data is stored (PostgreSQL `access_tool`)

### Historical / analytics tables — **append-only, never truncated or deleted in code**

| Table | Written by | Holds |
|---|---|---|
| `power_bi_log` | hourly cron `saveRawLogs()` | Raw Power BI `ViewReport` audit events — **source of truth** |
| `power_bi_time_spent` | Method A (inference) + Method B (browser) | `userId, reportId, reportName, workspaceId, tabName, durationSeconds, timestamp` |
| `login_event` | `LoginTrackingService.recordLogin()` | login history (email, IP, dept, location, timezone, loginTime) |

### Catalog / mapping tables

| Table | Holds |
|---|---|
| `workspace`, `dashboard`, `dashboard_workspace` | catalog of workspaces & dashboards and their links |
| `workspace_mapping`, `report_mapping` | map raw Power BI IDs / original names → friendly display names |
| `user_mapping` | map a log `userId` → real user/name |

### Users / access / config tables

| Table | Holds |
|---|---|
| `user`, `role_master`, `user_roles` | accounts, app roles, RBAC |
| `user_dashboard` | which user is assigned which dashboard (`isActive`, `lastActiveAt`) |
| `webtool`, `user_webtool`, `webtool_user` | external webtool registry + per-user access |
| `role` | webtool-level roles (separate from `role_master`) |
| `group`, `department`, `type`, `valuetype`, `dashboard_type`, `dashboard_valuetype` | lookup / categorization data |

> Deletes that exist in code are **scoped admin CRUD only** (remove a specific user, webtool,
> dashboard, or assignment). None touch the three historical tables. The old
> `TRUNCATE`/mass-`DELETE` lived only in seed/mock scripts, which have been removed.

---

## 6. Known issues / cleanup candidates

- **Time-spent double-count:** Methods A and B share `power_bi_time_spent` with no source
  flag (§4). Consider a `source` column or making the browser tracker authoritative.
- **`role` vs `role_master`:** two separate role tables (webtool roles vs app user roles) —
  functional but redundant.
- **Duplicate `UserWebtool` entity:** defined in both `user-webtool/` and `webtool-user/`,
  both mapping to `user_webtool`. Works, but fragile — candidate to unify.

---

## 7. Configuration (env)

`backend/.env`:

```
TENANT_ID, CLIENT_ID, CLIENT_SECRET   # Microsoft 365 / Power BI audit API
PG_DB_HOST, PG_DB_PORT, PG_DB_NAME, PG_DB_USER, PG_DB_PASSWORD   # PostgreSQL
JWT_SECRET                             # auth token signing
```

Active Directory (LDAP) connection settings live in `backend/src/auth/auth.service.ts`.
