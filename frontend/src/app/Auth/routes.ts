import { Routes } from '@angular/router';
import { LoginComponent } from '../login/login.component';
import { DepartmentComponent } from '../masterdata/department/department.component';
import { TypeComponent } from '../masterdata/type/type.component';
import { ValuetypeComponent } from '../masterdata/valuetype/valuetype.component';
import { WebtoolComponent } from '../masterdata/webtool/webtool.component';
import { WorkspaceComponent } from '../masterdata/workspace/workspace.component';
import { RolesComponent } from '../masterdata/roles/roles.component';
import { DashboardComponent } from '../masterdata/dashboard/dashboard.component';
import { FrameComponent } from '../masterdata/frame/frame.component';
import { DashboardsComponent } from '../dashboards/dashboards.component';
import { DashboardDetailComponent } from '../dashboard-detail/dashboard-detail.component';
import { HomeComponent } from '../home/home.component';
import { WebtoolsComponent } from '../webtools/webtools.component';
import { GroupComponent } from '../masterdata/group/group.component';
import { StatisticsComponent } from '../statistics/statistics.component';
import { WebtoolDetailComponent } from '../webtool-detail/webtool-detail.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { UserManagementComponent } from '../masterdata/user-management/user-management.component';
import { PowerBIAnalyticsComponent } from '../powerbi-analytics/powerbi-analytics.component';
import { PowerBIUsageDashboardComponent } from '../powerbi-usage-dashboard/powerbi-usage-dashboard.component';
import { WebtoolAnalyticsComponent } from '../webtool-analytics/webtool-analytics.component';
import { PowerBIDashboardComponent } from '../powerbi-dashboard/powerbi-dashboard.component';
import { AnalyticsComponent } from '../analytics/analytics.component';
import { WAnalyticsComponent } from '../w-analytics/w-analytics.component';
import { UsersOverviewComponent } from '../users-overview/users-overview.component';
import { DashboardTabUsageComponent } from '../dashboard-tab-usage/dashboard-tab-usage.component';

const routeConfig: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
    title: 'Login Page',
    pathMatch: 'full'
  },
  {
    path: 'engagement-analytics',
    loadChildren: () =>
      import('../features/analytics/analytics.routes').then((m) => m.ANALYTICS_ROUTES),
    canActivate: [authGuard],
    title: 'Engagement Analytics'
  },
  {
    path: 'masterdata',
    component: FrameComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' },
    title: 'MasterData',
    children: [
      {
        path: '',
        redirectTo: 'type',
        pathMatch: 'full'
      },
      {
        path: 'type',
        component: TypeComponent,
        canActivate: [authGuard, roleGuard],
        data: { role: 'admin' },
        title: 'Type MasterData'
      },
      {
        path: 'valuetype',
        component: ValuetypeComponent,
        canActivate: [authGuard, roleGuard],
        data: { role: 'admin' },
        title: 'Value Type MasterData'
      },
      {
        path: 'webtool',
        component: WebtoolComponent,
        canActivate: [authGuard, roleGuard],
        data: { role: 'admin' },
        title: 'Web Tool MasterData'
      },
      {
        path: 'userroles',
        component: RolesComponent,
        canActivate: [authGuard, roleGuard],
        data: { role: 'admin' },
        title: 'User Roles MasterData'
      },
      {
        path: 'workspace',
        component: WorkspaceComponent,
        canActivate: [authGuard, roleGuard],
        data: { role: 'admin' },
        title: 'Workspace MasterData'
      },
      {
        path: 'users',
        component: UserManagementComponent,
        canActivate: [authGuard, roleGuard],
        data: { role: 'admin' },
        title: 'User MasterData'
      },
      {
        path: 'group',
        component: GroupComponent,
        canActivate: [authGuard, roleGuard],
        data: { role: 'admin' },
        title: 'Group MasterData'
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [authGuard, roleGuard],
        data: { role: 'admin' },
        title: 'Dashboard MasterData'
      }
    ]
  },
  {
    path: 'department',
    component: DepartmentComponent,
    title: 'Department MasterData',
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' },
    pathMatch: 'full'
  },
  {
    path: 'dashboards',
    component: DashboardsComponent,
    canActivate: [authGuard],
    title: 'Dashboards',
    pathMatch: 'full'
  },
  {
    path: 'user-management',
    component: UserManagementComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' },
    title: 'User Management',
    pathMatch: 'full'
  },
  {
    path: 'dashboard-detail/:name',
    component: DashboardDetailComponent,
    canActivate: [authGuard]
  },
  {
    path: 'dashboard-tab-usage',
    component: DashboardTabUsageComponent,
    canActivate: [authGuard],
    title: 'Dashboard Tab Usage'
  },
  {
    path: 'dashboard-tab-usage/:name',
    component: DashboardTabUsageComponent,
    canActivate: [authGuard],
    title: 'Dashboard Tab Usage'
  },
  {
    path: 'home',
    component: AnalyticsComponent,
    canActivate: [authGuard],
    title: 'Home',
    pathMatch: 'full'
  },
  {
    path: 'webtool',
    component: WebtoolsComponent,
    canActivate: [authGuard],
    title: 'Webtools',
    pathMatch: 'full'
  },
  {
    path: 'statistics',
    component: StatisticsComponent,
    canActivate: [authGuard],
    title: 'Statistics',
    pathMatch: 'full'
  },
  
  {
    path: 'webtool-detail/:id',
    component: WebtoolDetailComponent,
    canActivate: [authGuard],
    title: 'Webtool Detail',
    pathMatch: 'full'
  },
  {
    path: 'powerbi',
    component: PowerBIDashboardComponent,
    pathMatch: 'full'
  },
  {
    path: 'users',
    component: UsersOverviewComponent,
    canActivate: [authGuard],
    title: 'User Activity Overview',
    pathMatch: 'full'
  }
];

export default routeConfig;