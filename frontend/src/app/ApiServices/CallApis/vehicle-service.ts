import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { Vehicle } from '../../Model/model';

@Injectable({
  providedIn: 'root'
})
export class VehicleService {

  private apiUrl = 'http://localhost:8080/vehicles';

  // ✅ cached observable
  private vehicles$!: Observable<Vehicle[]>;

  constructor(private http: HttpClient) { }

  // ✅ API called only once
  getAllVehicles(): Observable<Vehicle[]> {
    if (!this.vehicles$) {
      this.vehicles$ = this.http.get<Vehicle[]>(this.apiUrl).pipe(
        shareReplay(1) // 🔥 cache response
      );
    }
    return this.vehicles$;
  }

  // ❗ reset cache after CRUD
  refreshVehicles() {
    this.vehicles$ = undefined as any;
  }

  addVehicle(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  updateVehicle(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteVehicle(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
