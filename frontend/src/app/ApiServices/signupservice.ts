import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Signupservice {
 private apiUrl = "http://localhost:8080/signup";

  constructor(private http: HttpClient) {}

  post(data: any) {
    return this.http.post(this.apiUrl, data);
  }
}
