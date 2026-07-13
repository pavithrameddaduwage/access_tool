import { Component, OnInit } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../Auth/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  user: any = {};
  isloggedIn = false;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.islogged.subscribe(isLogged => {
      this.isloggedIn = isLogged;
      if (isLogged) this.checkLoginStatus();
    });
    this.checkLoginStatus();
  }

  checkLoginStatus(): void {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        this.user = jwtDecode(token);
        this.isloggedIn = true;
      } catch {
        this.logout();
      }
    }
  }

  get isAdmin(): boolean {
    return this.user?.roles?.some((r: string) =>
      r.toLowerCase() === 'admin'
    );
  }

  logout(): void {
    this.authService.logout();
    this.isloggedIn = false;
    this.user = {};
    this.router.navigate(['/login']);
  }
}