import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, of } from 'rxjs';

export interface InventoryItem {
  inventoryId: string | number;
  mediaType: 'hoarding' | 'digital_screen' | 'led_screen' | 'society' | 'transit_media' | 'bus_shelter' | 'unipole';
  name: string;
  location: string;
  city: string;
  area: string;
  landmark: string;
  size: string;
  availabilityStatus: 'available' | 'booked' | 'maintenance';
  isDigital: boolean;
  latitude: number;
  longitude: number;
  rentalCost: number;
  trafficScore: number;
  imageUrls?: string[];
  videoFeedUrl?: string;
  facingDirection?: string;
  lastInspectionDate?: string;
  ownerName?: string;
  contactNumber?: string;
  [key: string]: any;
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: InventoryItem;
}

export interface GeoJSONResponse {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface InventoryFilters {
  mediaType?: string;
  city?: string;
  availabilityStatus?: string;
  isDigital?: boolean;
  minTrafficScore?: number;
  bounds?: string; // "minLng,minLat,maxLng,maxLat"
}

const LIMIT_CITIES = 500;
const LIMIT_TRENDING = 150;
const LIMIT_DEFAULT_MAP = 200;
const LIMIT_CITY = 500;

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private baseUrl = 'http://localhost:8080/inventory';
  private hoardingsUrl = 'http://localhost:8080/hoardings';
  private screensUrl = 'http://localhost:8080/screens';
  private societiesUrl = 'http://localhost:8080/societies';

  constructor(private http: HttpClient) { }

  /**
   * Get inventory for a city from existing backend APIs only (hoardings, screens, societies).
   * No separate API — used for Inventory Map city search. Empty city returns no features.
   */
  getInventoryByCity(city: string): Observable<GeoJSONResponse> {
    const cityTrim = city.trim();
    if (!cityTrim) {
      return of({ type: 'FeatureCollection', features: [] });
    }
    const params = new HttpParams().set('city', cityTrim).set('limit', String(LIMIT_CITY));
    const hoardings$ = this.http.get<any[]>(this.hoardingsUrl, { params }).pipe(catchError(() => of([])));
    const screens$ = this.http.get<any>(this.screensUrl, { params }).pipe(
      map((res: any) => this.screensToArray(res)),
      catchError(() => of([]))
    );
    const societies$ = this.http.get<any[]>(this.societiesUrl, { params }).pipe(catchError(() => of([])));

    return forkJoin({ hoardings: hoardings$, screens: screens$, societies: societies$ }).pipe(
      map(({ hoardings, screens, societies }) => ({
        type: 'FeatureCollection' as const,
        features: this.mergeToFeatures(hoardings ?? [], screens ?? [], societies ?? [])
      }))
    );
  }

  /**
   * Get default map data: hoardings, digital screens, and societies (no city filter).
   * Used so the map shows all three types by default on load.
   */
  getInventoryDefault(): Observable<GeoJSONResponse> {
    const params = new HttpParams().set('limit', String(LIMIT_DEFAULT_MAP));
    const hoardings$ = this.http.get<any[]>(this.hoardingsUrl, { params }).pipe(catchError(() => of([])));
    const screens$ = this.http.get<any>(this.screensUrl, { params }).pipe(
      map((res: any) => this.screensToArray(res)),
      catchError(() => of([]))
    );
    const societies$ = this.http.get<any[]>(this.societiesUrl, { params }).pipe(catchError(() => of([])));

    return forkJoin({ hoardings: hoardings$, screens: screens$, societies: societies$ }).pipe(
      map(({ hoardings, screens, societies }) => ({
        type: 'FeatureCollection' as const,
        features: this.mergeToFeatures(hoardings ?? [], screens ?? [], societies ?? [])
      }))
    );
  }

