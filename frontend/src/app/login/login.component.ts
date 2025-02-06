import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { AuthService } from '../Auth/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  formGroup: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

  constructor(
    private authService: AuthService, 
    private router: Router
  ) {}

  handleSubmit() {
    if (this.formGroup.valid) {
      this.authService.login({
        email: this.formGroup.value.email,
        password: this.formGroup.value.password
      }).subscribe({
        next: (result) => {
          console.log('Login response:', result);
          if (result.access_token) {
            localStorage.setItem("token", result.access_token);
            this.authService.setIsLogged(true);
            this.router.navigate(['/home']);
          } else {
            console.error("No access token in response");
            alert("Login failed. Please try again.");
          }
        },
        error: (error) => {
          console.error("Login error:", error);
          alert("Invalid credentials. Please try again.");
        }
      });
    }
  }
}