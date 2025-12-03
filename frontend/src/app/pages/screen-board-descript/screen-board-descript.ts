import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-screen-board-descript',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './screen-board-descript.html',
  styleUrl: './screen-board-descript.css'
})
export class ScreenBoardDescript {

  board: any = null;

  boards = [
    { id: 1, hoardingType: "Hoarding", state: "Maharashtra", district: "Pune", taluka: "Haveli", village: "Shivajinagar", location: "Shivajinagar", size: "10x20", price: 5000, image: "/assets/billboard-mockup_1022-7.avif", availability: "Available", description: "Best location" },
    { id: 2, hoardingType: "Digital Screen", state: "Maharashtra", district: "Pune", taluka: "Mulshi", village: "Hinjewadi", location: "Hinjewadi", size: "15x25", price: 8000, image: "assets/board2.jpg", availability: "Booked", description: "High traffic" },
    { id: 3, hoardingType: "Hoarding", state: "Maharashtra", district: "pune", taluka: "Mulshi", village: "Lavale", location: "Rankala", size: "12x18", price: 6000, image: "assets/board3.jpg", availability: "Available", description: "Near main road" },
    { id: 4, hoardingType: "Vehicle Marking", state: "Maharashtra", district: "Pune", taluka: "Haveli", village: "Shivajinagar", location: "Shivajinagar", size: "10x20", price: 5000, image: "assets/board4.jpg", availability: "Booked", description: "High visibility" },
    { id: 5, hoardingType: "Poll Kiosk", state: "Maharashtra", district: "Pune", taluka: "Haveli", village: "Shivajinagar", location: "Shivajinagar", size: "5x10", price: 3000, image: "assets/board5.jpg", availability: "Available", description: "Near traffic signals" },
    { id: 6, hoardingType: "Hoarding", state: "Maharashtra", district: "kolhapur", taluka: "Karveer", village: "Rankala", location: "Shivajinagar", size: "10x20", price: 5000, image: "assets/billboard-mockup_1022-7.avif", availability: "", description: "Best location" }
  ];

  // ⬅️ THIS VARIABLE WILL CONTROL WHICH UI TO SHOW
  currentSection: string = "details";         //// details | book | schedule | bidding
  nearBoards: any[] = [];
  constructor(private _route: ActivatedRoute) { }

 
  ngOnInit() {
    const id = Number(this._route.snapshot.paramMap.get('id'));
    this.board = this.boards.find(b => b.id === id);

    if (this.board) {
      // Auto filter same district + same hoardingType
      this.nearBoards = this.boards.filter(b =>
        b.district.toLowerCase() === this.board.district.toLowerCase() &&
        b.hoardingType.toLowerCase() === this.board.hoardingType.toLowerCase() &&
        b.id !== this.board.id
      );
    }
  }

  //change section
  showSection(section: string) {
    this.currentSection = section;
  }
  ///go the previous page 

  goBack() {
    history.back();

  }
}


