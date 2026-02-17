import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, of } from 'rxjs';

export interface InventoryItem {
  inventoryId: string | number;
  mediaType: 'hoarding' | 'digital_screen' | 'led_screen' | 'society';
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

@Injectable({
  providedIn: 'root'
})
export class InventoryService {

  private baseUrl = 'http://localhost:8080/inventory';
  private hoardingsUrl = 'http://localhost:8080/hoardings';
  private screensUrl = 'http://localhost:8080/screens';
  private societiesUrl = 'http://localhost:8080/societies';

  constructor(private http: HttpClient) { }

  // ===============================
  // SAFE IMAGE PARSER (GLOBAL)
  // ===============================
  private parseImages(img: any): string[] {
    if (!img) return [];
    try {
      return JSON.parse(img);
    } catch {
      return [img];
    }
  }

  // ===============================
  // HOARDING → FEATURE
  // ===============================
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
        imageUrls: this.parseImages(h.image), // ✅ FIX
        ownerName: h.owner_name,
        contactNumber: h.contact_number
      }
    };
  }

  // ===============================
  // SCREEN → FEATURE
  // ===============================
  private screenToFeature(s: any): GeoJSONFeature {
    const lat = Number(s.Latitude ?? s.latitude);
    const lng = Number(s.Longitude ?? s.longitude);

    const rawType = String(s.ScreenType ?? '');
    const isLed = /\bled\b/i.test(rawType);

    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: {
        inventoryId: s.ScreenID,
        mediaType: isLed ? 'led_screen' : 'digital_screen',
        name: s.ScreenName,
        location: [s.Location, s.City, s.State].filter(Boolean).join(', '),
        city: s.City ?? '',
        area: s.Location ?? '',
        landmark: s.Location ?? '',
        size: s.Size ?? '',
        availabilityStatus: (s.Status ?? 'available') as any,
        isDigital: true,
        latitude: lat,
        longitude: lng,
        rentalCost: Number(s.RentalCost) || 0,
        trafficScore: s.featured ? 90 : (s.Status === 'available' ? 75 : 60),
        imageUrls: this.parseImages(s.Image ?? s.image), // ✅ FIX
        ownerName: s.OwnerName,
        contactNumber: s.ContactNumber
      }
    };
  }

  // ===============================
  // SOCIETY → FEATURE
  // ===============================
  private societyToFeature(s: any): GeoJSONFeature {
    const lat = Number(s.s_lat);
    const lng = Number(s.s_long);

    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: {
        inventoryId: s.s_id,
        mediaType: 'society',
        name: s.s_name,
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
        trafficScore: 60,
        imageUrls: this.parseImages(s.image), // ✅ FIX
        ownerName: s.s_contact_person_name,
        contactNumber: s.s_contact_num
      }
    };
  }

  // ===============================
  // DEFAULT MAP LOAD
  // ===============================
  getInventoryDefault(): Observable<GeoJSONResponse> {
    return forkJoin({
      hoardings: this.http.get<any[]>(this.hoardingsUrl).pipe(catchError(() => of([]))),
      screens: this.http.get<any[]>(this.screensUrl).pipe(catchError(() => of([]))),
      societies: this.http.get<any[]>(this.societiesUrl).pipe(catchError(() => of([])))
    }).pipe(
      map(({ hoardings, screens, societies }) => ({
        type: 'FeatureCollection' as const,
        features: [
          ...hoardings.map(h => this.hoardingToFeature(h)),
          ...screens.map(s => this.screenToFeature(s)),
          ...societies.map(s => this.societyToFeature(s))
        ]
      }))
    );
  }

  // ===============================
  // UNIFIED INVENTORY API
  // ===============================
  getInventory(): Observable<GeoJSONResponse> {
    return this.http.get<GeoJSONResponse>(this.baseUrl);
  }

  getInventoryItem(id: string | number): Observable<InventoryItem> {
    return this.http.get<InventoryItem>(`${this.baseUrl}/${id}`);
  }

  updateStatus(id: string | number, status: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/status`, { availabilityStatus: status });
  }
}
