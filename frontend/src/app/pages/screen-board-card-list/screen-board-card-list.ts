import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';



@Component({
  selector: 'app-screen-board-card-list',
  imports: [CommonModule],
  templateUrl: './screen-board-card-list.html',
  styleUrl: './screen-board-card-list.css'
})
export class ScreenBoardCardList  {
  
  
  @Input() filters: any; // array of boards
  boards: any[] = [];
  selectedBoard: any = null;

  constructor(private router: Router) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['filters'] && this.filters) {
      this.boards = this.filters; // use API result directly
    }
  }

  viewMore(id: number) {
    this.router.navigateByUrl(`screenBoardDescrpt/${id}`)
  }
}
