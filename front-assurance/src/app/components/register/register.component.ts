import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
   standalone: true,
  imports:[CommonModule, FormsModule,]
})
export class RegisterComponent {
  username = '';
  password = '';
  region = '';
  
  agentId: number | null = null;
  role = 'client'; 

  agents: any[] = [];            

  regions = ['Sud', 'Nord', 'Centre'];

  successMessage = '';
  errorMessage = '';

  constructor(private http: HttpClient) {}

  onRegionChange() {
  if (!this.region) return;

  this.http.get<any[]>(`http://localhost:3000/api/agents?region=${this.region}`)
    .subscribe({
      next: (data) => this.agents = data,
      error: () => this.errorMessage = 'Erreur lors du chargement des agents'
    });
}


  onRegister() {
    const body = {
      username: this.username,
      password: this.password,
      region: this.region,
      agent_id: this.agentId
    };

    this.http.post('http://localhost:3000/api/register', body)
      .subscribe({
        next: () => {
          this.successMessage = 'Inscription réussie !';
          this.errorMessage = '';
        },
        error: (err) => {
          this.successMessage = '';
          this.errorMessage = err.error?.error || 'Échec de l’inscription';
        }
      });
  }
  onRoleChange() {
  if (this.role !== 'client') {
    this.agents = [];
    this.agentId = null;
  }
}

}
