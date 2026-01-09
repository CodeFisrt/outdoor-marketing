import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class Featuredservice {

  hoardings: any[] = [];
  screens: any[] = [];
  vehicles: any[] = [];
  polls: any[] = [];
  societies: any[] = [];

  constructor(private http: HttpClient) { }

  // ============================
  // Load all data once (cache)
  // ============================
  loadAll() {
    this.loadHoardings();
    this.loadScreens();
    this.loadVehicles();
    this.loadPolls();
    this.loadSocieties();
  }

  loadHoardings() {
    if (this.hoardings.length) return;

    this.http.get<any[]>('http://localhost:8080/hoardings')
      .subscribe(res => {
        this.hoardings = res.filter(h => h.featured === 1);
      });
  }

  loadScreens() {
    if (this.screens.length) return;

    this.http.get<any>('http://localhost:8080/screens')
      .subscribe(res => {
        this.screens = res.data?.filter((s: any) => s.featured === 1) || [];
      });
  }

  loadVehicles() {
    if (this.vehicles.length) return;

    this.http.get<any[]>('http://localhost:8080/vehicles')
      .subscribe(res => {
        this.vehicles = res.filter(v => v.featured === 1);
      });
  }

  loadPolls() {
    if (this.polls.length) return;

    this.http.get<any[]>('http://localhost:8080/balloons')
      .subscribe(res => {
        this.polls = res.filter(p => p.featured === 1);
      });
  }

  loadSocieties() {
    if (this.societies.length) return;

    this.http.get<any[]>('http://localhost:8080/societies')
      .subscribe(res => {
        this.societies = res.filter(s => s.featured === 1);
      });
  }

  // ============================
  // Get FULL data by type
  // ============================
  getAllByType(type: string): any[] {
    switch (type) {
      case 'hoardings': return this.hoardings;
      case 'screens': return this.screens;
      case 'vehicles': return this.vehicles;
      case 'polls': return this.polls;
      case 'societies': return this.societies;
      default: return [];
    }
  }
}
