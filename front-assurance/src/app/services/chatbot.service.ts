import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private apiUrl = 'http://localhost:3000/api/chat';
  startDate: any;
  endDate: any;
  chatbotService: any;
  hasMore: any;

  constructor(
    private http: HttpClient,
     private authService: AuthService) {}

  sendMessage(message: string): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.post<any>(this.apiUrl, { message }, { headers });
  }
 getMyMessages() {
  const token = localStorage.getItem('auth_token');
  const headers = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  return this.http.get<any[]>('http://localhost:3000/api/messages/me', headers);
}
private getAuthHeaders(): { headers: HttpHeaders } {
  const token = localStorage.getItem('token');
  return {
    headers: new HttpHeaders({
      Authorization: `Bearer ${token}`
    })
  };
  
}
getAgentMessages(): Observable<any> {
  const token = this.authService.getToken();
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  return this.http.get<any>('http://localhost:3000/api/messages', { headers });
}

getAllMessages(): Observable<{ messages: any[], hasMore: boolean }> {
  const token = this.authService.getToken();
  const headers = new HttpHeaders().set('Authorization', 'Bearer ' + token);
  return this.http.get<{ messages: any[], hasMore: boolean }>('http://localhost:3000/api/messages', { headers });
}


getPaginatedMessages(page: number, limit: number): Observable<any[]> {
  const token = this.authService.getToken();
  const headers = new HttpHeaders().set('Authorization', 'Bearer ' + token);
  const params = { page: page.toString(), limit: limit.toString() };

  return this.http.get<any[]>('http://localhost:3000/api/messages', { headers, params });
}



getMessages(page: number): Observable<{ messages: any[], hasMore: boolean }> {
  const headers = new HttpHeaders().set('Authorization', 'Bearer ' + this.authService.getToken());
  return this.http.get<{ messages: any[], hasMore: boolean }>(
    `http://localhost:3000/api/messages?page=${page}`,
    { headers }
  );
}


getClientHistory(clientId: number) {
  const token = this.authService.getToken();
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  return this.http.get(`http://localhost:3000/api/messages/client/${clientId}`, { headers });
}



getMyHistory(page: number, startDate?: string, endDate?: string) {
  const token = localStorage.getItem('auth_token');
  const headers = { Authorization: `Bearer ${token}` };
  let url = `http://localhost:3000/api/messages/me?page=${page}`;

  if (startDate && endDate) {
    url += `&startDate=${startDate}&endDate=${endDate}`;
  }

  return this.http.get(url, { headers });
}




getClientHistoryPaginated(clientId: number, page: number) {
  const token = localStorage.getItem('auth_token');
  const headers = { Authorization: `Bearer ${token}` };
  return this.http.get(`http://localhost:3000/api/messages/client/${clientId}?page=${page}`, { headers });
}

getMyHistoryPaginated(page: number) {
  const token = localStorage.getItem('auth_token');
  const headers = { Authorization: `Bearer ${token}` };
  return this.http.get(`http://localhost:3000/api/messages/me?page=${page}`, { headers });
}
getHistoryByDate(date: Date) {
  const token = this.authService.getToken();
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  const params = { date: date.toISOString().split('T')[0] }; // format yyyy-mm-dd

  return this.http.get('http://localhost:3000/api/messages/historyByDate', { headers, params });
}

getHistoryByDateRange(start: Date, end: Date) {
  const token = this.authService.getToken();
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  const params = {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };

  return this.http.get('http://localhost:3000/api/messages/historyByRange', { headers, params });
}
applyFilter() {
  if (!this.startDate) {
    alert("Veuillez sélectionner la date de début.");
    return;
  }
  if (!this.endDate) {
    alert("Veuillez sélectionner la date de fin.");
    return;
  }

  const start = new Date(this.startDate);
  const end = new Date(this.endDate);

  if (start > end) {
    alert("La date de début ne peut pas être après la date de fin.");
    return;
  }

  // ✅ Ici tu appelles le service
  this.chatbotService.getHistoryByDateRange(start, end).subscribe((data: any) => {
    console.log("📦 Résultat filtre :", data);
    this.getMessages = data.pairs;
    this.hasMore = data.hasMore;
  });
}
getHistoryByDates(startDate: string, endDate: string) {
  const token = localStorage.getItem('auth_token');
  const headers = { Authorization: `Bearer ${token}` };

  return this.http.get(`http://localhost:3000/api/messages/filter?start=${startDate}&end=${endDate}`, { headers });
}
getAllMyHistory() {
  const token = localStorage.getItem('auth_token');
  const headers = { Authorization: `Bearer ${token}` };

  return this.http.get(`http://localhost:3000/api/messages/me/all`, { headers });
}
getAgentClients() {
  const token = this.authService.getToken();
  const headers = { Authorization: `Bearer ${token}` };
  return this.http.get<any>('http://localhost:3000/api/agent/clients', { headers });
}

getClientHistoryByDateRange(clientId: number, start: string, end: string) {
  const token = this.authService.getToken();
  const headers = { Authorization: `Bearer ${token}` };
  return this.http.get<any>(
    `http://localhost:3000/api/messages/client/${clientId}?start=${start}&end=${end}`,
    { headers }
  );
}
getAllAgents(): Observable<any[]> {
  const token = this.authService.getToken();
  const headers = new HttpHeaders().set('Authorization', 'Bearer ' + token);
  return this.http.get<any[]>('http://localhost:3000/api/admin/agents', { headers });
}


getAllClients(): Observable<any[]> {
  const token = this.authService.getToken();
  const headers = new HttpHeaders().set('Authorization', 'Bearer ' + token);
  return this.http.get<any[]>('http://localhost:3000/api/admin/clients', { headers });
}
getClientsByAgent(agentId: number): Observable<any[]> {
  const token = this.authService.getToken();
  const headers = new HttpHeaders().set('Authorization', 'Bearer ' + token);
  return this.http.get<any[]>(`http://localhost:3000/api/admin/clients/by-agent/${agentId}`, { headers });
}

getMessagesFiltered(agentId: number, clientId: number, startDate: string, endDate: string) {
  const token = this.authService.getToken();
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  const params: any = {};
  if (agentId) params.agentId = agentId;
  if (clientId) params.clientId = clientId;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  return this.http.get<{ messages: any[] }>('http://localhost:3000/api/messages/filter', { headers, params });
}

}
