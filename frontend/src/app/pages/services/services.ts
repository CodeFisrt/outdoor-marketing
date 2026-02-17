import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './services.html',
  styleUrl: './services.css'
})
export class Services {

  services = [
    {
      id: 1,
      title: "Hoarding Advertising",
      image: "assets/billboardimg.jpg",
      shortDesc1: "Make your brand unmissable at high-traffic junctions 24/7.",
      shortDesc2: "Hoardings ensure visibility day & night. Ideal for bold campaigns.",
      fullDescription: "Our hoarding advertising provides large-scale brand visibility at premium highway and city locations with 24/7 exposure."
    },
    {
      id: 2,
      title: "Pole Kiosk Branding",
      image: "assets/streetimg.jpg",
      shortDesc1: "Your brand on every streetlight – visible, frequent, effective.",
      shortDesc2: "Perfect for  city-wide repeated exposure across  repetition and strong recall.",
      fullDescription: "Pole kiosk branding ensures repeated exposure across urban streets, increasing brand memory and recall."
    },
    {
      id: 3,
      title: "Vehicle Advertising",
      image: "assets/vehicleimg.jpg",
      shortDesc1: "Ads that move across the city through transit media.",
      shortDesc2: "LED vans, rickshaw wraps — dynamic & impactful.",
      fullDescription: "Vehicle advertising turns city traffic into marketing opportunities using branded mobile media."
    },
    {
      id: 4,
      title: "Wall Painting",
      image: "assets/wall-img.jpg",
      shortDesc1: "Creative, hyperlocal branding that sticks in minds.",
      shortDesc2: "Artistic and traditional branding for communities.",
      fullDescription: "Wall painting advertising builds strong rural and semi-urban brand presence with artistic visuals."
    },
    {
      id: 5,
      title: "Digital LED Screens",
      image: "assets/digitalscreen.jpg",
      shortDesc1: "Capture attention with high-resolution LED screens.",
      shortDesc2: "Perfect for events, launches & modern campaigns.",
      fullDescription: "Digital LED screens deliver high-impact dynamic advertising at prime commercial hubs."
    }
  ];
//  constructor(private _route: Router){}

// GotoServiceDetails(id:number){
  
//   this._route.navigate(['/services-details', id]);
// }

}
