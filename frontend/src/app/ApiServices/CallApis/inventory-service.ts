import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InventoryItem {
  inventoryId: string | number;
  mediaType: 'hoarding' | 'digital_screen' | 'led_screen' | 'transit_media' | 'bus_shelter' | 'unipole';
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

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private baseUrl = 'http://localhost:8080/inventory';

  constructor(private http: HttpClient) {}

  /**
   * Get all inventory items with optional filters
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
   * Get trending/high-traffic inventory items
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

