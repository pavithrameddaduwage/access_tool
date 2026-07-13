# Power BI User Access Management in User Access Tool

## 1. Overview

This enterprise application is a combined:
- **NestJS backend** (`backend/`) for API, data ingestion, and Power BI integration
- **Angular frontend** (`frontend/`) for analytics, dashboards, and user workflows
- **PostgreSQL database** for storing Power BI logs, time tracking, user dashboards, and access metadata

The app currently supports Power BI analytics and audit-based usage reporting. It also supports direct Power BI workspace member management through backend APIs.

## 2. What has been implemented

### Backend
- `backend/src/powerbi-metrics/powerbi-metrics.controller.ts`
  - Exposes REST APIs for Power BI metrics and workspace member management
- `backend/src/powerbi-metrics/powerbi-metrics.service.ts`
  - Implements Power BI OAuth token acquisition and Office 365 Management API access
  - Pulls Power BI audit logs from Microsoft Graph/Azure audit APIs
  - Filters logs for `Workload === 'PowerBI'` and `Operation === 'ViewReport'`
  - Persists Power BI log entries to `power_bi_log`
  - Records active user report time via `power_bi_time_spent`
  - Calls Power BI REST endpoints for workspace member management

### Frontend
- `frontend/src/app/Services/powerbi-metrics.service.ts`
  - Wraps backend endpoint calls using Angular `HttpClient`
- `frontend/src/app/dashboard-detail/dashboard-detail.component.ts`
  - Loads workspace members from the backend and shows them in the dashboard detail UI
  - Contains methods for updating and removing workspace members
- `frontend/src/app/powerbi-dashboard/powerbi-dashboard.component.ts`
  - Hosts Power BI analytics views and charting logic
  - Does not currently render the workspace member manager form in the main Power BI analytics page

## 3. Power BI user access management APIs

### Base path
`/powerbi-metrics`

### 3.1 Get all workspace members
- `GET /powerbi-metrics/workspace/:groupId/members`
- Description: Returns the members for the specified Power BI workspace group
- Backend implementation: calls Power BI REST API `GET https://api.powerbi.com/v1.0/myorg/groups/{groupId}/users`
- Response shape: either `value` array or raw array

### 3.2 Add a workspace member
- `POST /powerbi-metrics/workspace/:groupId/members`
- Request body:
  ```json
  {
    "emailAddress": "user@contoso.com",
    "accessRight": "Viewer"
  }
  ```
- Description: Adds a user to the workspace with the specified permission
- Backend implementation: calls Power BI REST API `POST https://api.powerbi.com/v1.0/myorg/groups/{groupId}/users`

### 3.3 Update a workspace member's access
- `PATCH /powerbi-metrics/workspace/:groupId/members/:userId`
- Request body:
  ```json
  {
    "accessRight": "Member"
  }
  ```
- Description: Updates the Power BI access level for an existing workspace member
- Backend implementation: calls Power BI REST API `PATCH https://api.powerbi.com/v1.0/myorg/groups/{groupId}/users/{userId}`

### 3.4 Remove a workspace member
- `DELETE /powerbi-metrics/workspace/:groupId/members/:userId`
- Description: Removes the user from the Power BI workspace
- Backend implementation: calls Power BI REST API `DELETE https://api.powerbi.com/v1.0/myorg/groups/{groupId}/users/{userId}`

## 4. Frontend service wrappers

The frontend exposes these direct management methods in `frontend/src/app/Services/powerbi-metrics.service.ts`:
- `getWorkspaceMembers(groupId: string)`
- `addWorkspaceMember(groupId: string, payload: { emailAddress: string; accessRight?: string })`
- `updateWorkspaceMember(groupId: string, userId: string, payload: { accessRight: string })`
- `removeWorkspaceMember(groupId: string, userId: string)`

These call the backend API and can be used by any component that needs direct Power BI user access management.

## 5. Required configuration

The backend must be configured with Power BI / Azure credentials in environment variables:
- `TENANT_ID`
- `CLIENT_ID`
- `CLIENT_SECRET`

These are used to request tokens from Azure AD for the Power BI REST API.

## 6. Example direct API usage

```bash
# List members
curl "http://localhost:4006/powerbi-metrics/workspace/{groupId}/members"

# Add member
curl -X POST "http://localhost:4006/powerbi-metrics/workspace/{groupId}/members" \
  -H "Content-Type: application/json" \
  -d '{"emailAddress":"user@contoso.com","accessRight":"Viewer"}'

# Update member access
curl -X PATCH "http://localhost:4006/powerbi-metrics/workspace/{groupId}/members/{userId}" \
  -H "Content-Type: application/json" \
  -d '{"accessRight":"Member"}'

# Remove member
curl -X DELETE "http://localhost:4006/powerbi-metrics/workspace/{groupId}/members/{userId}"
```

## 7. Current status summary

- The app supports Power BI analytics and usage reporting across workspaces, reports, and users.
- The app also supports direct workspace member management through the Power BI REST API via backend endpoints.
- Workspace member UI is available in the dashboard/detail flow, and the `powerbi-dashboard` analytics screen no longer shows the workspace member manager form.
- Direct management is implemented, but the feature is currently scoped behind `powerbi-metrics` APIs rather than a separate global access management page.
