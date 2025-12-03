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
export class ScreenBoardCardList implements OnChanges {
  
  constructor(private router: Router) {

  }

  @Input() filters: any;
  boards: any[] = [];
  selectedBoard: any = null;


  ngOnChanges(changes: SimpleChanges) {
    if (changes['filters'] && this.filters) {
      this.loadBoards();
    }
  }

  loadBoards() {
    const category = this.filters.category?.toLowerCase() || "";
    const state = this.filters.state?.toLowerCase() || "";
    const district = this.filters.district?.toLowerCase() || "";
    const taluka = this.filters.taluka?.toLowerCase() || "";
    const village = this.filters.village?.toLowerCase() || "";

    this.boards = this.filters.boards.filter((b: any) => {
      return (
        (!category || b.hoardingType?.toLowerCase() === category) &&
        (!state || b.state?.toLowerCase() === state) &&
        (!district || b.district?.toLowerCase() === district) &&
        (!taluka || b.taluka?.toLowerCase() === taluka) &&
        (!village || b.village?.toLowerCase() === village)
      );
    });

    this.selectedBoard = null;
  }

// routing through data send screenBoardDescrpt componts
  viewMore(id: number) {
   this.router.navigate(["/screenBoardDescrpt",id])
    
  }

}
