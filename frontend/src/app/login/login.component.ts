import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
export class LoginComponent implements OnInit {
  formGroup: FormGroup = new FormGroup({
    email: new FormControl('admin', [Validators.required]),
    password: new FormControl('admin', [Validators.required]),
  });

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Pre-populate with admin credentials
    this.formGroup.patchValue({
      email: 'admin',
      password: 'admin'
    });
  }

  // handleSubmit() {
  //   if (this.formGroup.valid) {
  //     this.authService.login({
  //       email: this.formGroup.value.email,
  //       password: this.formGroup.value.password
  //     }).subscribe({
  //       next: (result) => {
  //         console.log('Login response:', result);
  //         if (result.access_token) {
  //           localStorage.setItem("token", result.access_token);
  //           this.authService.setIsLogged(true);
  //           this.router.navigate(['/home']);
  //         } else {
  //           console.error("No access token in response");
  //           alert("Login failed. Please try again.");
  //         }
  //       },
  //       error: (error) => {
  //         console.error("Login error:", error);
  //         alert("Invalid credentials. Please try again.");
  //       }
  //     });
  //   }
  // }
  handleSubmit() {
    if (this.formGroup.valid) {
      this.authService.login({
        email: this.formGroup.value.email.toLowerCase(), // Convert to lowercase
        password: this.formGroup.value.password
      }).subscribe({
        next: (result) => {
          // console.log('Login response:', result);
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
          if (error.error?.message?.includes('not authorized')) {
            alert("You are not authorized to access this application. Please contact your administrator.");
          } else if (error.error?.message?.includes('deactivated')) {
            alert("Your account has been deactivated. Please contact your administrator.");
          } else {
            alert("Invalid credentials. Please try again.");
          }
        }
      });
    }
  }
}