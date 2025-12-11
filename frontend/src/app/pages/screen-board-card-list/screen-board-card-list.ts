import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-screen-board-card-list',
  imports: [CommonModule],
  templateUrl: './screen-board-card-list.html',
  styleUrl: './screen-board-card-list.css'
})
export class ScreenBoardCardList implements OnChanges {

  @Input() filters: any;
  boards: any[] = [];
  selectedBoard: any = null;

  imageBaseUrl: string = 'http://localhost:8080/uploads/';
  fallbackImage: string = 'assets/no-image.png';

  constructor(private router: Router) {}

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

  viewMore(id: number) {
    this.router.navigateByUrl(`screenBoardDescrpt/${id}`);
  }
}
