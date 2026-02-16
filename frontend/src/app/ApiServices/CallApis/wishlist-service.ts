import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WishlistItem {
    wishlist_id: number;
    user_id: string | number;
    screen_id?: number | null;
    h_id?: number | null;
    s_id?: number | null;
    itemType: 'screen' | 'hoarding' | 'society';
    name: string;
    location: string;
    price: number;
    imageUrl?: string;
    created_at: string;
}

@Injectable({
    providedIn: 'root'
})
export class WishlistService {
    private baseUrl = 'http://localhost:8080/wishlist';
    cache: any;

    constructor(private http: HttpClient) { }

    addToWishlist(data: { user_id: string | number; h_id?: any; s_id?: any; screen_id?: any }): Observable<any> {
        return this.http.post(this.baseUrl, data);
    }

    getWishlistByUser(userId: string | number): Observable<WishlistItem[]> {
        return this.http.get<WishlistItem[]>(`${this.baseUrl}/${userId}`);
    }

    removeFromWishlist(userId: string | number, itemId: number): Observable<any> {
        return this.http.delete(`${this.baseUrl}/${userId}/${itemId}`);
    }

    // ✅ Search users for sharing
    searchUsers(query: string): Observable<any[]> {
        return this.http.get<any[]>(`http://localhost:8080/users/search?query=${query}`);
    }

    // ✅ Share wishlist items
    shareWishlistItems(payload: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/share`, payload);
    }
}
