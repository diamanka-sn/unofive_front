import { Injectable } from '@angular/core';
import { AbstractService } from './abstract.service';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';

export interface ApiKeyInfo {
  hasKey: boolean;
  prefix: string | null;
  createdAt: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class UserService extends AbstractService<any>{

  constructor(http: HttpClient, matSnackbar: MatSnackBar) {
    super(http, matSnackbar);
  }

  getApiKey(): Observable<ApiKeyInfo> {
    return this['http'].get<ApiKeyInfo>(`${this.apiUrl}/users/api-key`);
  }

  // La clé complète n'est renvoyée qu'ici, une seule fois
  createApiKey(): Observable<{ key: string; prefix: string; createdAt: string }> {
    return this['http'].post<{ key: string; prefix: string; createdAt: string }>(`${this.apiUrl}/users/api-key`, {});
  }

  revokeApiKey(): Observable<void> {
    return this['http'].delete<void>(`${this.apiUrl}/users/api-key`);
  }

  deleteMyAccount(password: string): Observable<void> {
    return this['http'].delete<void>(`${this.apiUrl}/users/me`, { body: { password } });
  }
}
