import { Component } from '@angular/core';
import { PowerBIDashboardComponent } from "../powerbi-dashboard/powerbi-dashboard.component";
import { WebtoolAnalyticsComponent } from "../webtool-analytics/webtool-analytics.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, PowerBIDashboardComponent, WebtoolAnalyticsComponent],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css'
})
export class AnalyticsComponent {
  activeDashboard: 'powerbi' | 'webtool' = 'powerbi';
  
  toggleDashboard(dashboard: 'powerbi' | 'webtool') {
    this.activeDashboard = dashboard;
  }
}