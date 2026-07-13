import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { AvatarComponent } from '../avatar/avatar.component';
import { AuthService } from '../../Auth/services/auth.service';

@Component({
  selector: 'app-header-user',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  template: `
    <div class="header-user" *ngIf="user?.name">
      <span class="header-welcome">Welcome,</span>
      <span class="header-username">{{ user.name }}</span>
      <app-avatar [name]="user.name"></app-avatar>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      align-items: center;
    }
    .header-user {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .header-welcome {
      font-size: 0.8125rem;
      font-weight: 400;
      color: #9ca3af;
    }
    .header-username {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #374151;
    }
  `]
})
export class HeaderUserComponent implements OnInit {
  user: any = {};

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.islogged.subscribe(isLogged => {
      if (isLogged) this.loadUser();
    });
    this.loadUser();
  }

  loadUser(): void {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        this.user = jwtDecode(token);
      } catch {
        this.user = {};
      }
    }
  }
}
