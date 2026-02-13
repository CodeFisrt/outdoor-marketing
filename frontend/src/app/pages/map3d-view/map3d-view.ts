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
  map: any;
  marker: any;
  panorama: any;
  routeSub!: Subscription;
  visibilityCircle: any;
  roadLine: any;

  constructor(
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.routeSub = this.route.paramMap.subscribe(params => {
      this.lat = Number(params.get('lat'));
      this.lng = Number(params.get('lng'));
      this.waitForGoogle();
    });

    window.addEventListener('keydown', (e) => this.handleKey(e));
  }

  waitForGoogle() {
    if (typeof google !== 'undefined' && google.maps) {
      this.initMap();
    } else setTimeout(() => this.waitForGoogle(), 100);
  }

  async initMap() {
    const center = { lat: this.lat, lng: this.lng };
    const mapDiv = document.getElementById('map3d');
    if (!mapDiv) return;

    this.map = new google.maps.Map(mapDiv, {
      center,
      zoom: 22,
      tilt: 75,
      heading: 40,
      mapId: 'da0a475f090c618128d9ae25',

      // ⭐ DEFAULT SATELLITE
      mapTypeId: 'satellite',

      // 📍 MAP TYPE CONTROL RIGHT SIDE
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_RIGHT,
        mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
      },

      streetViewControl: true,
      streetViewControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP
      },

      rotateControl: true,
      scaleControl: true,
      gestureHandling: "greedy"
    });

    // Marker
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    this.marker = new AdvancedMarkerElement({
      map: this.map,
      position: center,
      title: "Hoarding Location"
    });

    // Street View
    this.panorama = new google.maps.StreetViewPanorama(
      document.createElement("div"),
      { position: center }
    );
    this.map.setStreetView(this.panorama);

    // Visibility radius
    this.visibilityCircle = new google.maps.Circle({
      map: this.map,
      center,
      radius: 80,
      strokeColor: "#00ffcc",
      fillColor: "#00ffcc",
      fillOpacity: 0.15
    });

    // Direction line
    this.roadLine = new google.maps.Polyline({
      map: this.map,
      path: [center, { lat: center.lat + 0.0003, lng: center.lng }],
      strokeColor: "#ffcc00",
      strokeWeight: 3
    });

    this.autoStreetViewBestAngle(center);
  }

  autoStreetViewBestAngle(center: any) {
    const sv = new google.maps.StreetViewService();
    sv.getPanorama({ location: center, radius: 50 }, (data: any, status: any) => {
      if (status === 'OK') {
        this.panorama.setPano(data.location.pano);
        this.panorama.setPov({ heading: 40, pitch: 0 });
        this.panorama.setVisible(true);
      }
    });
  }

  animateCamera(zoom: number, tilt: number, heading: number) {
    this.map.moveCamera({ zoom, tilt, heading });
  }

  setTopView() { this.animateCamera(20, 0, 0); }
  setDriverView() { this.animateCamera(22, 65, 40); }
  setPedestrianView() { this.animateCamera(21, 75, 90); }
  setDroneView() { this.animateCamera(18, 80, 180); }

  zoomClose() { this.map.setZoom(22); }
  zoomMedium() { this.map.setZoom(20); }
  zoomArea() { this.map.setZoom(17); }

  rotateLeft() { this.map.moveCamera({ heading: (this.map.getHeading() || 0) - 20 }); }
  rotateRight() { this.map.moveCamera({ heading: (this.map.getHeading() || 0) + 20 }); }

  resetView() {
    this.map.moveCamera({ center: { lat: this.lat, lng: this.lng }, zoom: 22, tilt: 75, heading: 40 });
  }

  handleKey(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') this.rotateLeft();
    if (e.key === 'ArrowRight') this.rotateRight();
    if (e.key === 'ArrowUp') this.zoomClose();
    if (e.key === 'ArrowDown') this.zoomArea();
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }
}
