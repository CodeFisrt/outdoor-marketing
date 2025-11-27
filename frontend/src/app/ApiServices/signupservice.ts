import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Signupservice {
  private apiUrl = "http://localhost:8080/signup";
  private signInUrl = "http://localhost:8080/Users";

  constructor(private http: HttpClient) { }

  SignUp(data: any) {
    return this.http.post(this.apiUrl, data);
  }

  signIn() {
    return this.http.get(this.signInUrl);
  }
}
