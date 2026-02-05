import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
  PLATFORM_ID,
  Inject,
  ViewChild,
  ElementRef
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService, InventoryItem, GeoJSONFeature, GeoJSONResponse } from '../../ApiServices/CallApis/inventory-service';

import { HoardingService } from '../../ApiServices/CallApis/hoarding-service';
import { io, Socket } from 'socket.io-client';
import { timeout, finalize } from 'rxjs/operators';

type MapMode = 'all' | 'digital_only' | 'high_traffic' | 'available' | 'maintenance' | 'heatmap';

@Component({
  selector: 'app-inventory-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-map.html',
  styleUrls: ['./inventory-map.css']
})
export class InventoryMap implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainerRef?: ElementRef<HTMLElement>;

  map: any = null;
  markers: Map<string, any> = new Map();
  selectedItem: InventoryItem | null = null;
  clusterSource: any = null;
  socket: Socket | null = null;
  private resizeObserver: ResizeObserver | null = null;

  /** Right-side details panel (split-screen, no MapLibre popup) */
  isPanelOpen = false;
  detailsImageError = false;
  /** Only open panel from query params once (when returning from Book this Service) */
  private _openedPanelFromQueryParams = false;
  private viewDetailsHandler = (e: any) => {
    const inventoryId = e.detail;
    console.log('View details for:', inventoryId);
  };
  private resizeHandler = () => this.map?.resize();

  // Map state
  mapMode: MapMode = 'all';
  isLoading = false;
  showHeatmap = false;
  showBookingCalendar = false;

  // Booking state
  bookingStartDate = '';
  bookingEndDate = '';
  selectedInventoryForBooking: InventoryItem | null = null;
  bookings: any[] = [];

  // Sidebar state
  sidebarOpen = true;
  
  
  // Filters (selectedCity set by Search by City; map mode in Map Focus panel)
  selectedCity = '';
  citySearchQuery = '';
  citySearchInProgress = false;
  citiesWithCoords: { city: string; lat: number; lng: number }[] = [];

  get isCitySearchDisabled(): boolean {
    return !this.citySearchQuery?.trim() || this.citySearchInProgress;
  }

  // Data
  allInventory: GeoJSONFeature[] = [];
  filteredInventory: GeoJSONFeature[] = [];
  cities: string[] = [];

  constructor(
    private inventoryService: InventoryService,
    private hoardingService: HoardingService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadCities();
      this.initWebSocket();
    }
  }

  /**
   * Initialize WebSocket connection for real-time updates
   */
  initWebSocket() {
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

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('viewInventoryDetails', this.viewDetailsHandler);
      // Wait for container to be in DOM and have non-zero size (fixes blank map when container not laid out yet)
      const tryInit = (attempt = 0) => {
        const el = this.mapContainerRef?.nativeElement;
        if (!el || this.map) {
          if (attempt < 25) setTimeout(() => tryInit(attempt + 1), 100);
          return;
        }
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        if (w > 0 && h > 0) {
          this.initMap(el);
        } else if (attempt < 25) {
          setTimeout(() => tryInit(attempt + 1), 100);
        }
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

    if (this.map) {
      // Remove layers and sources
      if (this.map.getLayer('clusters')) this.map.removeLayer('clusters');
      if (this.map.getLayer('cluster-count')) this.map.removeLayer('cluster-count');
      if (this.map.getLayer('unclustered-point')) this.map.removeLayer('unclustered-point');
      if (this.map.getLayer('heatmap-layer')) this.map.removeLayer('heatmap-layer');
      if (this.map.getSource('inventory-clusters')) this.map.removeSource('inventory-clusters');
      if (this.map.getSource('heatmap-source')) this.map.removeSource('heatmap-source');
      this.map.remove();
      this.map = null;
    }
  }

  /**
   * Initialize MapLibre GL map. Pass the container element so map shows when navigating to this page.
   */
  async initMap(container: HTMLElement) {
    if (!container || this.map) return;
    const maplibregl = await import('maplibre-gl');
    if (!container.isConnected) return;

    this.map = new maplibregl.Map({
      container,
      style: {
        version: 8,
        sources: {
          'raster-tiles': {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'simple-tiles',
            type: 'raster',
            source: 'raster-tiles',
            minzoom: 0,
            maxzoom: 22
          }
        ],
        glyphs: 'https://cdn.jsdelivr.net/gh/kylebarron/openmaptiles-fonts/fonts/{fontstack}/{range}.pbf'
      },
      center: [78.9629, 20.5937], // India (geographic center)
      zoom: 5,
      pitch: 0,
      bearing: 0
    });

    // Add dark theme overlay (below tiles so tiles stay visible)
    this.map.on('load', async () => {
      if (!this.map) return;
      this.map.addLayer({
        id: 'dark-overlay',
        type: 'background',
        paint: {
          'background-color': '#0a0e27'
        }
      }, 'simple-tiles');
      // Keep tiles clearly visible (0.4 was too faint; 0.7 makes the map readable)
      this.map.setPaintProperty('simple-tiles', 'raster-opacity', 0.7);
      
      // Initialize clustering source
      await this.initClustering();
      if (!this.map) return;
      // Force map to recalc size (fixes blank map when container wasn't sized at init)
      this.map.resize();
      // Redraw again after layout settles (fixes map not showing when navigating to page)
      setTimeout(() => this.map?.resize(), 300);
      // By default show hoardings, digital screens, and societies on the map
      this.loadDefaultMapData();
    });

    // Add navigation controls
    this.map.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true,
        showCompass: true
      }),
      'top-right'
    );

    // Handle map bounds changes for viewport-based loading
    this.map.on('moveend', () => {
      this.updateMarkersForViewport();
    });

    window.addEventListener('resize', this.resizeHandler);
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
        this.extractCities();
        this.applyFilters();
        if (this.map && this.map.getSource('inventory-clusters')) {
          this.updateMarkers();
          this.map.resize();
        }
      },
      error: () => {
        this.allInventory = [];
      }
    });
  }

  /**
   * Load cities with coordinates for quick city buttons (derived from inventory).
   */
  loadCities() {
    this.inventoryService.getInventory().subscribe({
      next: (response: GeoJSONResponse) => {
        this.citiesWithCoords = this.extractCitiesWithCoords(response?.features ?? []);
        this.cdr.detectChanges();
      },
      error: () => {
        this.citiesWithCoords = [];
        this.cdr.detectChanges();
      }
    });
  }

  /** Derive cities with center coords from GeoJSON features for quick city buttons. */
  private extractCitiesWithCoords(features: GeoJSONFeature[]): { city: string; lat: number; lng: number }[] {
    const byCity = new Map<string, { lat: number; lng: number; count: number }>();
    features.forEach(f => {
      const city = (f.properties?.city ?? '').trim();
      if (!city) return;
      const [lng, lat] = f.geometry?.coordinates ?? [0, 0];
      const existing = byCity.get(city);
      if (existing) {
        existing.lat += lat;
        existing.lng += lng;
        existing.count += 1;
      } else {
        byCity.set(city, { lat, lng, count: 1 });
      }
    });
    return Array.from(byCity.entries())
      .map(([city, v]) => ({ city, lat: v.lat / v.count, lng: v.lng / v.count }))
      .sort((a, b) => a.city.localeCompare(b.city));
  }

  /**
   * Search by city: load Hoarding, Digital Screen, Society locations and show on map.
   */
  searchCity() {
    const city = this.citySearchQuery?.trim();
    if (!city) return;

    this.citySearchInProgress = true;
    this.isLoading = true;
    this.cdr.detectChanges();

    const LOAD_TIMEOUT_MS = 15000;
    this.inventoryService.getInventory({ city }).pipe(
      timeout(LOAD_TIMEOUT_MS),
      finalize(() => {
        this.citySearchInProgress = false;
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response: GeoJSONResponse) => {
        this.allInventory = response?.features ?? [];
        this.extractCities();
        this.selectedCity = (this.allInventory[0]?.properties?.city ?? city).trim();
        this.applyFilters();
        this.centerMapOnCity(city);
        if (this.map) this.map.resize();
      },
      error: () => {
        this.allInventory = [];
      }
    });
  }

  selectCityQuick(cityName: string) {
    this.citySearchQuery = cityName;
    this.searchCity();
  }

  centerMapOnCity(cityName: string) {
    if (!this.map) return;
    const normalized = cityName.trim().toLowerCase();
    const cityInfo = this.citiesWithCoords.find(c => c.city.trim().toLowerCase() === normalized);
    if (cityInfo) {
      this.map.easeTo({ center: [cityInfo.lng, cityInfo.lat], zoom: 12, duration: 800 });
      return;
    }
    if (this.filteredInventory.length > 0) {
      const coords = this.filteredInventory.map(f => f.geometry.coordinates);
      const lngs = coords.map(c => c[0]);
      const lats = coords.map(c => c[1]);
      const padding = 0.02;
      this.map.fitBounds(
        [[Math.min(...lngs) - padding, Math.min(...lats) - padding], [Math.max(...lngs) + padding, Math.max(...lats) + padding]],
        { padding: 40, duration: 800, maxZoom: 14 }
      );
    }
  }

  /**
   * Extract unique cities from inventory
   */
  extractCities() {
    const citySet = new Set<string>();
    this.allInventory.forEach(feature => {
      if (feature.properties.city) {
        citySet.add(feature.properties.city);
      }
    });
    this.cities = Array.from(citySet).sort();
  }

  /**
   * Apply filters and update markers
   */
  applyFilters() {
    let filtered = [...this.allInventory];

    // City filter (set by Search by City)
    if (this.selectedCity) {
      const cityLower = this.selectedCity.trim().toLowerCase();
      filtered = filtered.filter(f => (f.properties.city ?? '').trim().toLowerCase() === cityLower);
    }

    // Map mode filters (normalize status so backend variants like "Occupied", "Under Maintenance" work)
    const normalizedStatus = (s: string | undefined): string => {
      const lower = (s ?? '').toString().toLowerCase().trim();
      if (lower === 'maintenance' || lower.includes('maintenance')) return 'maintenance';
      if (lower === 'booked' || lower === 'occupied') return 'booked';
      return lower || 'available';
    };
    if (this.mapMode === 'digital_only') {
      filtered = filtered.filter(f => f.properties.isDigital);
    } else if (this.mapMode === 'high_traffic') {
      filtered = filtered.filter(f => f.properties.trafficScore >= 80);
    } else if (this.mapMode === 'available') {
      filtered = filtered.filter(f => normalizedStatus(f.properties.availabilityStatus) === 'available');
    } else if (this.mapMode === 'maintenance') {
      filtered = filtered.filter(f => normalizedStatus(f.properties.availabilityStatus) === 'maintenance');
    } else if (this.mapMode === 'heatmap') {
      this.showHeatmap = true;
    } else {
      this.showHeatmap = false;
    }

    this.filteredInventory = filtered;
    this.updateMarkers();
    this.tryOpenPanelFromQueryParams();

    // Update heatmap if enabled
    if (this.showHeatmap) {
      this.toggleHeatmap();
    }
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
   * Initialize clustering for markers
   */
  async initClustering() {
    if (!this.map) return;

    const maplibregl = await import('maplibre-gl');

    // Add GeoJSON source with clustering
    this.map.addSource('inventory-clusters', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });

    // Add cluster circles
    this.map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'inventory-clusters',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#00d4ff',
          10,
          '#00ff88',
          50,
          '#ff8200'
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,
          10,
          30,
          50,
          40
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
      }
    });

    // Add cluster count labels
    this.map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'inventory-clusters',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['Open Sans Regular'],
        'text-size': 12
      },
      paint: {
        'text-color': '#0a0e27'
      }
    });

    // Load logo icons for Hoarding, Digital Screen, Society
    await this.loadMapIcons();

    // Add unclustered points as logo icons (Hoarding, Digital Screen, Society)
    this.map.addLayer({
      id: 'unclustered-point',
      type: 'symbol',
      source: 'inventory-clusters',
      filter: ['!', ['has', 'point_count']],
      layout: {
        'icon-image': ['get', 'iconImage'],
        'icon-size': 1.1,
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'icon-anchor': 'center'
      },
      paint: {
        'icon-opacity': 1
      }
    });

    // Initialize heatmap source (empty initially)
    this.map.addSource('heatmap-source', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    // Click on cluster to zoom in
    this.map.on('click', 'clusters', (e: any) => {
      const features = this.map.queryRenderedFeatures(e.point, {
        layers: ['clusters']
      });
      if (!features.length) return;
      const clusterId = features[0].properties.cluster_id;
      (this.map.getSource('inventory-clusters') as any).getClusterExpansionZoom(
        clusterId,
        (err: any, zoom: number) => {
          if (err) return;
          this.map.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
          });
        }
      );
    });

    // Click on unclustered point: open details panel (no popup)
    this.map.on('click', 'unclustered-point', (e: any) => {
      if (!e.features?.length) return;
      e.originalEvent?.stopPropagation?.();
      const coords = e.features[0].geometry.coordinates.slice();
      const props = e.features[0].properties;
      const idStr = props.inventoryId != null ? String(props.inventoryId) : '';
      const typeStr = (props.mediaType != null ? String(props.mediaType) : '').toLowerCase();
      let fullItem = this.filteredInventory.find(
        f => String(f.properties.inventoryId) === idStr && String(f.properties.mediaType || '').toLowerCase() === typeStr
      );
      if (!fullItem && coords.length >= 2) {
        fullItem = this.filteredInventory.find(
          f => f.geometry.coordinates[0] === coords[0] && f.geometry.coordinates[1] === coords[1]
        );
      }
      const item = fullItem ? fullItem.properties : props;
      this.openPanel(item as InventoryItem, coords);
    });

    // Change cursor on hover
    this.map.on('mouseenter', 'clusters', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'clusters', () => {
      this.map.getCanvas().style.cursor = '';
    });

    this.map.on('mouseenter', 'unclustered-point', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'unclustered-point', () => {
      this.map.getCanvas().style.cursor = '';
    });
  }

  /**
   * Load logo icons (Hoarding, Digital Screen, Society) and add to map.
   * Rasterize SVG to ImageData so MapLibre renders them reliably.
   */
  private loadMapIcons(): Promise<void> {
    const size = 64; // power of 2 for GPU texture
    const icons: { id: string; svg: string }[] = [
      { id: 'hoarding-icon', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><defs><linearGradient id="hb" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#e3f2fd"/><stop offset="100%" stop-color="#bbdefb"/></linearGradient><linearGradient id="hf" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#1976d2"/><stop offset="100%" stop-color="#0d47a1"/></linearGradient></defs><circle cx="6" cy="6" r="1.5" fill="#42a5f5" stroke="#0d47a1" stroke-width="0.8"/><circle cx="12" cy="6" r="1.5" fill="#42a5f5" stroke="#0d47a1" stroke-width="0.8"/><circle cx="18" cy="6" r="1.5" fill="#42a5f5" stroke="#0d47a1" stroke-width="0.8"/><circle cx="24" cy="6" r="1.5" fill="#42a5f5" stroke="#0d47a1" stroke-width="0.8"/><rect x="3" y="8" width="26" height="12" rx="1.5" fill="url(#hb)" stroke="#0d47a1" stroke-width="1.2"/><rect x="6" y="10" width="20" height="8" rx="1" fill="#fff"/><rect x="8" y="11.5" width="3" height="2" rx="0.3" fill="#1976d2" opacity="0.9"/><rect x="13" y="11.5" width="2" height="2" rx="0.3" fill="#1976d2" opacity="0.9"/><rect x="17" y="11.5" width="2" height="2" rx="0.3" fill="#1976d2" opacity="0.9"/><ellipse cx="9" cy="12" rx="1" ry="0.6" fill="#90caf9" opacity="0.6"/><ellipse cx="23" cy="12.5" rx="0.8" ry="0.5" fill="#90caf9" opacity="0.6"/><rect x="4" y="20" width="24" height="2.5" rx="0.5" fill="url(#hf)" stroke="#0d47a1" stroke-width="0.8"/><rect x="14.5" y="22" width="3" height="6" fill="#0d47a1"/><line x1="10" y1="28" x2="22" y2="28" stroke="#0d47a1" stroke-width="1.5" stroke-linecap="round"/></svg>` },
      { id: 'digital-icon', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><defs><linearGradient id="dg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00d4ff"/><stop offset="100%" stop-color="#0097a7"/></linearGradient><linearGradient id="df" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#00838f"/><stop offset="100%" stop-color="#004d40"/></linearGradient></defs><rect x="4" y="6" width="24" height="16" rx="2" fill="url(#df)" stroke="#004d40" stroke-width="1.2"/><rect x="6" y="8" width="20" height="12" rx="1" fill="url(#dg)" stroke="#00acc1" stroke-width="0.8"/><path d="M13 12v6l5-3-5-3z" fill="rgba(255,255,255,0.9)"/><rect x="20" y="11" width="2" height="4" rx="0.3" fill="rgba(255,255,255,0.5)"/><rect x="23" y="10" width="2" height="6" rx="0.3" fill="rgba(255,255,255,0.5)"/><rect x="14" y="22" width="4" height="2" rx="0.5" fill="#00838f"/><rect x="15" y="24" width="2" height="4" rx="0.3" fill="#004d40"/><line x1="12" y1="28" x2="20" y2="28" stroke="#004d40" stroke-width="1.2" stroke-linecap="round"/></svg>` },
      { id: 'society-icon', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><defs><linearGradient id="sg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#ab47bc"/><stop offset="100%" stop-color="#6a1b9a"/></linearGradient><linearGradient id="sr" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#ce93d8"/><stop offset="100%" stop-color="#9c27b0"/></linearGradient></defs><path d="M16 4 L28 14 L28 28 L4 28 L4 14 Z" fill="url(#sr)" stroke="#6a1b9a" stroke-width="1.2"/><path d="M6 14 L6 28 L26 28 L26 14 L16 8 Z" fill="url(#sg)" stroke="#6a1b9a" stroke-width="1"/><rect x="9" y="16" width="3" height="3" rx="0.4" fill="#e1bee7"/><rect x="14" y="16" width="3" height="3" rx="0.4" fill="#e1bee7"/><rect x="19" y="16" width="3" height="3" rx="0.4" fill="#e1bee7"/><rect x="9" y="21" width="3" height="3" rx="0.4" fill="#e1bee7"/><rect x="14" y="21" width="3" height="3" rx="0.4" fill="#e1bee7"/><rect x="19" y="21" width="3" height="3" rx="0.4" fill="#e1bee7"/></svg>` },
      { id: 'default-icon', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><circle cx="16" cy="16" r="10" fill="#888" stroke="#fff" stroke-width="2"/></svg>` }
    ];

    const loadOne = (id: string, svg: string): Promise<void> =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          try {
            if (this.map.hasImage(id)) return resolve();
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, size, size);
              const imageData = ctx.getImageData(0, 0, size, size);
              this.map.addImage(id, {
                width: size,
                height: size,
                data: new Uint8Array(imageData.data)
              });
            } else {
              this.map.addImage(id, img);
            }
          } catch (_) {}
          resolve();
        };
        img.onerror = () => resolve();
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      });

    return Promise.all(icons.map(({ id, svg }) => loadOne(id, svg))).then(() => {});
  }

  getIconImage(mediaType: string): string {
    const map: { [key: string]: string } = { hoarding: 'hoarding-icon', digital_screen: 'digital-icon', led_screen: 'digital-icon', society: 'society-icon' };
    return map[mediaType] ?? 'default-icon';
  }

  /**
   * Update markers on map using clustering (logo icons)
   */
  async updateMarkers() {
    if (!this.map || !this.map.getSource('inventory-clusters')) {
      return;
    }
    const featuresWithIcons = this.filteredInventory.map(f => ({
      ...f,
      properties: { ...f.properties, iconImage: this.getIconImage(f.properties.mediaType) }
    }));
    const source = this.map.getSource('inventory-clusters') as any;
    if (source) {
      source.setData({ type: 'FeatureCollection', features: featuresWithIcons });
    }
  }

  /**
   * Update markers based on viewport (for performance with large datasets).
   * With cluster source, all data is in one GeoJSON source; MapLibre handles viewport.
   * this.markers is unused when using clustering — no per-marker add/remove.
   */
  updateMarkersForViewport() {
    if (!this.map || !this.map.getSource('inventory-clusters')) return;
    // Clustering already uses the full filteredInventory; no viewport culling needed here.
  }

  /**
   * Open right-side details panel (no MapLibre popup).
   */
  openPanel(item: InventoryItem, coordinates?: [number, number]) {
    this.selectedItem = item;
    this.detailsImageError = false;
    this.isPanelOpen = true;
    if (this.map && coordinates?.length === 2) {
      this.map.flyTo({ center: coordinates, zoom: 14, duration: 800 });
    }
    setTimeout(() => this.map?.resize(), 350);
    this.cdr.detectChanges();
  }

  /**
   * Close details panel.
   */
  closePanel() {
    this.isPanelOpen = false;
    setTimeout(() => this.map?.resize(), 350);
    this.cdr.detectChanges();
  }

  /**
   * Close panel when user clicks map background.
   */
  onMapBackgroundClick(e: Event) {
    const target = e.target as HTMLElement;
    if (target?.id === 'inventory-map' || target?.closest?.('.map-wrapper')) {
      if (!target.closest?.('.map-mode-toggle') && !target.closest?.('.map-legend')) {
        this.closePanel();
      }
    }
  }

  viewDetails() {
    if (!this.selectedItem) return;
    const id = this.selectedItem.inventoryId;
    const type = this.selectedItem.mediaType || 'hoarding';
    this.router.navigate(['/screenBoardDescrpt', id, type], { queryParams: { from: 'map' } });
  }

  bookNow() {
    if (!this.selectedItem) return;
    // Navigate to Book this Service form; from=map so "Back to Details" returns to this map
    window.location.href = `/screenBoardDescrpt/${this.selectedItem.inventoryId}/${this.selectedItem.mediaType}?open=book&from=map`;
  }

  /**
   * First image URL from backend for the details panel (imageUrls[0]).
   * Returns null if none, so the template can show a placeholder.
   */
  getDetailsImageUrl(item: InventoryItem): string | null {
    const urls = item?.imageUrls;
    if (Array.isArray(urls) && urls.length > 0 && typeof urls[0] === 'string' && urls[0].trim()) {
      const url = urls[0].trim();
      return url.startsWith('http') || url.startsWith('/') ? url : '/' + url;
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
   * Toggle sidebar
   */
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    if (this.map) {
      setTimeout(() => this.map.resize(), 0);
    }
  }

  /**
   * Change map mode (All, Digital, High Traffic, Available, Maintenance, Heatmap)
   */
  setMapMode(mode: MapMode) {
    this.mapMode = mode;
    this.applyFilters();
    this.cdr.detectChanges();
  }

  /**
   * Handle filter changes
   */
  /**
   * Toggle heatmap visualization
   */
  toggleHeatmap() {
    if (!this.map) return;

    if (this.showHeatmap) {
      // Add heatmap layer
      if (!this.map.getLayer('heatmap-layer')) {
        this.map.addLayer({
          id: 'heatmap-layer',
          type: 'heatmap',
          source: 'heatmap-source',
          maxzoom: 15,
          paint: {
            'heatmap-weight': [
              'interpolate',
              ['linear'],
              ['get', 'trafficScore'],
              0, 0,
              50, 0.5,
              80, 1,
              100, 2
            ],
            'heatmap-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 1,
              9, 3
            ],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(0, 212, 255, 0)',
              0.2, 'rgba(0, 212, 255, 0.5)',
              0.4, 'rgba(0, 255, 136, 0.7)',
              0.6, 'rgba(255, 130, 0, 0.8)',
              0.8, 'rgba(255, 68, 68, 0.9)',
              1, 'rgba(255, 0, 0, 1)'
            ],
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 2,
              9, 20
            ],
            'heatmap-opacity': 0.6
          }
        });
      }

      // Update heatmap data
      const heatmapData = {
        type: 'FeatureCollection',
        features: this.filteredInventory.map(f => ({
          type: 'Feature',
          geometry: f.geometry,
          properties: {
            trafficScore: f.properties.trafficScore
          }
        }))
      };

      const source = this.map.getSource('heatmap-source') as any;
      if (source) {
        source.setData(heatmapData);
      }
    } else {
      // Remove heatmap layer
      if (this.map.getLayer('heatmap-layer')) {
        this.map.removeLayer('heatmap-layer');
      }
    }
  }

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
 * Auto focus map on highest density inventory area
 */
  focusHighServiceArea() {
    if (!this.map || !this.filteredInventory.length) return;

    // Count inventory per city
    const cityCounts: { [city: string]: number } = {};

    this.filteredInventory.forEach(f => {
      const city = f.properties.city || 'Unknown';
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    });

    // Find city with highest inventory
    const topCity = Object.keys(cityCounts).reduce((a, b) =>
      cityCounts[a] > cityCounts[b] ? a : b
    );

    // Get all features in that city
    const cityFeatures = this.filteredInventory.filter(
      f => f.properties.city === topCity
    );

    // Get center coordinate of that cluster
    const lngs = cityFeatures.map(f => f.geometry.coordinates[0]);
    const lats = cityFeatures.map(f => f.geometry.coordinates[1]);

    const centerLng = lngs.reduce((a, b) => a + b) / lngs.length;
    const centerLat = lats.reduce((a, b) => a + b) / lats.length;

    // Fly to location
    this.map.flyTo({
      center: [centerLng, centerLat],
      zoom: 14,
      speed: 1.2,
      curve: 1.4,
      essential: true
    });

    console.log(`Focused on high-service city: ${topCity}`);
  }

}