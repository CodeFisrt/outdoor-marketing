import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BalloonService {

  private apiUrl = 'http://localhost:8080/balloons';

  // ✅ Cached observable
  private balloons$!: Observable<any[]>;

  constructor(private http: HttpClient) { }

  // ✅ API called only once (cached)
  getAllBalloons(): Observable<any[]> {
    if (!this.balloons$) {
      this.balloons$ = this.http.get<any[]>(this.apiUrl).pipe(
        shareReplay(1)
      );
    }
    return this.balloons$;
  }

  // ❗ Clear cache after CRUD
  refreshBalloons() {
    this.balloons$ = undefined as any;
  }

  // ✅ ADD
  addBalloon(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  // ✅ UPDATE
  updateBalloon(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  // ✅ DELETE
  deleteBalloon(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
