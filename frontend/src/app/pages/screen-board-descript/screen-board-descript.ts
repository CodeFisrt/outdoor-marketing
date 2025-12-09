import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Search } from '../../SearchServices/search';

@Component({
  selector: 'app-screen-board-descript',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './screen-board-descript.html',
  styleUrl: './screen-board-descript.css'
})
export class ScreenBoardDescript {

  board: any = null;

  // ⬅️ THIS VARIABLE WILL CONTROL WHICH UI TO SHOW
  currentSection: string = "details";         //// details | book | schedule | bidding
  nearBoards: any[] = [];
  constructor(private _route: ActivatedRoute,private searchService:Search) { }

 

  ngOnInit(): void {
    const id = Number(this._route.snapshot.paramMap.get('id'));

   

  }


    // if (this.board) {
    //   // Auto filter same district + same hoardingType
    //   this.nearBoards = this.boards.filter(b =>
    //     b.district.toLowerCase() === this.board.district.toLowerCase() &&
    //     b.hoardingType.toLowerCase() === this.board.hoardingType.toLowerCase() &&
    //     b.id !== this.board.id
    //   );
    
  

  // change section
  showSection(section: string) {
    this.currentSection = section;
  }


  ///go the previous page 

  goBack() {
    history.back();

  }
}


