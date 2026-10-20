import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  
   imports: [CommonModule,FormsModule,], 
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  messages: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any[]>('http://localhost:3000/api/messages', { headers }).subscribe({
      next: (data) => {
        console.log('✅ Messages reçus :', data);
        this.messages = data;
      },
      error: (err) => {
        console.error('❌ Erreur récupération messages :', err);
      }
    });
  }
}
