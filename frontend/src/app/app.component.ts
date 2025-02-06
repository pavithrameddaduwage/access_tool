import { Component } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './navbar/navbar.component';
import { LoginComponent } from './login/login.component';
import { DepartmentComponent } from "./masterdata/department/department.component";
import { TypeComponent } from './masterdata/type/type.component';
import { ToastComponent } from './toast/toast.component';
import { ConfirmationComponent } from "./confirmation/confirmation.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    RouterOutlet,
    RouterModule,
    LoginComponent,
    DepartmentComponent,
    TypeComponent,
    ToastComponent,
    ConfirmationComponent
],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  constructor(private router: Router) {}

  shouldShowNavbar(): boolean {
    return this.router.url !== '/login';
  }
}