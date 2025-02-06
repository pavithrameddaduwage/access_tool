import { HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs/operators';

export const customAuthInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('Interceptor triggered');
  console.log('Original request:', req.url);
  
  let token = localStorage.getItem('token');
  console.log('Found token:', token ? 'Yes' : 'No');

  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Added token to request');
    
    return next(clonedRequest).pipe(
      tap({
        next: (event) => {
          console.log('Response:', event);
        },
        error: (error) => {
          console.error('Request failed:', error);
        }
      })
    );
  }

  return next(req);
};