Walkthrough - UI Overhaul & Context-Aware Layouts
This walkthrough documents the successful implementation of precise active duration tracking, redundant route pruning, and spacious modern glassmorphic styling tweaks.

1. Backend Integration (Precise Database Telemetry)
Database Entity: Configured 
powerbi-time-spent.entity.ts
 to store detailed user active tracking records.
REST Endpoints: Added POST powerbi-metrics/time-spent and GET powerbi-metrics/user-time-spent endpoints inside 
powerbi-metrics.controller.ts
 to manage precise session logs.
Robust Metrics Service: Updated 
powerbi-metrics.service.ts
 to sum exact database segments when returning user metrics, falling back to heuristics only if telemetry history does not exist yet.
2. Frontend Overhaul & Spacing Revamp
Clean Route Consolidations: Removed empty/leftover routes (powerbi-analytics, powerbi-usage, webtool-usage, and webtool-dashboard) inside 
routes.ts
 to declutter navigation click paths.
Spacious Glassmorphic Styles: Redesigned 
powerbi-dashboard.component.css
 to support rich .card-glass definitions, rounded button shapes (btn-premium), custom scrollbars, and non-cramped viewport padding.
Modern Color Palettes: Replaced old primary/dark blue static colors with a vibrant premium color palette (blueGradientColors) for all charts inside both the dashboard and the user overview page.
3. UI Refinements (Context-Aware Layout Overhaul)
Following your requests, we made the following premium refinements:

Title Renaming: Renamed the tile Est. Time Spent / Estimated Time to Time Spent to reflect exact tracked telemetry.
Permission Cleanup: Removed the legacy Dashboard Access permission tag strip to simplify user profiles and reduce noise.
Tab-Wise Active Duration: Designed a beautiful list/table under the user profile showing Time Spent by Tab / Report which automatically populates using exact logged segments!
Enlarged Visualizations: Enlarged the Workspace Views and Consumption Methods pie/donut charts from 250px/280px to a generous 340px in height on both pages, making them significantly larger, highly readable, and professional.
Dynamic Layout Segmentation (New):
When clicked from the Main Power BI Usage Analytics Dashboard, the list of other user names is now completely hidden, showing only the selected user's profile summary in a clean, full-width presentation.
Clicking "Back to all users" brings the User List back.
This layout behavior is kept side-by-side on the separate USERS tab so you can still browse the sidebar while viewing profiles!
4. Compilation Verification
Backend Build: Built successfully (nest build).
Frontend Build: Re-compiled and built successfully with zero syntax errors.