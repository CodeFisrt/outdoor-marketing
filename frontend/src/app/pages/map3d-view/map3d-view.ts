import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

declare const google: any;

@Component({
  selector: 'app-map3d-view',
  imports: [],
  templateUrl: './map3d-view.html',
  styleUrl: './map3d-view.css'
})
export class Map3dView {

  lat!: number;
  lng!: number;

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.lat = Number(this.route.snapshot.paramMap.get('lat'));
    this.lng = Number(this.route.snapshot.paramMap.get('lng'));

    setTimeout(() => {

    }, 500);
  }

  loadMap() {
    const map = new google.maps.Map(
      document.getElementById('map')!, {
      center: { lat: this.lat, lng: this.lng },
      zoom: 18,
      mapTypeId: 'satellite',
      tilt: 45,
      heading: 0
    }
    );
  }
}
