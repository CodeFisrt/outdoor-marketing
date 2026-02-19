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
import { environment } from '../../../environments/environment';

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
  panorama: any;
  routeSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  // =====================================
  // INIT
  // =====================================

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.routeSub = this.route.paramMap.subscribe(params => {
      this.lat = Number(params.get('lat'));
      this.lng = Number(params.get('lng'));
      this.loadGoogleMapsScript();
    });
  }

  // =====================================
  // MODERN SCRIPT LOADER (NO WARNING)
  // =====================================

  loadGoogleMapsScript(): void {

    // If already loaded
    if (typeof google !== 'undefined' && google.maps) {
      this.initStreetView();
      return;
    }

    // Attach callback globally
    (window as any).initMap = () => {
      this.initStreetView();
    };

    const script = document.createElement('script');

    script.src =
      `https://maps.googleapis.com/maps/api/js` +
      `?key=${environment.googleMapsApiKey}` +
      `&callback=initMap` +
      `&loading=async`;

    script.async = true;
    script.defer = true;

    document.head.appendChild(script);
  }

  // =====================================
  // STREET VIEW INIT
  // =====================================

  initStreetView(): void {

    if (!this.lat || !this.lng) return;

    const container = document.getElementById('streetView');
    if (!container) return;

    const location = { lat: this.lat, lng: this.lng };

    const streetViewService = new google.maps.StreetViewService();

    streetViewService.getPanorama(
      { location, radius: 50 },
      (data: any, status: any) => {

        if (status === 'OK') {

          this.panorama = new google.maps.StreetViewPanorama(container, {
            pano: data.location.pano,
            pov: {
              heading: 180,
              pitch: 15
            },
            zoom: 1,
            fullscreenControl: true,
            motionTracking: false,
            addressControl: false,
            showRoadLabels: true
          });

        } else {

          container.innerHTML = `
            <div style="color:white;display:flex;justify-content:center;align-items:center;height:100%;background:#000;">
              Street View not available for this location
            </div>
          `;
        }
      }
    );
  }

  // =====================================
  // DESTROY
  // =====================================

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

}
