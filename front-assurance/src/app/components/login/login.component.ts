import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
   standalone: true,
  imports:[CommonModule, FormsModule,]
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';
  selectedRole = ''; 

  constructor(public authService: AuthService, private router: Router) {}

  onLogin() {
  if (!this.selectedRole) {
    this.errorMessage = "Veuillez choisir un rôle.";
    return;
  }

  this.authService.login(this.username, this.password, this.selectedRole).subscribe({
    next: (res) => {
      console.log('✅ Login response :', res);
      this.authService.saveToken(res.token, this.selectedRole);

      // 🔀 Redirection selon role du token
      if (this.selectedRole === 'agent') {
        this.router.navigate(['/agent/home']);
      } else if (this.selectedRole === 'admin') {
        this.router.navigate(['/admin/dashboard']);
      } else if (this.selectedRole === 'client') {
        this.router.navigate(['/chatbot']);
      }
    },
    error: (err) => {
      console.error('Login error:', err);
      this.errorMessage = err.error?.error || 'Échec de la connexion';
    }
  });
}

}
