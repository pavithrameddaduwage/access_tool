import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router';


const userRole: string = 'Admin'
export const AuthGuard: CanActivateFn = (
  next: ActivatedRouteSnapshot,
  state: RouterStateSnapshot) => {
    // console.log(next.url[0].path)
  if (userRole !== 'Admin')
    return false
  else {
    return true
  }
}