  /**
   * Get cities with coordinates from hoardings, screens, societies (for quick city buttons).
   */
  getCities(): Observable<{ city: string; lat: number; lng: number }[]> {
    const params = new HttpParams().set('limit', String(LIMIT_CITIES));
    const hoardings$ = this.http.get<any[]>(this.hoardingsUrl, { params }).pipe(catchError(() => of([])));
    const screens$ = this.http.get<any>(this.screensUrl, { params }).pipe(
      map((res: any) => this.screensToArray(res)),
      catchError(() => of([]))
    );
    const societies$ = this.http.get<any[]>(this.societiesUrl, { params }).pipe(catchError(() => of([])));

    return forkJoin({ hoardings: hoardings$, screens: screens$, societies: societies$ }).pipe(
      map(({ hoardings, screens, societies }) => {
        const byCity = new Map<string, { lat: number; lng: number; count: number }>();
        const add = (name: string, lat: number, lng: number) => {
          if (!name || lat == null || lng == null) return;
          const key = String(name).trim();
          if (!key) return;
          const existing = byCity.get(key);
          if (existing) {
            existing.lat += lat;
            existing.lng += lng;
            existing.count += 1;
          } else {
            byCity.set(key, { lat, lng, count: 1 });
          }
        };
        (hoardings || []).forEach((h: any) => add(h.city, Number(h.latitude), Number(h.longitude)));
        (Array.isArray(screens) ? screens : []).forEach((s: any) => {
          add(s.City ?? s.city, Number(s.Latitude ?? s.latitude), Number(s.Longitude ?? s.longitude));
        });
        (societies || []).forEach((s: any) => add(s.s_city, Number(s.s_lat), Number(s.s_long)));
        return Array.from(byCity.entries())
          .map(([city, v]) => ({ city, lat: v.lat / v.count, lng: v.lng / v.count }))
          .sort((a, b) => a.city.localeCompare(b.city));
      })
    );
  }

  /**
   * Get trending items from hoardings, screens, societies (for sidebar).
   */
  getTrending(limit: number = 10): Observable<InventoryItem[]> {
    const params = new HttpParams().set('limit', String(LIMIT_TRENDING));
    const hoardings$ = this.http.get<any[]>(this.hoardingsUrl, { params }).pipe(catchError(() => of([])));
    const screens$ = this.http.get<any>(this.screensUrl, { params }).pipe(
      map((res: any) => this.screensToArray(res)),
      catchError(() => of([]))
    );
    const societies$ = this.http.get<any[]>(this.societiesUrl, { params }).pipe(catchError(() => of([])));

    return forkJoin({ hoardings: hoardings$, screens: screens$, societies: societies$ }).pipe(
      map(({ hoardings, screens, societies }) => {
        const items: InventoryItem[] = [];
        (hoardings || []).forEach((h: any) => {
          if (h.latitude != null && h.longitude != null) {
            const f = this.hoardingToFeature(h);
            items.push({ ...f.properties, latitude: h.latitude, longitude: h.longitude });
          }
        });
        (Array.isArray(screens) ? screens : []).forEach((s: any) => {
          const lat = s.Latitude ?? s.latitude;
          const lng = s.Longitude ?? s.longitude;
          if (lat != null && lng != null) {
            const f = this.screenToFeature(s);
            items.push({ ...f.properties, latitude: lat, longitude: lng });
          }
        });
        (societies || []).forEach((s: any) => {
          const lat = s.s_lat ?? s.latitude;
          const lng = s.s_long ?? s.longitude;
          if (lat != null && lng != null) {
            const f = this.societyToFeature(s);
            items.push({ ...f.properties, latitude: lat, longitude: lng });
          }
        });
        return items.sort((a, b) => (b.trafficScore ?? 0) - (a.trafficScore ?? 0)).slice(0, limit);
      })
    );
  }

  /** Normalize screens API response to array. */
  private screensToArray(res: any): any[] {
    return Array.isArray(res) ? res : (res?.data ?? []);
  }

  /** Merge hoardings, screens, societies into GeoJSON features (single place for merge logic). */
  private mergeToFeatures(
    hoardings: any[],
    screens: any[],
    societies: any[]
  ): GeoJSONFeature[] {
    const features: GeoJSONFeature[] = [];
    (hoardings || []).forEach((h) => {
      if (h.latitude != null && h.longitude != null) features.push(this.hoardingToFeature(h));
    });
    (screens || []).forEach((s) => {
      const lat = s.Latitude ?? s.latitude;
      const lng = s.Longitude ?? s.longitude;
      if (lat != null && lng != null) features.push(this.screenToFeature(s));
    });
    (societies || []).forEach((s) => {
      const lat = s.s_lat ?? s.latitude;
      const lng = s.s_long ?? s.longitude;
      if (lat != null && lng != null) features.push(this.societyToFeature(s));
    });
    return features;
  }

