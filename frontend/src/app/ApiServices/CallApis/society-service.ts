import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { Society } from '../../Model/model';

@Injectable({
  providedIn: 'root'
})
export class SocietyService {

  private apiUrl = 'http://localhost:8080/societies';

  // ✅ Cached observable
  private societies$!: Observable<Society[]>;

  constructor(private http: HttpClient) { }

  // ✅ API called only once
  getAllSocieties(): Observable<Society[]> {
    if (!this.societies$) {
      this.societies$ = this.http.get<Society[]>(this.apiUrl).pipe(
        shareReplay(1)
      );
    }
    return this.societies$;
  }

  // ❗ Clear cache after CRUD
  refreshSocieties() {
    this.societies$ = undefined as any;
  }

  addSociety(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  updateSociety(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteSociety(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
