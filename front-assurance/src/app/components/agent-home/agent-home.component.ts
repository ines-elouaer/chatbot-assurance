import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-agent-home',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterModule],
  templateUrl: './agent-home.component.html',
  
  styleUrl: './agent-home.component.scss'
})
export class AgentHomeComponent {

  constructor(private router: Router, public authService: AuthService) {}
  

  gotoDashboard() {
    this.router.navigate(['/agent/dashboard']);
  }

  gotoHistorique() {
    this.router.navigate(['/agent/historique']);
  }
 logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
