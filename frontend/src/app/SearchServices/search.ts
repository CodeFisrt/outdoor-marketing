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

  getServiceDetails(type: string, id: number): Observable<any> {
    let endpoint = '';
    switch (type) {
      case 'balloon_marketing':
        endpoint = 'balloons';
        break;
      case 'society_marketing':
        endpoint = 'societies';
        break;
      case 'vehicle_marketing':
        endpoint = 'vehicles';
        break;
      case 'hoardings':
        endpoint = 'hoardings';
        break;
      case 'outdoormarketingscreens':
        endpoint = 'screens';
        break;
      default:
        console.error('Unknown service type:', type);
        throw new Error('Unknown service type');
    }
    return this.http.get(`http://localhost:8080/${endpoint}/${id}`);
  }

  bookService(data: any): Observable<any> {
    return this.http.post('http://localhost:8080/book-service', data);
  }

}
