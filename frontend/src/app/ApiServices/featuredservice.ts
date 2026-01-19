import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class Featuredservice {

  private hoardings$ = new BehaviorSubject<any[]>([]);
  private screens$ = new BehaviorSubject<any[]>([]);
  // private vehicles$ = new BehaviorSubject<any[]>([]);
  // private polls$ = new BehaviorSubject<any[]>([]);
  // private societies$ = new BehaviorSubject<any[]>([]);

  private hoardingsLoaded = false;
  private screensLoaded = false;

  constructor(private http: HttpClient) { }

  loadHoardings() {
    if (this.hoardingsLoaded) return;

    this.hoardingsLoaded = true;

    this.http.get<any[]>('http://localhost:8080/hoardings')
      .subscribe({
        next: res => {
          this.hoardings$.next(res.filter(h => h.featured === 1));
        },
        error: () => {
          this.hoardingsLoaded = false; // allow retry
        }
      });
  }

  loadScreens() {
    if (this.screensLoaded) return;

    this.screensLoaded = true;

    this.http.get<any>('http://localhost:8080/screens')
      .subscribe({
        next: res => {
          this.screens$.next(res.data?.filter((s: any) => s.featured === 1) || []);
        },
        error: () => {
          this.screensLoaded = false;
        }
      });
  }

  // loadVehicles() {
  //   if (this.vehicles$.value.length) return;

  //   this.http.get<any[]>('http://localhost:8080/vehicles')
  //     .subscribe(res => {
  //       this.vehicles$.next(res.filter(v => v.featured === 1));
  //     });
  // }

  // loadPolls() {
  //   if (this.polls$.value.length) return;

  //   this.http.get<any[]>('http://localhost:8080/balloons')
  //     .subscribe(res => {
  //       this.polls$.next(res.filter(p => p.featured === 1));
  //     });
  // }

  // loadSocieties() {
  //   if (this.societies$.value.length) return;

  //   this.http.get<any[]>('http://localhost:8080/societies')
  //     .subscribe(res => {
  //       this.societies$.next(res.filter(s => s.featured === 1));
  //     });
  // }

  loadAll() {
    this.loadHoardings();
    this.loadScreens();
    // this.loadVehicles();
    // this.loadPolls();
    // this.loadSocieties();
  }

  // Expose observables
  getHoardings() { return this.hoardings$.asObservable(); }
  getScreens() { return this.screens$.asObservable(); }
  // getVehicles() { return this.vehicles$.asObservable(); }
  // getPolls() { return this.polls$.asObservable(); }
  // getSocieties() { return this.societies$.asObservable(); }

  getByType(type: string) {
    switch (type) {
      case 'hoardings': return this.getHoardings();
      case 'screens': return this.getScreens();
      // case 'vehicles': return this.getVehicles();
      // case 'polls': return this.getPolls();
      // case 'societies': return this.getSocieties();
      default: throw new Error('Invalid type');
    }
  }
}