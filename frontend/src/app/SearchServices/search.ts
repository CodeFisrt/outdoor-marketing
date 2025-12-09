import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Search {
  private apiUrl = 'http://localhost:8080/search-services';

  constructor(private http: HttpClient) { }

  



searchServices(params: any): Observable<any> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key]) httpParams = httpParams.set(key, params[key]);
    });
    return this.http.get(this.apiUrl, { params: httpParams });
  }

}
