import {
    Component,
    OnInit,
    Inject,
    PLATFORM_ID,
    NgZone,
    ChangeDetectorRef
} from '@angular/core';

import {
    CommonModule,
    isPlatformBrowser,
    NgIf,
    NgFor
} from '@angular/common';

import { WishlistService, WishlistItem } from '../../ApiServices/CallApis/wishlist-service';

import { Router, RouterLink } from '@angular/router';

import { FormsModule } from '@angular/forms';

import { Subject } from 'rxjs';

import {
    debounceTime,
    distinctUntilChanged,
    switchMap
} from 'rxjs/operators';


@Component({
    selector: 'app-wishlist',
    standalone: true,
    imports: [CommonModule, NgIf, NgFor, RouterLink, FormsModule],
    templateUrl: './wishlist.component.html',
    styleUrls: ['./wishlist.component.css']
})
export class WishlistComponent implements OnInit {

    wishlistItems: WishlistItem[] = [];

    isLoading = false;

    userId: number | null = null;

    // ✅ FIXED selection logic using ID instead of object reference
    selectedItemIds: Set<number> = new Set();

    showShareModal = false;

    // User search
    searchUsername = '';
    foundUsers: any[] = [];
    selectedTargetUser: any = null;
    isSearchingUsers = false;

    private searchSubject = new Subject<string>();


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

        this.loadWishlist();

        this.setupUserSearch();
    }


    // ========================
    // USER SEARCH WITH DEBOUNCE
    // ========================

    setupUserSearch(): void {

        this.searchSubject.pipe(

            debounceTime(700),

            distinctUntilChanged(),

            switchMap(query => {

                if (!query || query.trim() === '') {

                    this.foundUsers = [];

                    return [];
                }

                this.isSearchingUsers = true;

                return this.wishlistService.searchUsers(query);

            })

        ).subscribe({

            next: (users: any) => {

                this.foundUsers = users;

                this.isSearchingUsers = false;

                this.cdr.detectChanges();

            },

            error: () => {

                this.isSearchingUsers = false;

                this.cdr.detectChanges();

            }

        });

    }


    onUserSearchChange(query: string): void {

        this.searchSubject.next(query);

    }


    selectUser(user: any): void {

        this.selectedTargetUser = user;

    }


    // ========================
    // SELECTION LOGIC (FIXED)
    // ========================

    toggleSelection(item: WishlistItem): void {

        const id = item.wishlist_id;

        if (this.selectedItemIds.has(id)) {

            this.selectedItemIds.delete(id);

        } else {

            this.selectedItemIds.add(id);

        }

        // Important: create new Set for Angular detection
        this.selectedItemIds = new Set(this.selectedItemIds);

        this.cdr.detectChanges();

    }


    get isAllSelected(): boolean {

        return this.wishlistItems.length > 0 && this.selectedItemIds.size === this.wishlistItems.length;

    }


    toggleSelectAll(): void {

        if (this.isAllSelected) {

            this.selectedItemIds.clear();

        } else {

            this.wishlistItems.forEach(item => this.selectedItemIds.add(item.wishlist_id));

        }

        this.selectedItemIds = new Set(this.selectedItemIds);

        this.cdr.detectChanges();

    }


    isSelected(item: WishlistItem): boolean {

        return this.selectedItemIds.has(item.wishlist_id);

    }


    trackByWishlistId(index: number, item: WishlistItem): number {

        return item.wishlist_id;

    }


    // ========================
    // SHARE MODAL
    // ========================

    openShareModal(): void {

        if (this.selectedItemIds.size === 0) {

            alert("Please select items to share");

            return;
        }

        this.showShareModal = true;

    }


    closeModal(): void {

        this.showShareModal = false;

        this.searchUsername = '';

        this.foundUsers = [];

        this.selectedTargetUser = null;

    }


    confirmShare(): void {

        if (!this.userId || !this.selectedTargetUser) return;


        const selectedItems = this.wishlistItems.filter(item =>
            this.selectedItemIds.has(item.wishlist_id)
        );


        const itemsToShare = selectedItems.map(item => ({

            screen_id: item.screen_id || null,

            h_id: item.h_id || null,

            s_id: item.s_id || null

        }));


        const payload = {

            fromUserId: this.userId,

            toUserId: this.selectedTargetUser.userId,

            items: itemsToShare

        };


        this.wishlistService.shareWishlistItems(payload).subscribe({

            next: (res) => {

                alert(res.message || "Shared successfully");

                this.closeModal();

                this.selectedItemIds.clear();

                this.cdr.detectChanges();

            },

            error: () => {

                alert("Error sharing wishlist");

            }

        });

    }


    downloadSelectedPDF(): void {

        if (this.selectedItemIds.size === 0) {
            alert("Please select items to download");
            return;
        }

        const selectedItems = this.wishlistItems.filter(item =>
            this.selectedItemIds.has(item.wishlist_id)
        );

        this.wishlistService.downloadPDF(selectedItems).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'wishlist.pdf';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            },
            error: () => {
                alert("Error downloading PDF");
            }
        });

    }


    // ========================
    // LOAD WISHLIST
    // ========================

    loadWishlist(): void {

        if (!this.userId) return;

        this.isLoading = true;

        this.wishlistService.getWishlistByUser(this.userId).subscribe({

            next: (items) => {

                this.wishlistItems = items.map(item => ({

                    ...item,

                    price: Number(item.price) || 0

                }));

                this.isLoading = false;

                this.cdr.detectChanges();

            },

            error: () => {

                this.isLoading = false;

                this.cdr.detectChanges();

            }

        });

    }


    // ========================
    // REMOVE ITEM
    // ========================

    removeItem(item: WishlistItem): void {

        if (!this.userId || !item.wishlist_id) return;

        if (!confirm("Remove item?")) return;


        this.wishlistService.removeFromWishlist(
            this.userId,
            item.wishlist_id
        ).subscribe({

            next: () => {

                this.wishlistItems = this.wishlistItems.filter(
                    i => i.wishlist_id !== item.wishlist_id
                );

                this.selectedItemIds.delete(item.wishlist_id);

                this.cdr.detectChanges();

            }

        });

    }


    // ========================
    // VIEW DETAILS
    // ========================

    viewDetails(item: WishlistItem): void {

        const id = item.screen_id || item.h_id || item.s_id;

        if (!id) return;

        const routeType =
            item.itemType === 'screen'
                ? 'digital_screen'
                : item.itemType;

        this.router.navigate([
            '/screenBoardDescrpt',
            id,
            routeType
        ]);

    }


    getTypeLabel(type: string): string {

        const labels: any = {

            hoarding: 'Hoarding',

            screen: 'Digital Screen',

            society: 'Society Marketing'

        };

        return labels[type] || type;

    }

}
