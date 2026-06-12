import { Routes } from '@angular/router';
import { AnalyticsDashboardComponent } from './analytics-dashboard.component';

/**
 * Engagement analytics feature routes.
 * Wire into the app router, e.g.:
 *   { path: 'engagement-analytics',
 *     loadChildren: () => import('./features/analytics/analytics.routes').then(m => m.ANALYTICS_ROUTES) }
 */
export const ANALYTICS_ROUTES: Routes = [
  { path: '', component: AnalyticsDashboardComponent },
];
