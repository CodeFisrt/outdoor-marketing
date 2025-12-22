import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  
    private apiUrl = 'http://localhost:8080/api';

      constructor(private http:HttpClient){}

      sendContactForm(data:any):Observable<any>{
        return this.http.post(`${this.apiUrl}/contact`,data)
      }
      sendMail(data:any):Observable<any>{
         return this.http.post(`${this.apiUrl}/send-mail`, data);
      }
}
