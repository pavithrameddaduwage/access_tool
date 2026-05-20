import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  const decoded: any = jwtDecode(token);
  const requiredRole = route.data['role'];
  
  if (decoded.roles.includes(requiredRole)) {
    return true;
  } else {
    alert('You are not authorized to access this page');
    router.navigate(['/home']);
    return false;
  }
};