import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../ApiServices/Seo-Service/seo-service';

@Component({
  selector: 'app-our-work',
  imports: [],
  templateUrl: './our-work.html',
  styleUrl: './our-work.css'
})
export class OurWork implements OnInit {

  constructor(private seo:SeoService){

  }

  ngOnInit(): void {
    this.seo.updateSeo({
    title: 'Our Work- Advertising Branding & Hoardings Projects in Pune',
    description: 'Explore our successful outdoor advertising campaigns in Pune, including hoardings, billboards, vehicle branding, street banners, and digital screens. See how we boost brand visibility for festivals, events, and businesses.',
    keywords: 'outdoor advertising projects, hoardings Pune, billboard advertising Pune, digital screens Pune, vehicle branding, street banners, OOH marketing, festival advertising, brand visibility campaigns',
    canonical: 'https://adonstreet.com/our-work',
    robots: 'INDEX, FOLLOW',
    author: 'CodingEra',
    publisher: 'AdonStreet Marketing',
    lang: 'en-IN'
  });
  }

}