  private hoardingToFeature(h: any): GeoJSONFeature {
    const lat = Number(h.latitude);
    const lng = Number(h.longitude);
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: {
        inventoryId: h.h_id,
        mediaType: 'hoarding',
        name: h.h_name,
        location: [h.address, h.city, h.State].filter(Boolean).join(', '),
        city: h.city ?? '',
        area: h.address ?? '',
        landmark: h.address ?? '',
        size: h.size ?? '',
        availabilityStatus: (h.status ?? 'available') as any,
        isDigital: false,
        latitude: lat,
        longitude: lng,
        rentalCost: Number(h.rental_cost) || 0,
        trafficScore: h.featured ? 85 : (h.status === 'available' ? 70 : 50),
        // ownerName: h.owner_name,
        // contactNumber: h.contact_number
      }
    };
  }

  private screenToFeature(s: any): GeoJSONFeature {
    const lat = Number(s.Latitude ?? s.latitude);
    const lng = Number(s.Longitude ?? s.longitude);
    // LED only when type explicitly contains "led"; "digital" alone stays digital_screen
    const rawType = String(s.ScreenType ?? s.screenType ?? '');
    const isLed = /\bled\b/i.test(rawType);
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: {
        inventoryId: s.ScreenID ?? s.screenID,
        mediaType: isLed ? 'led_screen' : 'digital_screen',
        name: s.ScreenName ?? s.screenName ?? '',
        location: [s.Location, s.City, s.State].filter(Boolean).join(', '),
        city: s.City ?? s.city ?? '',
        area: s.Location ?? s.location ?? '',
        landmark: s.Location ?? '',
        size: s.Size ?? s.size ?? '',
        availabilityStatus: (s.Status ?? s.status ?? 'available') as any,
        isDigital: true,
        latitude: lat,
        longitude: lng,
        rentalCost: Number(s.RentalCost ?? s.rentalCost) || 0,
        trafficScore: s.featured ? 90 : (s.Status === 'available' ? 75 : 60),
        // ownerName: s.OwnerName ?? s.ownerName,
        // contactNumber: s.ContactNumber ?? s.contactNumber
      }
    };
  }

  private societyToFeature(s: any): GeoJSONFeature {
    const lat = Number(s.s_lat ?? s.latitude);
    const lng = Number(s.s_long ?? s.longitude);
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: {
        inventoryId: s.s_id,
        mediaType: 'society',
        name: s.s_name ?? '',
        location: [s.s_address, s.s_city].filter(Boolean).join(', '),
        city: s.s_city ?? '',
        area: s.s_area ?? '',
        landmark: s.s_address ?? '',
        size: s.s_no_flats ? `${s.s_no_flats} flats` : '',
        availabilityStatus: (s.approval_status ?? 'available') as any,
        isDigital: false,
        latitude: lat,
        longitude: lng,
        rentalCost: Number(s.actual_cost) || 0,
        actual_cost: Number(s.actual_cost) || 0,
        trafficScore: 60,
        // ownerName: s.s_contact_person_name,
        // contactNumber: s.s_contact_num
      }
    };
  }

  /**
   * Get all inventory items with optional filters (unified inventory API — optional)
   */
  getInventory(filters?: InventoryFilters): Observable<GeoJSONResponse> {
    let params = new HttpParams();
    if (filters) {
      if (filters.mediaType) params = params.set('mediaType', filters.mediaType);
      if (filters.city) params = params.set('city', filters.city);
      if (filters.availabilityStatus) params = params.set('availabilityStatus', filters.availabilityStatus);
      if (filters.isDigital !== undefined) params = params.set('isDigital', filters.isDigital.toString());
      if (filters.minTrafficScore) params = params.set('minTrafficScore', filters.minTrafficScore.toString());
      if (filters.bounds) params = params.set('bounds', filters.bounds);
    }
    return this.http.get<GeoJSONResponse>(this.baseUrl, { params });
  }

  /**
   * Get single inventory item by ID
   */
  getInventoryItem(id: string | number): Observable<InventoryItem> {
    return this.http.get<InventoryItem>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get trending/high-traffic inventory items (unified API — optional; map uses getTrending() from 3 APIs)
   */
  getTrendingInventory(limit: number = 10): Observable<InventoryItem[]> {
    return this.http.get<InventoryItem[]>(`${this.baseUrl}/trending`, {
      params: new HttpParams().set('limit', limit.toString())
    });
  }

  /**
   * Update inventory item status
   */
  updateStatus(id: string | number, status: 'available' | 'booked' | 'maintenance'): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/status`, { availabilityStatus: status });
  }
}

