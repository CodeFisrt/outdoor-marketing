// da0a475f090c618128d9ae25
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

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.routeSub = this.route.paramMap.subscribe(params => {
      this.lat = Number(params.get('lat'));
      this.lng = Number(params.get('lng'));
      this.waitForGoogleAndLoad();
    });
  }

  waitForGoogleAndLoad() {
    if (typeof google !== 'undefined' && google.maps) {
      this.loadGoogle3DMap();
    } else {
      setTimeout(() => this.waitForGoogleAndLoad(), 100);
    }
  }

  async loadGoogle3DMap() {
    this.destroyMap();

    const mapDiv = document.getElementById('map3d');
    if (!mapDiv) return;

    const center = { lat: this.lat, lng: this.lng };

    // 💰 Billing counter
    (window as any).googleApiCount = ((window as any).googleApiCount || 0) + 1;
    console.log("💰 Total Google Map Loads:", (window as any).googleApiCount);

    this.map = new google.maps.Map(mapDiv, {
      center,
      zoom: 22,
      heading: 40,
      tilt: 80,
      mapId: 'da0a475f090c618128d9ae25',

      // 🛰 Map Type Switch
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_RIGHT,
        mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
      },

      // ✅ STREET VIEW FIX
      streetViewControl: true,
      streetViewControlOptions: {
        position: google.maps.ControlPosition.TOP_RIGHT
      },

      fullscreenControl: false
    });

    const panorama = new google.maps.StreetViewPanorama(
      document.createElement("div"),
      { position: center }
    );

    this.map.setStreetView(panorama);


    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    this.marker = new AdvancedMarkerElement({
      map: this.map,
      position: center,
      title: "Hoarding Location"
    });

    google.maps.event.addListenerOnce(this.map, 'idle', () => {
      this.map.moveCamera({
        center,
        zoom: 22,
        tilt: 80,
        heading: 40
      });
    });
  }

  resetView() {
    if (!this.map) return;
    this.map.moveCamera({
      center: { lat: this.lat, lng: this.lng },
      zoom: 22,
      tilt: 80,
      heading: 40
    });
  }

  rotateLeft() {
    if (!this.map) return;
    const heading = this.map.getHeading() || 0;
    this.map.moveCamera({ heading: heading - 25 });
  }

  rotateRight() {
    if (!this.map) return;
    const heading = this.map.getHeading() || 0;
    this.map.moveCamera({ heading: heading + 25 });
  }

  destroyMap() {
    if (this.marker) {
      this.marker.map = null;
      this.marker = null;
    }
    if (this.map) {
      google.maps.event.clearInstanceListeners(this.map);
      this.map = null;
    }
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.destroyMap();
  }


}
