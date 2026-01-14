import {
  Component,
  AfterViewInit,
  Inject,
  OnDestroy
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-map3d-view',
  standalone: true,
  templateUrl: './map3d-view.html',
  styleUrls: ['./map3d-view.css']
})
export class Map3dView implements AfterViewInit, OnDestroy {

  lat!: number;
  lng!: number;
  map: any;
  routeSub!: Subscription;

  currentMode: 'satellite' | 'vector' = 'satellite';
  rotating = false;

  // Store initial state
  private initialZoom = 16;
  private initialPitch = 65;
  private initialBearing = -30;

  constructor(
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.routeSub = this.route.paramMap.subscribe(params => {
      this.lat = Number(params.get('lat'));
      this.lng = Number(params.get('lng'));
      this.initMap();
    });
  }

  async initMap() {
    const maplibregl = await import('maplibre-gl');

    if (this.map) this.map.remove();

    this.map = new maplibregl.Map({
      container: 'map3d',
      style: 'https://api.maptiler.com/maps/hybrid/style.json?key=29Yo8ENRoXeW4LWcMl68',
      center: [this.lng, this.lat],
      zoom: this.initialZoom,
      pitch: this.initialPitch,
      bearing: this.initialBearing,
      antialias: true,
      pixelRatio: window.devicePixelRatio || 2,
      maxZoom: 22
    } as any);

    this.map.addControl(new maplibregl.NavigationControl({ visualizePitch: true, showCompass: true }), 'top-right');

    new maplibregl.Marker({ color: 'red' })
      .setLngLat([this.lng, this.lat])
      .addTo(this.map);

    this.map.on('load', () => {
      this.enable3DBuildings();
      this.applyLayerMode();
    });
  }

  enable3DBuildings() {
    const layers = this.map.getStyle().layers;
    const labelLayerId = layers.find(
      (l: any) => l.type === 'symbol' && l.layout?.['text-field']
    )?.id;

    this.map.addLayer(
      {
        id: '3d-buildings',
        source: 'maptiler_planet',
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 15,
        paint: {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': ['get', 'render_height'],
          'fill-extrusion-base': ['get', 'render_min_height'],
          'fill-extrusion-opacity': 0.85
        }
      },
      labelLayerId
    );
  }

  applyLayerMode() {
    const layers = this.map.getStyle().layers;
    layers.forEach((layer: any) => {
      if (layer.source === 'satellite') {
        this.map.setLayoutProperty(
          layer.id,
          'visibility',
          this.currentMode === 'satellite' ? 'visible' : 'none'
        );
      }
      if (layer.source === 'maptiler_planet') {
        this.map.setLayoutProperty(
          layer.id,
          'visibility',
          this.currentMode === 'vector' || layer.type === 'symbol'
            ? 'visible'
            : 'none'
        );
      }
    });
  }

  switchMode() {
    this.currentMode = this.currentMode === 'vector' ? 'satellite' : 'vector';
    this.applyLayerMode();
  }

  /* =======================
     ROTATION
  ======================= */
  rotateLeft() {
    this.map.easeTo({
      bearing: this.map.getBearing() - 30,
      duration: 300,
      easing: (t: any) => t
    });
  }

  rotateRight() {
    this.map.easeTo({
      bearing: this.map.getBearing() + 30,
      duration: 300,
      easing: (t: any) => t
    });
  }

  rotate360() {
    if (this.rotating) return;
    this.rotating = true;

    const startBearing = this.map.getBearing();
    const duration = 10000; // 5 seconds
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const bearing = startBearing + 360 * progress;
      this.map.setBearing(bearing);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.rotating = false;
      }
    };

    requestAnimationFrame(animate);
  }

  resetView() {
    this.map.flyTo({
      center: [this.lng, this.lat],
      zoom: this.initialZoom,
      pitch: this.initialPitch,
      bearing: this.initialBearing,
      speed: 2,
      curve: 1.5
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    if (this.map) this.map.remove();
  }
}  
