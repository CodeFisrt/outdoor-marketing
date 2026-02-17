import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private baseUrl = 'http://localhost:8080';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: any
  ) { }

  private getAdminTokenHeaders() {
    let token = '';
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('adminToken') || '';
    }
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
  }

  // ✅ ADMIN: list users
  getUsers() {
    return this.http.get<any[]>(`${this.baseUrl}/Users`, this.getAdminTokenHeaders());
  }

  // ✅ ADMIN: delete user
  deleteUser(id: number) {
    return this.http.delete(`${this.baseUrl}/Users/${id}`, this.getAdminTokenHeaders());
  }

  // ✅ ADMIN: get user by id
  getUserById(id: number) {
    return this.http.get(`${this.baseUrl}/Users/${id}`, this.getAdminTokenHeaders());
  }

  // ✅ ADMIN: create user
  createUser(payload: any) {
    return this.http.post(`${this.baseUrl}/Users/register`, payload, this.getAdminTokenHeaders());
  }

  // ✅ ADMIN: update user
  updateUser(id: number, payload: any) {
    return this.http.put(`${this.baseUrl}/Users/${id}`, payload, this.getAdminTokenHeaders());
  }
}
