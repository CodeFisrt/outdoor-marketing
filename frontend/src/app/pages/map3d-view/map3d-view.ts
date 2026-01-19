import {
  Component,
  AfterViewInit,
  OnDestroy,
  Inject
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-map3d-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map3d-view.html',
  styleUrls: ['./map3d-view.css']
})
export class Map3dView implements AfterViewInit, OnDestroy {

  lat!: number;
  lng!: number;

  map: any = null;
  routeSub!: Subscription;

  viewMode: 'satellite' = 'satellite';

  constructor(
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  /* ===============================
     INIT
  =============================== */
  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.routeSub = this.route.paramMap.subscribe(params => {
      this.lat = Number(params.get('lat'));
      this.lng = Number(params.get('lng'));
      this.loadEsriMap();
    });
  }

  /* ===============================
     ESRI WORLD IMAGERY (FREE)
  =============================== */
  async loadEsriMap() {
    this.destroyMap();

    const maplibregl = await import('maplibre-gl');

    this.map = new maplibregl.Map({
      container: 'map3d',
      style: this.getEsriStyle(),
      center: [this.lng, this.lat],
      zoom: 16,
      pitch: 45,
      bearing: 0,
      antialias: true
    } as any);

    this.map.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true,
        showCompass: true
      }),
      'top-right'
    );

    new maplibregl.Marker({ color: 'red' })
      .setLngLat([this.lng, this.lat])
      .addTo(this.map);
  }

  /* ===============================
     ESRI STYLE (RASTER)
  =============================== */
  getEsriStyle() {
    return {
      version: 8,
      sources: {
        esri: {
          type: 'raster',
          tiles: [
            'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256,
          attribution: '© Esri, Maxar, Earthstar Geographics'
        }
      },
      layers: [
        {
          id: 'esri-world-imagery',
          type: 'raster',
          source: 'esri'
        }
      ]
    };
  }

  /* ===============================
     TOOLBAR ACTIONS
  =============================== */
  resetView() {
    if (!this.map) return;

    this.map.easeTo({
      center: [this.lng, this.lat],
      zoom: 16,
      pitch: 45,
      bearing: 0
    });
  }

  rotateLeft() {
    if (!this.map) return;
    this.map.rotateTo(this.map.getBearing() - 30, { duration: 300 });
  }

  rotateRight() {
    if (!this.map) return;
    this.map.rotateTo(this.map.getBearing() + 30, { duration: 300 });
  }

  /* ===============================
     CLEANUP
  =============================== */
  destroyMap() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.destroyMap();
  }
}
