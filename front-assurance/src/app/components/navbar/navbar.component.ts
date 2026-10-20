import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
   styleUrls: ['./navbar.component.scss'],
    standalone: true,
   imports:[CommonModule, FormsModule]
})
export class NavbarComponent {
  constructor(private authService: AuthService, private router: Router) {}
isLoggedIn(): boolean {
    return this.authService.isLoggedIn(); 
  }
  isAdminOrAgent(): boolean {
    const role = localStorage.getItem('user_role');
    return role === 'admin' || role === 'agent';
  }
   

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
