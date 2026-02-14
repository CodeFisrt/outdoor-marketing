import { Component, OnInit, Inject, PLATFORM_ID, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser, NgIf, NgFor } from '@angular/common';
import { WishlistService, WishlistItem } from '../../ApiServices/CallApis/wishlist-service';
import { Router, RouterLink } from '@angular/router';

@Component({
    selector: 'app-wishlist',
    standalone: true,
    imports: [CommonModule, NgIf, NgFor, RouterLink],
    templateUrl: './wishlist.component.html',
    styleUrls: ['./wishlist.component.css']
})
export class WishlistComponent implements OnInit {

    wishlistItems: WishlistItem[] = [];
    isLoading = false;
    userId: number | null = null;

    constructor(
        private wishlistService: WishlistService,
        private router: Router,
        private cdr: ChangeDetectorRef,
        private zone: NgZone,
        @Inject(PLATFORM_ID) private platformId: Object
    ) { }

    ngOnInit(): void {
        if (!isPlatformBrowser(this.platformId)) return;

        const storedUserId = localStorage.getItem('userId');

        if (!storedUserId) {
            alert('Please login to view your wishlist');
            this.router.navigate(['/signin']);
            return;
        }

        this.userId = Number(storedUserId);
        this.zone.run(() => this.loadWishlist());
    }

    // ✅ Load Wishlist Items
    loadWishlist(): void {

        if (this.userId === null) {
            console.warn("UserId is null");
            return;
        }

        this.isLoading = true;

        this.wishlistService.getWishlistByUser(this.userId).subscribe({
            next: (items) => {

                this.wishlistItems = items.map(item => ({
                    ...item,
                    price: Number(item.price) || 0
                }));

                console.log('Wishlist Loaded:', this.wishlistItems);

                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error loading wishlist:', err);
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }


    // ✅ Remove Item
    removeItem(item: WishlistItem): void {
        if (!this.userId || !item.wishlist_id) return;

        const confirmDelete = confirm(
            'Are you sure you want to remove this item from your wishlist?'
        );

        if (!confirmDelete) return;

        this.wishlistService.removeFromWishlist(this.userId, item.wishlist_id).subscribe({
            next: () => {
                this.wishlistItems = this.wishlistItems.filter(
                    i => i.wishlist_id !== item.wishlist_id
                );
                alert('Item removed ❤️');
            },
            error: (err) => {
                console.error('Error removing item:', err);
                alert('Error removing item');
            }
        });
    }

    // ✅ View Details Navigation
    viewDetails(item: WishlistItem): void {
        const id = item.screen_id || item.h_id || item.s_id;

        if (!id) {
            console.warn('Invalid item id');
            return;
        }

        // Create routeType separately (do NOT change item.itemType)
        const routeType =
            item.itemType === 'screen'
                ? 'digital_screen'
                : item.itemType;

        this.router.navigate(['/screenBoardDescrpt', id, routeType]);
    }


    // ✅ Type Badge Label
    getTypeLabel(type: string): string {
        const labels: { [key: string]: string } = {
            hoarding: 'Hoarding',
            screen: 'Digital Screen',
            society: 'Society Marketing'
        };

        return labels[type] || type;
    }
}

