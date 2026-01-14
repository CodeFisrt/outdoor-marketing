import { Component, OnInit } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Featuredservice } from '../..//ApiServices/featuredservice';

@Component({
  selector: 'app-featured-list',
  standalone: true,
  imports: [CommonModule, NgFor],
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
    private router: Router,
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

  getBoardId(item: any) {
    return item.h_id || item.b_id || item.ScreenID || item.v_id || item.s_id;
  }

  viewMore(item: any, type: string) {
    const id = this.getBoardId(item);

    if (id && type) {
      this.router.navigate(['/screenBoardDescrpt', id, type]);
    } else {
      console.error('Missing ID or type', item, type);
    }
  }
}
