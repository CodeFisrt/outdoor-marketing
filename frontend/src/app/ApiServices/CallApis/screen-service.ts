import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScreenService {

  private baseUrl = 'http://localhost:8080/screens';

  // ✅ cache observable
  private screens$!: Observable<any>;

  constructor(private http: HttpClient) { }

  // ✅ API CALL HAPPENS ONLY ONCE
  getAllScreens(): Observable<any> {
    if (!this.screens$) {
      this.screens$ = this.http.get(this.baseUrl).pipe(
        shareReplay(1) // 🔥 cache last value
      );
    }
    return this.screens$;
  }

  // ❗ invalidate cache after write operations
  refreshScreens() {
    this.screens$ = undefined as any;
  }

  deleteScreenById(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  addNewScreen(obj: any): Observable<any> {
    return this.http.post(this.baseUrl, obj);
  }

  updateScreenById(id: number, obj: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, obj);
  }
}
