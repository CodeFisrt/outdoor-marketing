import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { Hoarding } from '../../Model/model';

@Injectable({
  providedIn: 'root'
})
export class HoardingService {

  private baseUrl = 'http://localhost:8080/hoardings';

  // ✅ cached observable
  private hoardings$!: Observable<Hoarding[]>;

  constructor(private http: HttpClient) { }

  // ✅ API CALLED ONLY ONCE
  getAllHoardings(): Observable<Hoarding[]> {
    if (!this.hoardings$) {
      this.hoardings$ = this.http.get<Hoarding[]>(this.baseUrl).pipe(
        shareReplay(1) // 🔥 cache last response
      );
    }
    return this.hoardings$;
  }

  // ❗ reset cache when data changes
  refreshHoardings() {
    this.hoardings$ = undefined as any;
  }

  deleteHoardingById(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
  }

  addHoarding(obj: any): Observable<any> {
    return this.http.post(this.baseUrl, obj);
  }

  updateHoarding(id: number, obj: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, obj);
  }

  getHoardingAnalytics(id: number): Observable<any> {
    return this.http.get<any>(`http://localhost:8080/api/analytics/${id}`);
  }

  calculateAnalytics(id: number): Observable<any> {
    return this.http.get<any>(`http://localhost:8080/api/analytics/calculate/${id}`);
  }
}
