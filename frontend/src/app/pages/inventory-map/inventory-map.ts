import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
  PLATFORM_ID,
  Inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService, InventoryItem, GeoJSONFeature } from '../../ApiServices/CallApis/inventory-service';
import { HoardingService } from '../../ApiServices/CallApis/hoarding-service';
import { io, Socket } from 'socket.io-client';

type MapMode = 'all' | 'digital_only' | 'high_traffic' | 'available' | 'maintenance' | 'heatmap';

@Component({
  selector: 'app-inventory-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-map.html',
  styleUrls: ['./inventory-map.css']
})
export class InventoryMap implements OnInit, AfterViewInit, OnDestroy {
  map: any = null;
  markers: Map<string, any> = new Map();
  popup: any = null;
  selectedItem: InventoryItem | null = null;
  clusterSource: any = null;
  socket: Socket | null = null;

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
  activeTab: 'trending' | 'disruptions' = 'trending';

  // Filters
  selectedMediaType = '';
  selectedCity = '';
  selectedAvailability = '';
  selectedVisibility = '';
  searchQuery = '';

  // Data
  allInventory: GeoJSONFeature[] = [];
  filteredInventory: GeoJSONFeature[] = [];
  trendingItems: InventoryItem[] = [];
  cities: string[] = [];

  // Media type options
  mediaTypes = [
    { value: '', label: 'All Types' },
    { value: 'hoarding', label: 'Hoardings / Billboards' },
    { value: 'digital_screen', label: 'Digital Screens' },
    { value: 'led_screen', label: 'LED Screens' },
    { value: 'transit_media', label: 'Transit Media' },
    { value: 'bus_shelter', label: 'Bus Shelters' },
    { value: 'unipole', label: 'Unipoles' }
  ];

  availabilityOptions = [
    { value: '', label: 'All Status' },
    { value: 'available', label: 'Available' },
    { value: 'booked', label: 'Booked' },
    { value: 'maintenance', label: 'Maintenance' }
  ];

  visibilityOptions = [
    { value: '', label: 'All Visibility' },
    { value: 'high', label: 'High Traffic (80+)' },
    { value: 'medium', label: 'Medium Traffic (60-79)' },
    { value: 'low', label: 'Low Traffic (<60)' }
  ];

