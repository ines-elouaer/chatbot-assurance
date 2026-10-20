import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class StatsService {

  constructor(private http: HttpClient) {}

  getStats(periode: string) {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.get(`http://localhost:3000/api/agent/stats?periode=${periode}`, { headers });
  }
   getAgentStats() {
    const token = localStorage.getItem('auth_token');
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.get<any>('http://localhost:3000/api/agent/stats', { headers });
  }
  getUserRole(): string | null {
  const token = localStorage.getItem('token');
  if (!token) return null;

  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.role; // adapte selon ta structure de payload
}


}
