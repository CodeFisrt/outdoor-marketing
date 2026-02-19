import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../ApiServices/Seo-Service/seo-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-our-work',
  imports: [CommonModule],
  templateUrl: './our-work.html',
  styleUrl: './our-work.css'
})
export class OurWork implements OnInit {

  constructor(private seo: SeoService) {

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

  works = [
    {
      image: 'assets/vehicleimg.jpg',
      alt: 'Vehicle Branding',
      title: 'Ganesh Festival Hoarding',
      location: 'Location: FC Road, Pune',
      desc: 'Designed and executed festive hoarding placements for a local sweet shop.'
    },
    {
      image: 'assets/wall-img.jpg',
      alt: 'Wall Hoarding',
      title: 'Wall Campaign',
      location: 'Location: JM Road, Pune',
      desc: 'Wall branding campaign for maximum street visibility.'
    },
    {
      image: 'assets/digitalscreen.jpg',
      alt: 'Digital Screen',
      title: 'Digital Screen Ads',
      location: 'Location: MG Road, Pune',
      desc: 'High-impact LED advertising campaign.'
    },
    {
      image: 'assets/streetimg.jpg',
      alt: 'Street Banner',
      title: 'Street Banner',
      location: 'Location: Baner, Pune',
      desc: 'Festival banner campaign.'
    },
    {
      image: 'assets/billboardimg.jpg',
      alt: 'Billboard',
      title: 'Premium Billboard',
      location: 'Location: Hinjewadi, Pune',
      desc: 'Large format premium billboard execution.'
    }
  ];

  activeIndex = 2; // Center card

  getCardClass(index: number) {
    const diff = index - this.activeIndex;

    switch (diff) {
      case 0: return 'active';
      case -1: return 'left-1';
      case -2: return 'left-2';
      case 1: return 'right-1';
      case 2: return 'right-2';
      default: return 'hidden';
    }
  }

  next() {
    if (this.activeIndex < this.works.length - 1) {
      this.activeIndex++;
    }
  }

  prev() {
    if (this.activeIndex > 0) {
      this.activeIndex--;
    }
  }


}