  constructor(
    private inventoryService: InventoryService,
    private hoardingService: HoardingService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadTrendingItems();
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
      await this.initMap();
      // Inventory will be loaded in map.on('load') callback

      // Listen for view details event from popup
      window.addEventListener('viewInventoryDetails', (e: any) => {
        const inventoryId = e.detail;
        console.log('View details for:', inventoryId);
        // Navigate to details page or show modal
      });
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('viewInventoryDetails', () => { });
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
    }
  }

  /**
   * Initialize MapLibre GL map
   */
  async initMap() {
    const maplibregl = await import('maplibre-gl');

    this.map = new maplibregl.Map({
      container: 'inventory-map',
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
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
      },
      // center: [77.2090, 28.6139], // New Delhi, India
      // zoom: 5,
      pitch: 0,
      bearing: 0
    });

    // Add dark theme overlay
    this.map.on('load', async () => {
      this.map.addLayer({
        id: 'dark-overlay',
        type: 'background',
        paint: {
          'background-color': '#0a0e27'
        }
      }, 'simple-tiles');

      // Adjust raster layer opacity for dark theme
      this.map.setPaintProperty('simple-tiles', 'raster-opacity', 0.4);

      // Initialize clustering source
      await this.initClustering();

      // Load inventory after map is ready
      await this.loadInventory();
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

    // Create popup
    this.popup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      maxWidth: '400px',
      className: 'inventory-popup'
    });
  }

  /**
   * Load all inventory data
   */
  async loadInventory() {
    this.isLoading = true;
    try {
      const response = await this.inventoryService.getInventory().toPromise();
      if (response) {
        this.allInventory = response.features;
        this.extractCities();
        this.applyFilters();
        // Update map source if clustering is initialized
        if (this.map && this.map.getSource('inventory-clusters')) {
          await this.updateMarkers();
        }
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }

    this.applyFilters();

    // Auto zoom to high service area
    setTimeout(() => this.focusHighServiceArea(), 500);

  }

  /**
   * Load trending items for sidebar
   */
  async loadTrendingItems() {
    try {
      this.trendingItems = await this.inventoryService.getTrendingInventory(10).toPromise() || [];
    } catch (error) {
      console.error('Error loading trending items:', error);
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

    // Media type filter
    if (this.selectedMediaType) {
      filtered = filtered.filter(f => f.properties.mediaType === this.selectedMediaType);
    }

    // City filter
    if (this.selectedCity) {
      filtered = filtered.filter(f => f.properties.city === this.selectedCity);
    }

    // Availability filter
    if (this.selectedAvailability) {
      filtered = filtered.filter(f => f.properties.availabilityStatus === this.selectedAvailability);
    }

    // Visibility filter
    if (this.selectedVisibility) {
      const score = this.selectedVisibility === 'high' ? 80 : this.selectedVisibility === 'medium' ? 60 : 0;
      filtered = filtered.filter(f =>
        this.selectedVisibility === 'high' ? f.properties.trafficScore >= 80 :
          this.selectedVisibility === 'medium' ? f.properties.trafficScore >= 60 && f.properties.trafficScore < 80 :
            f.properties.trafficScore < 60
      );
    }

    // Search query
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(f =>
        f.properties.name?.toLowerCase().includes(query) ||
        f.properties.inventoryId?.toString().includes(query) ||
        f.properties.area?.toLowerCase().includes(query) ||
        f.properties.landmark?.toLowerCase().includes(query)
      );
    }

    // Map mode filters
    if (this.mapMode === 'digital_only') {
      filtered = filtered.filter(f => f.properties.isDigital);
    } else if (this.mapMode === 'high_traffic') {
      filtered = filtered.filter(f => f.properties.trafficScore >= 80);
    } else if (this.mapMode === 'available') {
      filtered = filtered.filter(f => f.properties.availabilityStatus === 'available');
    } else if (this.mapMode === 'maintenance') {
      filtered = filtered.filter(f => f.properties.availabilityStatus === 'maintenance');
    } else if (this.mapMode === 'heatmap') {
      this.showHeatmap = true;
    } else {
      this.showHeatmap = false;
    }

    this.filteredInventory = filtered;
    this.updateMarkers();

    // Update heatmap if enabled
    if (this.showHeatmap) {
      this.toggleHeatmap();
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
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-size': 12
      },
      paint: {
        'text-color': '#0a0e27'
      }
    });

    // Add unclustered points
    this.map.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'inventory-clusters',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': [
          'match',
          ['get', 'mediaType'],
          'hoarding', '#ff8200',
          'digital_screen', '#00d4ff',
          'led_screen', '#00ff88',
          'transit_media', '#ff00ff',
          'bus_shelter', '#ffff00',
          'unipole', '#ff4444',
          '#888'
        ],
        'circle-radius': 12,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
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

    // Click on unclustered point to show popup
    this.map.on('click', 'unclustered-point', (e: any) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const props = e.features[0].properties;
      // Find full item data
      const fullItem = this.filteredInventory.find(
        f => f.properties.inventoryId.toString() === props.inventoryId?.toString()
      );
      if (fullItem) {
        this.showPopup(fullItem.properties, coordinates);
      } else {
        this.showPopup(props, coordinates);
      }
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
   * Update markers on map using clustering
   */
  async updateMarkers() {
    if (!this.map || !this.map.getSource('inventory-clusters')) {
      // If source doesn't exist yet, wait for map load
      return;
    }

    // Update GeoJSON source with filtered data
    const source = this.map.getSource('inventory-clusters') as any;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: this.filteredInventory
      });
    }
  }

  /**
   * Update markers based on viewport (for performance with large datasets)
   */
  updateMarkersForViewport() {
    if (!this.map || this.filteredInventory.length < 1000) return;

    const bounds = this.map.getBounds();
    const visibleFeatures = this.filteredInventory.filter(feature => {
      const [lng, lat] = feature.geometry.coordinates;
      return bounds.contains([lng, lat]);
    });

    // Remove markers outside viewport
    this.markers.forEach((marker, id) => {
      const feature = this.filteredInventory.find(f => f.properties.inventoryId.toString() === id);
      if (feature) {
        const [lng, lat] = feature.geometry.coordinates;
        if (!bounds.contains([lng, lat])) {
          marker.remove();
          this.markers.delete(id);
        }
      }
    });

    // Add markers in viewport
    visibleFeatures.forEach(feature => {
      const id = feature.properties.inventoryId.toString();
      if (!this.markers.has(id)) {
        // Re-add marker (simplified - in production, use clustering)
        this.updateMarkers();
      }
    });
  }

  /**
   * Show popup with inventory details
   */
  async showPopup(item: InventoryItem, coordinates: [number, number]) {
    if (!this.map || !this.popup) return;

    this.selectedItem = item;
    const html = this.getPopupHTML(item);
    this.popup
      .setLngLat(coordinates)
      .setHTML(html)
      .addTo(this.map);

    // Fetch Analytics for this item
    this.hoardingService.getHoardingAnalytics(Number(item.inventoryId)).subscribe({
      next: (data) => {
        const container = document.getElementById(`analytics-${item.inventoryId}`);
        if (container) {
          if (data && data.daily_vehicle_count !== undefined) {
            // Show data
            container.innerHTML = `
                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                  <h5 style="font-size: 14px; margin-bottom: 5px; color: #007bff;">📊 Analytics</h5>
                  <div style="font-size: 12px; line-height: 1.5;">
                    <div>🚗 Daily Traffic: <strong>${data.daily_vehicle_count}</strong></div>
                    <div>👥 Est. Humans: <strong>${data.estimated_human_count}</strong></div>
                    <div>👁 Daily Impressions: <strong>${data.daily_impressions}</strong></div>
                    <div>⏰ Peak Hour: <strong>${data.peak_hour}</strong></div>
                  </div>
                </div>
             `;
          } else {
            // No data found, trigger calculation
            container.innerHTML = `<small style="color: #888;">Fetching analytics...</small>`;
            this.hoardingService.calculateAnalytics(Number(item.inventoryId)).subscribe({
              next: (res) => {
                if (res && res.formatted_data) {
                  const d = res.formatted_data;
                  container.innerHTML = `
                        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                          <h5 style="font-size: 14px; margin-bottom: 5px; color: #007bff;">📊 Analytics</h5>
                          <div style="font-size: 12px; line-height: 1.5;">
                            <div>🚗 Daily Traffic: <strong>${d.daily_vehicle_count}</strong></div>
                            <div>👥 Est. Humans: <strong>${d.estimated_human_count}</strong></div>
                            <div>👁 Daily Impressions: <strong>${d.daily_impressions}</strong></div>
                            <div>⏰ Peak Hour: <strong>${d.peak_hour}</strong></div>
                          </div>
                        </div>
                     `;
                } else {
                  container.innerHTML = `<small style="color: #888;">No data available.</small>`;
                }
              },
              error: () => {
                container.innerHTML = `<small style="color: red;">Failed to load analytics.</small>`;
              }
            });
          }
        }
      },
      error: () => {
        const container = document.getElementById(`analytics-${item.inventoryId}`);
        if (container) container.innerHTML = `<small>Analytics unavailable</small>`;
      }
    });

    // Attach click handlers to buttons after popup is added
    setTimeout(() => {
      const viewBtn = document.querySelector('.popup-btn.view-details');
      if (viewBtn) {
        viewBtn.addEventListener('click', () => {
          console.log('View details for:', item.inventoryId);
          // Navigate to details page
          window.location.href = `/screenBoardDescrpt/${item.inventoryId}/${item.mediaType}`;
        });
      }

      const bookBtn = document.querySelector('.popup-btn.book-now');
      if (bookBtn) {
        bookBtn.addEventListener('click', () => {
          this.showBookingCalendarForItem(item);
        });
      }
    }, 100);

    this.cdr.detectChanges();
  }

  /**
   * Generate popup HTML
   */
  getPopupHTML(item: InventoryItem): string {
    const statusColors: { [key: string]: string } = {
      'available': '#00ff88',
      'booked': '#ffaa00',
      'maintenance': '#ff4444'
    };

    return `
      <div class="popup-content">
        <div class="popup-header">
          <h3>${item.name || 'Unnamed Inventory'}</h3>
          <span class="popup-code">Code: ${item.inventoryId}</span>
        </div>
        <div class="popup-body">
          <div class="popup-row">
            <span class="label">Type:</span>
            <span class="value">${this.getMediaTypeLabel(item.mediaType)}</span>
          </div>
          <div class="popup-row">
            <span class="label">Location:</span>
            <span class="value">${item.city}, ${item.area || 'N/A'}</span>
          </div>
          <div class="popup-row">
            <span class="label">Size:</span>
            <span class="value">${item.size || 'N/A'}</span>
          </div>
          <div class="popup-row">
            <span class="label">Traffic Score:</span>
            <span class="value traffic-score">${item.trafficScore}/100</span>
          </div>
          <div class="popup-row">
            <span class="label">Status:</span>
            <span class="value status-badge" style="color: ${statusColors[item.availabilityStatus] || '#888'}">
              ${item.availabilityStatus?.toUpperCase() || 'UNKNOWN'}
            </span>
          </div>
          ${item.isDigital ? `
            <div class="popup-row">
              <span class="label">Digital:</span>
              <span class="value">Yes</span>
            </div>
          ` : ''}
          ${item.rentalCost ? `
            <div class="popup-row">
              <span class="label">Rental Cost:</span>
              <span class="value">₹${item.rentalCost.toLocaleString()}/month</span>
            </div>
            </div>
          ` : ''}
          
          <div id="analytics-${item.inventoryId}" style="min-height: 20px;"></div>

        </div>
        <div class="popup-footer">
          <button class="popup-btn view-details" data-id="${item.inventoryId}">
            View Details
          </button>
          <button class="popup-btn book-now" data-id="${item.inventoryId}">
            Book Now
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Get human-readable media type label
   */
  getMediaTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'hoarding': 'Hoarding / Billboard',
      'digital_screen': 'Digital Screen',
      'led_screen': 'LED Screen',
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
  }

  /**
   * Change map mode
   */
  setMapMode(mode: MapMode) {
    this.mapMode = mode;
    this.applyFilters();
  }

  /**
   * Handle filter changes
   */
  onFilterChange() {
    this.applyFilters();
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.selectedMediaType = '';
    this.selectedCity = '';
    this.selectedAvailability = '';
    this.selectedVisibility = '';
    this.searchQuery = '';
    this.mapMode = 'all';
    this.showHeatmap = false;
    this.toggleHeatmap();
    this.applyFilters();
  }

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
      zoom: 10,
      speed: 1.2,
      curve: 1.4,
      essential: true
    });

    console.log(`Focused on high-service city: ${topCity}`);
  }

}