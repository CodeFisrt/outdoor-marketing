import { Component } from '@angular/core';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScreenBoardCardList } from '../screen-board-card-list/screen-board-card-list';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, ScreenBoardCardList],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  categories = [
    "Hoarding",
    "Vehicle Marking",
    "Digital Screen",
    "Poll Kiosk",
    "Wall Painting"
  ];

  filterData: any = null;
  showcards: boolean = false
  states = ["Maharashtra"];
  districts: string[] = [];
  talukas: string[] = [];
  villages: string[] = [];

  selectedCategory = "";
  selectedState = "";
  selectedDistrict = "";
  selectedTaluka = "";
  selectedVillage = "";

  /* STATIC BOARD DATA */
  boards = [
    { id: 1, hoardingType: "Hoarding", state: "Maharashtra", district: "Pune", taluka: "Haveli", village: "Shivajinagar", location: "Shivajinagar", size: "10x20", price: 5000, image: "/assets/billboard-mockup_1022-7.avif", availability: "Available", description: "Best location" },
    { id: 2, hoardingType: "Digital Screen", state: "Maharashtra", district: "Pune", taluka: "Mulshi", village: "Hinjewadi", location: "Hinjewadi", size: "15x25", price: 8000, image: "assets/board2.jpg", availability: "Booked", description: "High traffic" },
    { id: 3, hoardingType: "Hoarding", state: "Maharashtra", district: "Kolhapur", taluka: "Karveer", village: "Rankala", location: "Rankala", size: "12x18", price: 6000, image: "assets/board3.jpg", availability: "Available", description: "Near main road" },
    { id: 4, hoardingType: "Vehicle Marking", state: "Maharashtra", district: "Pune", taluka: "Haveli", village: "Shivajinagar", location: "Shivajinagar", size: "10x20", price: 5000, image: "assets/board4.jpg", availability: "Booked", description: "High visibility" },
    { id: 5, hoardingType: "Poll Kiosk", state: "Maharashtra", district: "Pune", taluka: "Haveli", village: "Shivajinagar", location: "Shivajinagar", size: "5x10", price: 3000, image: "assets/board5.jpg", availability: "Available", description: "Near traffic signals" },
    
  ];

  /* LOCATION DATA */
  data: any = {
    maharashtra: {
      pune: {
        haveli: ["Shivajinagar", "Kothrud", "Warje"],
        mulshi: ["Hinjewadi", "Lavale"]
      },
      mumbai: {
        andheri: ["Andheri East", "Andheri West"],
        bandra: ["Bandra East", "Bandra West"]
      },
      sangli: {
        miraj: ["Kupwad", "Miraj Road"]
      },
      kolhapur: {
        karveer: ["Rankala", "Shivaji Peth"]
      }
    }
  };

  /* -------------------------
      CATEGORY CHANGE
  --------------------------*/
  onCategoryChange() {
    this.selectedState = "";
    this.selectedDistrict = "";
    this.selectedTaluka = "";
    this.selectedVillage = "";

    this.districts = [];
    this.talukas = [];
    this.villages = [];
  }

  /* STATE → DISTRICT */
  onStateChange() {
    const stateKey = this.selectedState.toLowerCase();
    this.districts = Object.keys(this.data[stateKey]);
    this.selectedDistrict = "";
    this.talukas = [];
    this.villages = [];
  }

  /* DISTRICT → TALUKA */
  onDistrictChange() {
    const stateKey = this.selectedState.toLowerCase();
    const distKey = this.selectedDistrict.toLowerCase();
    this.talukas = Object.keys(this.data[stateKey][distKey]);
    this.selectedTaluka = "";
    this.villages = [];
  }

  /* TALUKA → VILLAGE  */
  onTalukaChange() {
    const stateKey = this.selectedState.toLowerCase();
    const distKey = this.selectedDistrict.toLowerCase();
    const talukaKey = this.selectedTaluka.toLowerCase();
    this.villages = this.data[stateKey][distKey][talukaKey];
    this.selectedVillage = "";
  }

  /* -------------------------
      SEND SELECTED FILTERS TO CHILD
  --------------------------*/

  searchBoards() {

    this.showcards = true
    this.filterData = {
      category: this.selectedCategory,    
      state: this.selectedState,
      district: this.selectedDistrict,
      taluka: this.selectedTaluka,
      village: this.selectedVillage,
      boards: this.boards
    };
    console.log("Sending Data:", this.filterData);
  }
}
