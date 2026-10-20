import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ClientGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    
    const role = this.auth.getUserRole();
console.log("Role actuel dans ClientGuard:", role);

    if (role && role === 'client') {
      return true;
    } else {
      console.warn('Accès refusé : rôle actuel =', role);
      this.router.navigate(['/login']);
      return false;
    }
    
  }
}
