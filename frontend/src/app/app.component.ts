import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './navbar/navbar.component';
import { ToastComponent } from './toast/toast.component';
import { ConfirmationComponent } from './confirmation/confirmation.component';
import { HeaderUserComponent } from './components/header-user/header-user.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    RouterOutlet,
    RouterModule,
    ToastComponent,
    ConfirmationComponent,
    HeaderUserComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  sidebarOpen = false;
  currentUrl = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.currentUrl = e.urlAfterRedirects;
        this.sidebarOpen = false;
      });
    this.currentUrl = this.router.url;
  }

  isLoginPage(): boolean {
    return this.currentUrl === '/login' || this.currentUrl === '/';
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }
}