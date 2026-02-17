/// <reference types="google.maps" />
import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
  PLATFORM_ID,
  Inject,
  ViewChild,
  ElementRef,
  NgZone
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService, InventoryItem, GeoJSONFeature, GeoJSONResponse } from '../../ApiServices/CallApis/inventory-service';
import { environment } from '../../../environments/environment';

import { HoardingService } from '../../ApiServices/CallApis/hoarding-service';
import { io, Socket } from 'socket.io-client';
import { timeout, finalize, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { WishlistService } from '../../ApiServices/CallApis/wishlist-service';
import { Subject } from 'rxjs';



@Component({
  selector: 'app-inventory-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-map.html',
  styleUrls: ['./inventory-map.css']
})
export class InventoryMap implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainerRef?: ElementRef<HTMLElement>;

  map: google.maps.Map | null = null;
  markers: google.maps.Marker[] = [];
  clusterer: MarkerClusterer | null = null;


  selectedItem: InventoryItem | null = null;
  socket: Socket | null = null;
  private resizeObserver: ResizeObserver | null = null;

  /** Right-side details panel (split-screen, no popup) */
  isPanelOpen = false;
  detailsImageError = false;
  /** Only open panel from query params once (when returning from Book this Service) */
  private _openedPanelFromQueryParams = false;
  private viewDetailsHandler = (e: any) => {
    const inventoryId = e.detail;
    console.log('View details for:', inventoryId);
  };
  // resizeHandler not needed for Google Maps in the same way, but we'll keep a simple trigger
  private resizeHandler = () => {
    if (this.map) {
      google.maps.event.trigger(this.map, 'resize');
    }
  };

  private searchSubject = new Subject<string>();

  isLoading = false;
  showBookingCalendar = false;

  // Booking state
  bookingStartDate = '';
  bookingEndDate = '';
  selectedInventoryForBooking: InventoryItem | null = null;
  bookings: any[] = [];

  // Data
  allInventory: GeoJSONFeature[] = [];
  filteredInventory: GeoJSONFeature[] = [];

  // Categorized filtered arrays
  filteredHoardings: GeoJSONFeature[] = [];
  filteredScreens: GeoJSONFeature[] = [];
  filteredSocieties: GeoJSONFeature[] = [];
  // Filters
  searchCity: string = '';



  imageBaseUrl = 'http://localhost:8080/uploads/';
  fallbackImage = 'assets/main-bg-img.jpg';
  // detailsImageError = false;


  constructor(
    private inventoryService: InventoryService,
    private hoardingService: HoardingService,
    private wishlistService: WishlistService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initWebSocket();
    }

    this.searchSubject.pipe(debounceTime(700), distinctUntilChanged()).subscribe((value) => {
      this.searchCity = value;
      this.applyFilters();
    })
  }

  /**
   * Initialize WebSocket connection for real-time updates
   */
  initWebSocket() {
    if (isPlatformBrowser(this.platformId)) {
      this.socket = io('http://localhost:8080', {
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.socket?.emit('join-inventory');
      });

      this.socket.on('inventory-updated', (data: any) => {
        console.log('Inventory updated:', data);
        // Update the specific inventory item
        const item = this.allInventory.find(
          f => f.properties.inventoryId.toString() === data.inventoryId.toString()
        );
        if (item) {
          item.properties.availabilityStatus = data.availabilityStatus;
          this.applyFilters();
        }
      });

      this.socket.on('booking-created', (data: any) => {
        console.log('Booking created:', data);
        // Reload bookings if calendar is open
        if (this.showBookingCalendar && this.selectedInventoryForBooking) {
          this.loadBookings(this.selectedInventoryForBooking.inventoryId.toString());
        }
      });

      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
      });
    }
  }

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('viewInventoryDetails', this.viewDetailsHandler);
      // Wait for container to be in DOM
      const tryInit = (attempt = 0) => {
        const el = this.mapContainerRef?.nativeElement;
        if (!el || this.map) {
          if (attempt < 25) setTimeout(() => tryInit(attempt + 1), 100);
          return;
        }
        this.initMap(el);
      };
      requestAnimationFrame(() => {
        requestAnimationFrame(() => tryInit(0));
      });
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('viewInventoryDetails', this.viewDetailsHandler);
      window.removeEventListener('resize', this.resizeHandler);
    }

    // Disconnect WebSocket
    if (this.socket) {
      this.socket.disconnect();
    }

    // Cleanup Google Maps
    if (this.clusterer) {
      this.clusterer.clearMarkers();
      this.clusterer = null;
    }

    if (this.markers) {
      this.markers.forEach(m => m.setMap(null));
      this.markers = [];
    }
    if (this.map) {
      // Google Maps mostly cleans itself up when the container is removed, 
      // but we can nullify references.
      this.map = null;
    }
  }

  /**
   * Initialize Google Maps.
   */
  async initMap(container: HTMLElement) {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!container || this.map) return;

    if (!(window as any).google?.maps) {
      await this.loadGoogleMapsScript();
      await new Promise(r => setTimeout(r, 300));
    }

    const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;

    this.map = new Map(container, {
      center: { lat: 20.5937, lng: 78.9629 },
      zoom: 5,
      mapId: environment.googleMapId,
      gestureHandling: 'greedy'
    });

    setTimeout(() => {
      google.maps.event.trigger(this.map!, 'resize');
    }, 500);

    // Close panel on map click
    this.map.addListener('click', () => {
      this.ngZone.run(() => {
        this.closePanel();
      });
    });

    this.loadDefaultMapData();
  }


  private loadGoogleMapsScript(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      if ((window as any).google?.maps) {
        resolve();
        return;
      }

      const existingScript = document.getElementById('google-maps-script');
      if (existingScript) {
        // If script is already loading/loaded, wait for it? 
        // For simplicity, just assume it will trigger window.google soon or is loading.
        // Better: check if it's loaded.
        if ((window as any).google?.maps) {
          resolve();
        } else {
          // Poll or wait for load event if we could attach it, but duplicate listeners are messy.
          // Just wait a bit or assume it's coming.
          // Best practice: global callback or just waiting.
          let count = 0;
          const check = setInterval(() => {
            count++;
            if ((window as any).google?.maps) {
              clearInterval(check);
              resolve();
            }
            if (count > 100) { // 10 sec
              clearInterval(check);
              reject('Timeout waiting for existing GMap script');
            }
          }, 100);
        }
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places,visualization,marker&mapIds=${environment.googleMapId}&loading=async`;

      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  }

  /**
   * Load default map data: hoardings, digital screens, and societies (no city filter).
   * So by default all three types show on the map.
   */
  loadDefaultMapData() {
    this.isLoading = true;
    this.cdr.detectChanges();
    const LOAD_TIMEOUT_MS = 15000;
    this.inventoryService.getInventory().pipe(
      timeout(LOAD_TIMEOUT_MS),
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response: GeoJSONResponse) => {
        this.allInventory = response?.features ?? [];
        this.applyFilters();
        if (this.map) {
          this.updateMarkers();
        }
      },
      error: () => {
        this.allInventory = [];
      }
    });
  }



  /**
   * Apply filters and update markers
   */
  applyFilters() {
    let filtered = [...this.allInventory];

    if (this.searchCity && this.searchCity.trim()) {
      const query = this.searchCity.toLowerCase().trim();
      filtered = filtered.filter(f =>
        (f.properties.city || '').toLowerCase().includes(query) ||
        (f.properties.area || '').toLowerCase().includes(query) ||
        (f.properties.name || '').toLowerCase().includes(query)
      );
    }

    this.filteredInventory = filtered;

    // Apply specific category limits (Top 300)
    this.filteredHoardings = filtered
      .filter((f: any) => f.properties.mediaType === 'hoarding')
      .sort((a: any, b: any) => (b.properties.rentalCost || 0) - (a.properties.rentalCost || 0))
      .slice(0, 300);

    this.filteredScreens = filtered
      .filter((f: any) => f.properties.mediaType === 'digital_screen' || f.properties.mediaType === 'led_screen')
      .sort((a: any, b: any) => (b.properties.rentalCost || 0) - (a.properties.rentalCost || 0))
      .slice(0, 300);

    this.filteredSocieties = filtered
      .filter((f: any) => f.properties.mediaType === 'society')
      .sort((a: any, b: any) => (b.properties.actual_cost || 0) - (a.properties.actual_cost || 0))
      .slice(0, 300);

    // Combine for general map display
    this.filteredInventory = [
      ...this.filteredHoardings,
      ...this.filteredScreens,
      ...this.filteredSocieties
    ];

    this.updateMarkers();

    // If we have search results, we might want to focus on them
    if (this.searchCity && this.filteredInventory.length > 0 && this.map) {
      const bounds = new google.maps.LatLngBounds();
      this.filteredInventory.forEach(f => {
        const [lng, lat] = f.geometry.coordinates;
        bounds.extend({ lat, lng });
      });
      this.map.fitBounds(bounds);
      // Don't zoom in too far
      const listener = google.maps.event.addListener(this.map, "idle", () => {
        if (this.map && this.map.getZoom()! > 12) this.map.setZoom(12);
        google.maps.event.removeListener(listener);
      });
    }

    this.tryOpenPanelFromQueryParams();
  }

  onSearchChange(value: string) {
    // this.applyFilters();
    this.searchSubject.next(value);
  }



  /**
   * If URL has open=id&type=mediaType (return from "Back to Details" on Book form), open that item's panel.
   */
  private tryOpenPanelFromQueryParams() {
    if (this._openedPanelFromQueryParams) return;
    const openId = this.route.snapshot.queryParamMap.get('open');
    const openType = this.route.snapshot.queryParamMap.get('type');
    if (!openId || !openType) return;
    const id = openId.trim();
    const typeLower = openType.trim().toLowerCase();
    const feature = this.filteredInventory.find(f => {
      const p = f.properties;
      const idMatch = String(p?.inventoryId ?? '') === id || Number(p?.inventoryId) === Number(id);
      const typeMatch = (p?.mediaType ?? '').toLowerCase() === typeLower;
      return idMatch && typeMatch;
    });
    if (feature) {
      this.openPanel(feature.properties as InventoryItem, feature.geometry.coordinates as [number, number]);
      this._openedPanelFromQueryParams = true;
      this.cdr.detectChanges();
    }
  }

  /**
   * Initialize clustering (Just instantiating the clusterer class if needed, or done in updateMarkers)
   */
  async initClustering() {
    // No-op or init basic config if we want to reuse the instance
    // We will create/re-create in updateMarkers or just clear it.
  }

  getIconImage(mediaType: string): string {
    // SVGs as Data URIs
    const svgs: { [key: string]: string } = {
      'hoarding': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><defs><linearGradient id="hb" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#e3f2fd"/><stop offset="100%" stop-color="#bbdefb"/></linearGradient><linearGradient id="hf" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#1976d2"/><stop offset="100%" stop-color="#0d47a1"/></linearGradient></defs><circle cx="6" cy="6" r="1.5" fill="#42a5f5" stroke="#0d47a1" stroke-width="0.8"/><circle cx="12" cy="6" r="1.5" fill="#42a5f5" stroke="#0d47a1" stroke-width="0.8"/><circle cx="18" cy="6" r="1.5" fill="#42a5f5" stroke="#0d47a1" stroke-width="0.8"/><circle cx="24" cy="6" r="1.5" fill="#42a5f5" stroke="#0d47a1" stroke-width="0.8"/><rect x="3" y="8" width="26" height="12" rx="1.5" fill="url(#hb)" stroke="#0d47a1" stroke-width="1.2"/><rect x="6" y="10" width="20" height="8" rx="1" fill="#fff"/><rect x="8" y="11.5" width="3" height="2" rx="0.3" fill="#1976d2" opacity="0.9"/><rect x="13" y="11.5" width="2" height="2" rx="0.3" fill="#1976d2" opacity="0.9"/><rect x="17" y="11.5" width="2" height="2" rx="0.3" fill="#1976d2" opacity="0.9"/><ellipse cx="9" cy="12" rx="1" ry="0.6" fill="#90caf9" opacity="0.6"/><ellipse cx="23" cy="12.5" rx="0.8" ry="0.5" fill="#90caf9" opacity="0.6"/><rect x="4" y="20" width="24" height="2.5" rx="0.5" fill="url(#hf)" stroke="#0d47a1" stroke-width="0.8"/><rect x="14.5" y="22" width="3" height="6" fill="#0d47a1"/><line x1="10" y1="28" x2="22" y2="28" stroke="#0d47a1" stroke-width="1.5" stroke-linecap="round"/></svg>`,
      'digital_screen': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><defs><linearGradient id="dg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00d4ff"/><stop offset="100%" stop-color="#0097a7"/></linearGradient><linearGradient id="df" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#00838f"/><stop offset="100%" stop-color="#004d40"/></linearGradient></defs><rect x="4" y="6" width="24" height="16" rx="2" fill="url(#df)" stroke="#004d40" stroke-width="1.2"/><rect x="6" y="8" width="20" height="12" rx="1" fill="url(#dg)" stroke="#00acc1" stroke-width="0.8"/><path d="M13 12v6l5-3-5-3z" fill="rgba(255,255,255,0.9)"/><rect x="20" y="11" width="2" height="4" rx="0.3" fill="rgba(255,255,255,0.5)"/><rect x="23" y="10" width="2" height="6" rx="0.3" fill="rgba(255,255,255,0.5)"/><rect x="14" y="22" width="4" height="2" rx="0.5" fill="#00838f"/><rect x="15" y="24" width="2" height="4" rx="0.3" fill="#004d40"/><line x1="12" y1="28" x2="20" y2="28" stroke="#004d40" stroke-width="1.2" stroke-linecap="round"/></svg>`,
      'society': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><defs><linearGradient id="sg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#ab47bc"/><stop offset="100%" stop-color="#6a1b9a"/></linearGradient><linearGradient id="sr" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#ce93d8"/><stop offset="100%" stop-color="#9c27b0"/></linearGradient></defs><path d="M16 4 L28 14 L28 28 L4 28 L4 14 Z" fill="url(#sr)" stroke="#6a1b9a" stroke-width="1.2"/><path d="M6 14 L6 28 L26 28 L26 14 L16 8 Z" fill="url(#sg)" stroke="#6a1b9a" stroke-width="1"/><rect x="9" y="16" width="3" height="3" rx="0.4" fill="#e1bee7"/><rect x="14" y="16" width="3" height="3" rx="0.4" fill="#e1bee7"/><rect x="19" y="16" width="3" height="3" rx="0.4" fill="#e1bee7"/><rect x="9" y="21" width="3" height="3" rx="0.4" fill="#e1bee7"/><rect x="14" y="21" width="3" height="3" rx="0.4" fill="#e1bee7"/><rect x="19" y="21" width="3" height="3" rx="0.4" fill="#e1bee7"/></svg>`,
      'default': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><circle cx="16" cy="16" r="10" fill="#888" stroke="#fff" stroke-width="2"/></svg>`
    };
    const key = (mediaType === 'led_screen' || mediaType === 'digital_screen') ? 'digital_screen' : (svgs[mediaType] ? mediaType : 'default');
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgs[key]);
  }

  /**
   * Update markers on map using clustering
   */
  async updateMarkers() {
    if (!this.map) return;

    // Clear existing
    if (this.clusterer) {
      this.clusterer.clearMarkers();
    }
    this.markers.forEach(m => m.setMap(null));
    this.markers = [];

    // filteredInventory has the data
    this.markers = this.filteredInventory.map(feature => {
      const [lng, lat] = feature.geometry.coordinates;
      const marker = new google.maps.Marker({
        position: { lat, lng },
        // map: this.map, // Don't set map if using cluterer immediatley
        title: feature.properties.name,
        icon: {
          url: this.getIconImage(feature.properties.mediaType),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20)
        }
      });

      marker.addListener('click', () => {
        this.ngZone.run(() => {
          this.openPanel(feature.properties as InventoryItem, [lng, lat]);
        });
      });

      return marker;
    });

    if (!this.clusterer) {
      this.clusterer = new MarkerClusterer({ map: this.map, markers: this.markers });
    } else {
      this.clusterer.addMarkers(this.markers);
    }

    // Auto fit bounds if filters applied 
    // (Only if not just init load? The requirement says: "Auto fit all visible markers after filters apply")
    // If user is zooming around, we might not want to reset every time, but requirements say "Auto fit".
    // I'll add a check to not reset on initial load if we want center on India, but `filteredInventory` is all inventory initially.
    // If `this.selectedCity` is set, `centerMapOnCity` handles it. 
    // If just filters, maybe we fit bounds.
    if (this.markers.length > 0 && !this.isLoading) {
      // Optional: auto fit bounds
      const bounds = new google.maps.LatLngBounds();
      this.markers.forEach(m => bounds.extend(m.getPosition()!));
      this.map.fitBounds(bounds);
      // Avoid zooming in too much if only 1 marker
      /*
      const listener = google.maps.event.addListener(this.map, "idle", () => { 
          if (this.map!.getZoom() > 15) this.map!.setZoom(15); 
          google.maps.event.removeListener(listener); 
      });
      */
    }
  }

  /**
   * Update markers based on viewport (for performance with large datasets).
   */
  updateMarkersForViewport() {
    // Clustering handles this.
  }

  /**
   * Open right-side details panel (no MapLibre popup).
   */
  openPanel(item: InventoryItem, coordinates?: [number, number]) {
    this.selectedItem = item;
    this.detailsImageError = false;
    this.isPanelOpen = true;
    if (this.map && coordinates?.length === 2) {
      this.map.panTo({ lat: coordinates[1], lng: coordinates[0] });
      this.map.setZoom(14);
    }
    setTimeout(() => { if (this.map) google.maps.event.trigger(this.map, 'resize'); }, 350);
    this.cdr.detectChanges();
  }

  /**
   * Close details panel.
   */
  closePanel() {
    this.isPanelOpen = false;
    setTimeout(() => { if (this.map) google.maps.event.trigger(this.map, 'resize'); }, 350);
    this.cdr.detectChanges();
  }

  /**
   * Close panel when user clicks map background.
   */
  // Replaced by native map click listener in initMap

  viewDetails() {
    if (!this.selectedItem) return;
    const id = this.selectedItem.inventoryId;
    const type = this.selectedItem.mediaType || 'hoarding';
    this.router.navigate(['/screenBoardDescrpt', id, type], { queryParams: { from: 'map' } });
  }

  bookNow() {
    if (!this.selectedItem) return;
    // Navigate to Book this Service form; from=map so "Back to Details" returns to this map
    if (isPlatformBrowser(this.platformId)) {
      window.location.href = `/screenBoardDescrpt/${this.selectedItem.inventoryId}/${this.selectedItem.mediaType}?open=book&from=map`;
    }
  }

  /**
   * First image URL from backend for the details panel (imageUrls[0]).
   * Returns null if none, so the template can show a placeholder.
   */

  getDetailsImageUrl(item: InventoryItem): string | null {
    const urls = item?.imageUrls;

    if (Array.isArray(urls) && urls.length > 0) {
      const fileName = urls[0]?.trim();
      if (!fileName) return null;

      if (fileName.startsWith('http')) return fileName;
      return this.imageBaseUrl + fileName;
    }

    return null;
  }



  getDailyTraffic(item: InventoryItem): string {
    const score = item.trafficScore ?? 0;
    if (score >= 80) return 'High';
    if (score >= 60) return 'Medium';
    return 'Low';
  }

  getEstimatedHumans(item: InventoryItem): string {
    const score = item.trafficScore ?? 0;
    const base = Math.round((score / 100) * 5000);
    return base >= 1000 ? `${(base / 1000).toFixed(1)}K` : String(base);
  }

  getPeakHour(item: InventoryItem): string {
    return (item as any).peakHour ?? '6–9 PM';
  }

  /**
   * Get human-readable media type label
   */
  getMediaTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'hoarding': 'Hoarding / Billboard',
      'digital_screen': 'Digital Screen',
      'led_screen': 'LED Screen',
      'society': 'Society / Building',
      'transit_media': 'Transit Media',
      'bus_shelter': 'Bus Shelter',
      'unipole': 'Unipole'
    };
    return labels[type] || type;
  }





  /**
   * Handle filter changes
   */
  /**
   * Toggle heatmap visualization
   */


  /**
   * Show booking calendar for selected inventory
   */
  async showBookingCalendarForItem(item: InventoryItem) {
    this.selectedInventoryForBooking = item;
    this.showBookingCalendar = true;
    await this.loadBookings(item.inventoryId.toString());
  }

  /**
   * Load bookings for inventory item
   */
  async loadBookings(inventoryId: string) {
    try {
      const response = await fetch(`http://localhost:8080/inventory/bookings?inventoryId=${inventoryId}`);
      this.bookings = await response.json();
    } catch (error) {
      console.error('Error loading bookings:', error);
      this.bookings = [];
    }
  }

  /**
   * Check if user can create bookings (role-based)
   */
  canCreateBooking(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    const role = (localStorage.getItem('role') || 'guest').toLowerCase();
    return ['admin', 'agency'].includes(role);
  }

  /**
   * Create booking
   */
  async createBooking() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (!this.canCreateBooking()) {
      alert('Only admins and agencies can create bookings. Please sign in with appropriate account.');
      return;
    }

    if (!this.selectedInventoryForBooking || !this.bookingStartDate || !this.bookingEndDate) {
      alert('Please select dates');
      return;
    }

    try {
      const userId = localStorage.getItem('userId');
      const agencyId = localStorage.getItem('agencyId');

      const response = await fetch('http://localhost:8080/inventory/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inventoryId: this.selectedInventoryForBooking.inventoryId,
          mediaType: this.selectedInventoryForBooking.mediaType,
          startDate: this.bookingStartDate,
          endDate: this.bookingEndDate,
          userId: userId || null,
          agencyId: agencyId || null
        })
      });

      if (response.ok) {
        alert('Booking created successfully!');
        this.bookingStartDate = '';
        this.bookingEndDate = '';
        await this.loadBookings(this.selectedInventoryForBooking.inventoryId.toString());
      } else {
        alert('Error creating booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Error creating booking');
    }
  }

  /**
   * Close booking calendar
   */
  closeBookingCalendar() {
    this.showBookingCalendar = false;
    this.selectedInventoryForBooking = null;
    this.bookings = [];
  }

  /**
   * Check if date range is available
   */
  isDateRangeAvailable(startDate: string, endDate: string): boolean {
    if (!this.bookings.length) return true;

    const start = new Date(startDate);
    const end = new Date(endDate);

    return !this.bookings.some(booking => {
      const bookingStart = new Date(booking.start_date);
      const bookingEnd = new Date(booking.end_date);
      return (start <= bookingEnd && end >= bookingStart);
    });
  }

  /**
   * Add selected item to wishlist
   */
  async addToWishlist() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.selectedItem) return;

    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('Please sign in to add items to your wishlist.');
      this.router.navigateByUrl('/signin');
      return;
    }

    const type = this.selectedItem.mediaType;
    const itemData: any = {
      user_id: userId,
      h_id: type === 'hoarding' ? this.selectedItem.inventoryId : null,
      screen_id: (type === 'digital_screen' || type === 'led_screen') ? this.selectedItem.inventoryId : null,
      s_id: type === 'society' ? this.selectedItem.inventoryId : null
    };

    this.wishlistService.addToWishlist(itemData).subscribe({
      next: (res) => {
        alert('Item added to wishlist successfully! ❤️');
      },
      error: (err) => {
        if (err.status === 400) {
          alert('Already added to wishlist');
        } else {
          console.error('Error adding to wishlist:', err);
          alert('Error adding to wishlist');
        }
      }
    });
  }


}