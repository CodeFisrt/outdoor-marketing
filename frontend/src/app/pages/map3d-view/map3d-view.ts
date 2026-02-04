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

declare const google: any;

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
  marker: any = null;
  routeSub!: Subscription;

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
      this.waitForGoogleAndLoad();
    });
  }

  /* ===============================
     WAIT FOR GOOGLE SCRIPT
  =============================== */
  waitForGoogleAndLoad() {
    if (typeof google !== 'undefined' && google.maps) {
      this.loadGoogle3DMap();
    } else {
      setTimeout(() => this.waitForGoogleAndLoad(), 50);
    }
  }

  /* ===============================
     GOOGLE 3D WEBGL MAP
  =============================== */
  async loadGoogle3DMap() {
    this.destroyMap();

    const mapDiv = document.getElementById('map3d');

    // 🔥 Prevent IntersectionObserver crash
    if (!mapDiv) {
      setTimeout(() => this.loadGoogle3DMap(), 50);
      return;
    }

    const center = { lat: this.lat, lng: this.lng };

    this.map = new google.maps.Map(mapDiv, {
      center,
      zoom: 18,
      heading: 0,
      tilt: 67.5,
      mapId: 'YOUR_MAP_ID_HERE', // required for WebGL 3D
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    // ✅ NEW ADVANCED MARKER (replaces deprecated Marker)
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    this.marker = new AdvancedMarkerElement({
      map: this.map,
      position: center,
      title: "Hoarding Location"
    });

    // ensure tilt stays
    google.maps.event.addListenerOnce(this.map, 'idle', () => {
      this.map.setTilt(67.5);
    });
  }

  /* ===============================
     TOOLBAR ACTIONS (UNCHANGED)
  =============================== */
  resetView() {
    if (!this.map) return;

    this.map.moveCamera({
      center: { lat: this.lat, lng: this.lng },
      zoom: 18,
      heading: 0,
      tilt: 67.5
    });
  }

  rotateLeft() {
    if (!this.map) return;
    const heading = this.map.getHeading() || 0;
    this.map.moveCamera({ heading: heading - 30 });
  }

  rotateRight() {
    if (!this.map) return;
    const heading = this.map.getHeading() || 0;
    this.map.moveCamera({ heading: heading + 30 });
  }

  /* ===============================
     CLEANUP
  =============================== */
  destroyMap() {
    if (this.marker) {
      this.marker.map = null;
      this.marker = null;
    }
    if (this.map) {
      this.map = null;
    }
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.destroyMap();
  }
}
