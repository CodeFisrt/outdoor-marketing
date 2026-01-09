import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Featuredservice } from '../..//ApiServices/featuredservice';

@Component({
  selector: 'app-featured-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './featured-list.html',
  styleUrls: ['./featured-list.css']
})
export class FeaturedList implements OnInit {

  type: string = '';
  items: any[] = [];
  imageBaseUrl = 'http://localhost:8080/uploads/';
  fallbackImage = 'assets/main-bg-img.jpg';

  constructor(
    private route: ActivatedRoute,
    private featuredService: Featuredservice
  ) { }

  ngOnInit(): void {
    this.type = this.route.snapshot.paramMap.get('type') || '';

    // Ensure data is loaded
    this.featuredService.loadAll();

    // Get all items by type
    this.items = this.featuredService.getAllByType(this.type);
  }

  onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    img.src = this.fallbackImage;
  }
}
