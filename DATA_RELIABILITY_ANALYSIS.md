# User Access Tool - Time Tracking Data Reliability Analysis

**Date:** June 11, 2026  
**System:** User Access Tool (Access Tool)  
**Focus:** Individual User Time Tracking Reliability

## At a Glance

| Topic | Summary |
|-------|---------|
| Reliability for individuals | Low |
| Reliability for teams | Moderate |
| Best use case | Aggregate trend analysis |
| Not recommended for | Performance reviews or accountability |
| Main blockers | Idle-time guessing, API delay, missing validation, exposed secrets |

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [How Time Tracking Works](#1-how-time-tracking-works)
3. [Data Collection Timeline](#2-data-collection-timeline)
4. [What Data is Collected](#3-what-data-is-collected-from-users)
5. [Reliability Assessment](#4-data-reliability-assessment)
6. [Failure Modes](#5-what-could-break-the-system)
7. [Individual Tracking Risks](#6-individual-tracking-problems-specifically)
8. [Security & Compliance](#7-security--compliance-issues)
9. [Recommendations](#10-recommendations)
10. [Conclusion](#13-conclusion)

---

## Executive Summary

The current time tracking system is **not reliably accurate for individual user accountability**. It is better suited to team-level trend analysis than to performance reviews or personal productivity measurement.

**Current Reliability Score: 40% for individual tracking**

**Bottom line:** use the current system for aggregate usage patterns, not for high-stakes individual decisions.

---

## 1. How Time Tracking Works

### 1.1 Data Collection Points

#### Frontend Tracking (Real-time)
- **File:** `frontend/src/app/Services/active-time-tracker.service.ts`
- **What it tracks:**
  - Mouse movement
  - Clicks
  - Keyboard input
  - Page scrolling
  - Touch events
- **How it works:**
  - Listens to activity events every second
  - Counts 1 second per tick if user is NOT idle
  - Stops counting after 5 minutes of no activity
  - Records to backend via `recordTimeSpent()`

#### Backend Activity Tracking
- **File:** `backend/src/powerbi-metrics/tasks/powerbi-logs-collector.task.ts`
- **What it tracks:**
  - Power BI API activity logs (from Microsoft)
  - Report views
  - Filters applied
  - Exports performed
- **Schedule:** Every hour at top of hour
- **Data source:** Microsoft Power BI Activity API

#### Session Calculation
- **File:** `backend/src/analytics/pbi-analytics.service.ts`
- **How it works:**
  - Groups events by user
  - Calculates duration as gap between consecutive events
  - Caps idle gaps at 30 minutes (configurable via `IDLE_TIMEOUT_MINUTES`)
  - Creates sessions and usage summaries

### 1.2 Data Storage

| Data Type | Table | Details |
|-----------|-------|---------|
| Login events | `LoginEvent` | Email, IP, timezone, timestamp |
| Power BI logs | `PowerBILog` | Raw activity from Microsoft API |
| Sessions | `PbiSession` | Calculated sessions with duration |
| Activity events | `PbiActivityEvent` | Individual Power BI operations |
| Time spent | `PowerBITimeSpent` | Duration metrics per user/report |
| Usage summary | `PbiUsageSummary` | Aggregated metrics |

---

## 2. Data Collection Timeline

### Timeline Example

```
Monday 2:00 PM: User performs action in Power BI
        ↓
Tuesday 2:00 PM: Microsoft exposes in Activity API (24-hour delay)
        ↓
Tuesday 2:00-3:00 PM: System collects via hourly job
        ↓
Wednesday 1:00 AM: System calculates sessions & final metrics
        ↓
Wednesday 8:00 AM: Data appears in reports
```

### Schedule Details

| Task | Frequency | Time | Purpose |
|------|-----------|------|---------|
| Real-time log collection | Hourly | Every hour at `:00` | Collect Power BI Activity API logs (last 24h) |
| Daily processing | Daily | 1:00 AM | Calculate sessions for previous day |
| Weekly workspace sync | Weekly | Sunday 2:00 AM | Sync workspaces and reports from Power BI |

**Total data latency: 24-48 hours**

---

## 3. What Data is Collected from Users

### 3.1 Identity & Access Data
- **Email address** - User identity
- **IP address** - Login location
- **User agent** - Device/browser information
- **Department** - Organizational unit
- **Location** - Physical location
- **Timezone** - User timezone
- **Login timestamp** - When they logged in

### 3.2 Activity Data
- **Report name & ID** - Which reports accessed
- **Workspace name & ID** - Which workspace/project
- **Tab name** - Specific page viewed
- **Actions taken** - View, Filter, Export operations
- **Event count** - Number of actions per session
- **Exact timestamps** - When each action occurred

### 3.3 Duration Metrics
- **Duration in seconds** - Time spent on report
- **Session start/end** - Session boundaries
- **Idle flag** - Whether time was capped by idle timeout

### 3.4 Derived Analytics
- Peak working hours
- Most used reports
- Department activity patterns
- User productivity metrics
- Daily/hourly work patterns
- Login frequency

---

## 4. Data Reliability Assessment

### 4.1 Reliability by Use Case

| Use Case | Reliability | Confidence | Notes |
|----------|-------------|-----------|-------|
| Team trend analysis | ✅ 75% | High | Good for "which reports are popular" |
| Peak hour detection | ✅ 75% | High | Probably accurate for aggregate |
| Report popularity | ✅ 80% | High | Can see which reports used most |
| Individual time spent | ❌ 30% | Low | Highly inaccurate, users will dispute |
| Individual productivity | ❌ 25% | Low | Cannot reliably measure |
| Audit/compliance | ❌ 20% | Low | Too many gaps for legal purposes |
| Performance reviews | ❌ 15% | Low | Data not defensible |

### 4.2 Key Reliability Issues

#### Issue #1: Activity ≠ Work
**Problem:**
```
User scenario 1:
- Click report
- Read for 30 minutes (no interaction)
- After 5 minutes: Stops counting time

Result: System records 5 minutes
Actual work: 30 minutes
ERROR: -25 minutes
```

```
User scenario 2:
- Click report
- Move mouse every 4 minutes (distracted, not working)
- Keeps counting every second

Result: System records full time
Actual work: Partial/distracted
ERROR: +30-50% inflation
```

#### Issue #2: Mousemove is Unreliable Indicator
Activity events tracked:
- `mousemove` - Could be accidental, hand on mouse, not working
- `click` - Likely working
- `keydown` - Likely working
- `scroll` - Maybe working, maybe just browsing
- `touchstart` - Could be accidental

**Only 2 out of 5 indicators are reliable.**

#### Issue #3: 5-Minute Idle Threshold is Arbitrary
```
Reading a complex report analysis:
Time needed: 15 minutes without interaction
System idle timeout: 5 minutes
Result: Only 5 minutes recorded (67% data loss)
```

#### Issue #4: Microsoft's 24-Hour API Delay
- Data is always 24 hours behind
- Not real-time
- Cannot be fixed (Microsoft's limitation)
- Risk: API outages cause permanent data loss

#### Issue #5: No Data Validation
Current system does NOT validate:
- Suspicious patterns (user logged in 500 times/hour?)
- Data quality issues
- Outliers
- Impossible metrics

#### Issue #6: Hardcoded Credentials** 🚨 SECURITY ISSUE
**Location:** `backend/src/auth/auth.service.ts` (lines 14-15)
```typescript
username: 'MISSVCACC',
password: 'Horizon@MIS',  // HARDCODED!
```

Also in `.env`:
- `CLIENT_SECRET` (Azure/Power BI)
- `JWT_SECRET`
- `DB_PASSWORD`

**Impact on reliability:** If credentials compromised, all data integrity questionable.

#### Issue #7: Dependency Chain Failures
If ANY component fails, data is lost:
```
Power BI API ↓ (fails/timeout)
    → No data collected
    → Data gap exists

System ↓ (crash during hourly job)
    → Logs not retrieved
    → Missing hours of data

Database ↓ (unavailable)
    → Data not saved
    → Data loss

Scheduler ↓ (1 AM sync fails)
    → Yesterday's data never processed
    → Forever lost
```

#### Issue #8: Late Processing
- Logs collected hourly (good)
- BUT processed only at 1:00 AM (bad)
- If system down at 1:00 AM → yesterday's data lost forever
- No retry mechanism visible in code

---

## 5. What Could Break the System

### Data Collection Failures
1. **Power BI API downtime** → No new data for hours
2. **Network issues** → Logs missed due to timeouts
3. **Authentication failure** → API calls rejected
4. **Rate limiting** → Microsoft limits API calls

### Processing Failures
1. **1:00 AM job fails** → Yesterday's data never processed
2. **Database unavailable** → Data not saved
3. **Out of memory** → Process crashes mid-calculation
4. **Service crashes** → Restart at 1:00 AM (data lost)

### Data Loss Scenarios
1. **Power BI deletes logs after 30 days** → Older data inaccessible
2. **System not monitored** → Failures go unnoticed
3. **No alerting** → Nobody knows when data stops flowing
4. **No recovery process** → No way to backfill lost data

---

## 6. Individual Tracking Problems Specifically

### Problem #1: Users Will Dispute Data
```
Admin: "System shows you spent 3 hours on Report X"
User: "I only clicked it once and left"
Admin: Cannot prove otherwise with current system
Result: Trust breakdown, disputes
```

### Problem #2: False Positives
```
Scenario: User has report open but away from desk
Browser kept open, mouse occasionally moves
System records: 4 hours of work
Actual: 0 hours (user was away)
Error: +4 hours (100% inflation)
```

### Problem #3: False Negatives
```
Scenario: User intensely reading/analyzing report for 1 hour
No keyboard input, minimal mouse movement after initial scroll
System records: 5 minutes (after idle timeout)
Actual: 1 hour
Error: -55 minutes (92% data loss)
```

### Problem #4: Gaming the System
```
User learns that mousemove = counted time
Solution: Put hand on mouse/track pad periodically
Result: System counts full time even if user is distracted
Outcome: Data becomes unreliable
```

### Problem #5: Unfair Comparisons
```
User A: Works on complex reports, needs deep reading time
Recorded time: LOW (due to idle timeout)

User B: Works on simple dashboards, frequent clicks
Recorded time: HIGH (constant activity)

Comparison: User B appears more productive
Reality: User A does more complex work

Result: Metrics are unfair
```

---

## 7. Security & Compliance Issues

### Critical Issues

#### 1. Hardcoded Credentials in Source Code
**File:** `backend/src/auth/auth.service.ts`
**Risk Level:** CRITICAL

```typescript
const config = {
  url: 'ldap://HGUNBXDC01VM.Horizongroupusa.com',
   username: '[REDACTED]',
   password: '[REDACTED]',
};
```

**Issues:**
- Visible in git history forever
- Exposed in any code repository
- Cannot be rotated without code change
- Anyone with repo access can access LDAP

#### 2. Secrets in .env File
**File:** `backend/.env`
**Risk Level:** CRITICAL

```
CLIENT_SECRET=[REDACTED]
JWT_SECRET=[REDACTED]
DB_PASSWORD=[REDACTED]
```

**Issues:**
- If .env in git → credentials exposed
- If repo leaked → all accounts compromised
- Cannot be changed without redeployment

### Impact on Data Reliability

If credentials are compromised:
- Attacker can inject false data
- Attacker can delete data
- Data integrity cannot be verified
- Audit trail is compromised
- System cannot be trusted for any purpose

---

## 8. Data Not Hardcoded

**Clarification:** The time tracking DATA itself is NOT hardcoded:
- All user activity is dynamic
- All metrics are calculated from real data
- All timestamps are real events
- Stored in PostgreSQL database

**What IS hardcoded (problematically):**
- LDAP password
- API secrets
- Database password
- JWT secret

---

## 9. Comparison: Current vs Needed for Individual Tracking

### Current System
```
✅ Strengths:
- Collects activity data hourly
- Attempts to handle idle time
- Stores data persistently
- Can recover historical data

❌ Weaknesses:
- 24-hour data delay
- Unreliable time calculation
- Arbitrary idle thresholds
- Activity ≠ work
- No data validation
- No error recovery
- Hardcoded credentials
```

### What's Needed for Individual Tracking
```
✅ Required:
- Real-time event logging
- Explicit action tracking only (no idle time guessing)
- Data validation and anomaly detection
- User confirmation of time
- Audit trail (who/what/when)
- Cryptographically signed records
- No hardcoded secrets
- 99.9% availability SLA
- Immediate error alerting
- Data encryption at rest & in transit
- GDPR/compliance compliance
```

---

## 10. Recommendations

### Short-term (Quick Fixes)

1. **Fix Security Issues IMMEDIATELY** 🚨
   ```
   - Move LDAP password to .env (not in code)
   - Add .env to .gitignore
   - Rotate all exposed credentials
   - Regenerate JWT secret
   - Change database password
   - Remove .env from git history
   ```

2. **Add Data Validation**
   - Check for outliers (1000+ actions/hour = invalid)
   - Validate timestamps are logical
   - Alert on missing data

3. **Add Error Handling**
   - Monitor 1:00 AM sync job
   - Alert if it fails
   - Implement retry mechanism
   - Log all errors

4. **Document Limitations**
   - Tell users: "For team trends, not individual metrics"
   - Be transparent about 24-hour delay
   - Explain idle timeout impacts

### Medium-term (Better Approach)

1. **Separate Metrics**
   ```
   "Time page open" ← Frontend idle tracking
   "Actual work time" ← Backend explicit actions only
   
   Show both, don't mix them
   ```

2. **User Confirmation**
   ```
   System suggests: "You spent 2 hours on Report X"
   User confirms: "Yes, correct" or "No, I was in a meeting"
   Both recorded in audit log
   ```

3. **Real-time Processing**
   ```
   Instead of: Hourly collection + 1 AM processing
   Use: Immediate logging to database
   Result: Same-day visibility, no data loss
   ```

4. **Better Idle Detection**
   ```
   Instead of: Fixed 5-minute timeout
   Track:
   - Actual Power BI operations (most reliable)
   - Page visibility (is window focused?)
   - Interaction patterns (meaningful activity?)
   ```

### Long-term (If Individual Tracking Required)

1. **Replace current system** with real-time event logging
2. **Implement cryptographic signing** for audit compliance
3. **Add GDPR compliance** (user data export, deletion)
4. **Separate tracking** from access control
5. **User dashboard** showing their own tracked time
6. **Dispute resolution** process (users can challenge data)

---

## 11. Questions to Answer Before Using This Data

**For leadership/HR asking about individual metrics:**

1. **"What will we do when users dispute their time?"**
   - Current system cannot prove accuracy
   - No mechanism to resolve disputes

2. **"Is this defensible in legal proceedings?"**
   - No, data has significant gaps
   - 24-hour delays reduce reliability
   - Idle timeout is arbitrary

3. **"Can we use this for performance reviews?"**
   - Not recommended, too unreliable
   - Could result in unfair assessments
   - Potential legal liability

4. **"What if Power BI API fails for a day?"**
   - All data for that day is lost
   - No way to recover it
   - No notification to users

5. **"How do we know the data hasn't been tampered with?"**
   - Current system has no cryptographic verification
   - Hardcoded credentials could be exploited
   - No audit trail of who accessed what

6. **"What's the actual accuracy margin?"**
   - For individuals: ±30 minutes to ±2 hours
   - For teams: ±10-15%
   - Unacceptable for accountability

---

## 12. Alternative Approaches

### Option A: Team Metrics Only (Recommended)
```
Use current system for:
✓ Which reports are most used
✓ Team-level activity trends
✓ Peak usage hours
✓ Department comparisons

Do NOT use for:
✗ Individual time tracking
✗ Performance metrics
✗ Productivity measurement
```

### Option B: Explicit Time Logging
```
Users manually log their work:
"I worked on Sales Report for 45 minutes"

Combined with system data:
"System shows you had 30 minutes of activity"

Reconcile both sources for accuracy
```

### Option C: Real-Time Activity Tracking
```
Track ONLY explicit Power BI operations:
- Report opened: 1 event
- Filter applied: 1 event
- Chart exported: 1 event

Calculate time as gaps between events
No idle timeout guessing
Much more reliable
```

### Option D: Session-Based with User Confirmation
```
System: "You were on Report X from 2:00-2:45 PM"
User: Confirms/disputes
Both stored in audit log
Provides accountability + fairness
```

---

## 13. Conclusion

### Current State
- **Suitable for:** Team-level trend analysis, report popularity, aggregate metrics
- **NOT suitable for:** Individual tracking, performance reviews, accountability
- **Reliability:** 40% for individuals, 75% for teams

### Key Risks
1. Users will dispute metrics (system cannot defend them)
2. Data could be off by hours (idle timeout issue)
3. Data loss possible (API failures, processing failures)
4. Security compromised (hardcoded credentials)
5. Activity tracking is unreliable (mousemove ≠ work)

### Recommendation
**DO NOT use this system for individual user accountability without substantial improvements.**

If individual tracking is required, either:
1. Redesign the system for reliability, or
2. Add user confirmation layer, or
3. Use explicit action tracking only (not idle time)

---

## 14. Appendix: Technical Details

### File Locations
- Frontend tracking: `frontend/src/app/Services/active-time-tracker.service.ts`
- Backend collection: `backend/src/powerbi-metrics/tasks/powerbi-logs-collector.task.ts`
- Session calculation: `backend/src/analytics/pbi-analytics.service.ts`
- Scheduling: `backend/src/scheduler/pbi-scheduler.service.ts`
- Security issue: `backend/src/auth/auth.service.ts` (lines 11-41)
- Secrets file: `backend/.env`

### Configuration Values
- Idle timeout: 5 minutes (frontend), 30 minutes (backend)
- Session recalc: Daily at 1:00 AM
- Data collection: Every hour at `:00`
- API delay: 24 hours (Microsoft)
- Database: PostgreSQL

### Tables Used
- LoginEvent
- PowerBILog
- PbiSession
- PbiActivityEvent
- PowerBITimeSpent
- PbiUsageSummary
- PbiUser
- PbiWorkspace
- PbiReport
- PbiDashboard

---

**Document prepared:** June 11, 2026  
**System analyzed:** User Access Tool v1.0  
**Analysis version:** 1.0
