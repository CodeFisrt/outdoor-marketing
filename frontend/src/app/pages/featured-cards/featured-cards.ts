import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { Featuredservice } from '../../ApiServices/featuredservice';

@Component({
  selector: 'app-featured-cards',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './featured-cards.html',
  styleUrls: ['./featured-cards.css']
})
export class FeaturedCards implements OnInit {

  hoardings: any[] = [];
  screens: any[] = [];
  vehicles: any[] = [];
  polls: any[] = [];
  societies: any[] = [];

  imageBaseUrl = 'http://localhost:8080/uploads/';
  fallbackImage = 'assets/main-bg-img.jpg';

  constructor(
    private featuredService: Featuredservice,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Load all data once
    this.featuredService.loadAll();

    // HOME PAGE → show only 3 items
    this.hoardings = this.featuredService.hoardings.slice(0, 3);
    this.screens = this.featuredService.screens.slice(0, 3);
    this.vehicles = this.featuredService.vehicles.slice(0, 3);
    this.polls = this.featuredService.polls.slice(0, 3);
    this.societies = this.featuredService.societies.slice(0, 3);
  }

  onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    img.src = this.fallbackImage;
  }

  viewMore(type: string) {
    this.router.navigate(['/featured', type]);
  }
}
