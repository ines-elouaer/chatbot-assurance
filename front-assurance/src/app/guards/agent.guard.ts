import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AgentGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    const role = this.auth.getUserRole();
    console.log("AgentGuard role =", role);

    if (role === 'agent') {
      return true;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}
