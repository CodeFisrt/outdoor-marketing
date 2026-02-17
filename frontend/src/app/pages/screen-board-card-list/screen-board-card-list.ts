import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-screen-board-card-list',
  imports: [CommonModule,RouterLink],
  templateUrl: './screen-board-card-list.html',
  styleUrl: './screen-board-card-list.css'
})
export class ScreenBoardCardList implements OnChanges {

  @Input() filters: any;
  boards: any[] = [];
  selectedBoard: any = null;

  imageBaseUrl: string = 'http://localhost:8080/uploads/';
  fallbackImage: string = 'assets/no-image.png';

  constructor(private router: Router) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['filters'] && this.filters) {
      this.boards = this.filters;
    }
  }

  onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = this.fallbackImage;
  }

  // ⭐ UNIVERSAL ID EXTRACTOR
  getBoardId(b: any) {
    return b.h_id || b.b_id || b.ScreenId || b.v_id || b.s_id;
  }

  viewMore(b: any) {
    const id = this.getBoardId(b);
    const type = b.service_type; // Ensure service_type is available in the object
    if (id && type) {
      this.router.navigate(['/screenBoardDescrpt', id, type]);
    } else {
      console.error('Missing ID or Service Type for navigation', b);
    }
  }
}
