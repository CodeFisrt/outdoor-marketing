import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class Signupservice {
  private apiUrl = "http://localhost:8080/signup";
  private signInUrl = "http://localhost:8080/Users";
  private loggedIn = false;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: any
  ) { }

  SignUp(data: any) {
    return this.http.post(this.apiUrl, data);
  }

  signIn() {
    return this.http.get(this.signInUrl);
  }

  login() {
    this.loggedIn = true;
  }

  logout() {
    this.loggedIn = false;
  }

  isLoggedIn(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('role');
    }
    return false;
  }

  hasRole(role: string): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('role') === role;
    }
    return false;
  }

  canDownloadPdf(): boolean {
    return this.hasRole('user');
  }
}
