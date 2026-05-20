import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import routeConfig from './Auth/routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { customAuthInterceptor } from './Auth/interceptors/custom-auth.interceptor';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
// Chart.js registration
import { Chart } from 'chart.js';
import { 
  CategoryScale, 
  LinearScale, 
  BarController, 
  BarElement, 
  ArcElement, 
  LineController, 
  LineElement, 
  PointElement,
  PieController, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  ArcElement,
  LineController,
  LineElement,
  PointElement,
  PieController,
  Title,
  Tooltip,
  Legend
);

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routeConfig),
    provideHttpClient(
      withInterceptors([customAuthInterceptor]),
      withFetch()
    ),
    provideAnimationsAsync()
  ]
};