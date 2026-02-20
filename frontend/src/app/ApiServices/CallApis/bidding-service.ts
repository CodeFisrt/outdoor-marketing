import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { isPlatformBrowser } from '@angular/common';

export interface Bid {
    bid_id?: number;
    product_type: 'hoarding' | 'society' | 'screen';
    product_id: string | number;
    user_id: string | number;
    userName?: string;
    amount: number;
    created_at?: Date;
}

@Injectable({
    providedIn: 'root'
})
export class BiddingService {
    private baseUrl = 'http://localhost:8080/bids';
    private socket: Socket | null = null;
    private newBidSubject = new Subject<Bid>();

    constructor(
        private http: HttpClient,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {
        if (isPlatformBrowser(this.platformId)) {
            this.initSocket();
        }
    }

    private initSocket() {
        this.socket = io('http://localhost:8080', {
            transports: ['websocket', 'polling']
        });

        this.socket.on('newBid', (bid: Bid) => {
            this.newBidSubject.next(bid);
        });
    }

    joinProductRoom(productType: string, productId: string | number) {
        if (this.socket) {
            this.socket.emit('join-product-room', {
                product_type: productType,
                product_id: productId
            });
        }
    }

    getNewBidObservable(): Observable<Bid> {
        return this.newBidSubject.asObservable();
    }

    getBids(productType: string, productId: string | number): Observable<Bid[]> {
        return this.http.get<Bid[]>(`${this.baseUrl}/${productType}/${productId}`);
    }

    placeBid(bid: Bid): Observable<any> {
        return this.http.post(`${this.baseUrl}/place`, bid);
    }
}
