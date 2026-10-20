import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class IntentionService {
  private apiUrl = 'http://localhost:3000/api/intentions';

  constructor(private http: HttpClient, private auth: AuthService) {}

  getIntentions(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, this.auth.getAuthHeaders());
  }

  addIntention(keyword: string, response: string, link?: string) {
  return this.http.post<any>(this.apiUrl, { keyword, response, link }, this.auth.getAuthHeaders());

}


  deleteIntention(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, this.auth.getAuthHeaders());

  }

  updateIntention(id: number, keyword: string, response: string, link?: string) {
  return this.http.put<any>(`${this.apiUrl}/${id}`, { keyword, response, link }, this.auth.getAuthHeaders());

}

}