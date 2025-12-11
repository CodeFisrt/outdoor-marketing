import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScreenBoardCardList } from '../screen-board-card-list/screen-board-card-list';
import { Search } from '../../SearchServices/search';
import { HttpParams } from '@angular/common/http';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, ScreenBoardCardList],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

  constructor(private searchService: Search, private cdr: ChangeDetectorRef) { }

  categoryMap: any = {
    "Hoarding": "hoardings",
    "Vehicle Marketing": "vehicle_marketing",
    "Digital Marketing": "outdoormarketingscreens",
    "Poll Kiosk": "balloon_marketing",
    "Wall Painting": "society_marketing"
  };

  categoryList = Object.keys(this.categoryMap);

  selectedServiceType = "";
  selectedState = "";
  selectedDistrict = "";
  selectedTehsil = "";
  selectedVillage = "";

  states: any[] = [];
  districts: any[] = [];
  tehsils: any[] = [];
  villages: any[] = [];

  filterData: any = null;
  showcards = false;




  // 🔵 STEP 1: SERVICE TYPE → STATES
  onServiceTypeChange() {
    const service_type = this.categoryMap[this.selectedServiceType];

    this.selectedState = "";
    this.selectedDistrict = "";
    this.selectedTehsil = "";
    this.selectedVillage = "";
    this.states = [];
    this.districts = [];
    this.tehsils = [];
    this.villages = [];

    this.searchService.searchServices({ service_type }).subscribe((res: any) => {
      this.states = [
        ...new Set(
          res.map((service: any) => (service.State || "").toString().trim().toLowerCase())
        ),
      ]
        .map((state: any) => state.charAt(0).toUpperCase() + state.slice(1))
        .sort();
    });
  }

  // 🔵 STEP 2: STATE → DISTRICT
  onStateChange() {
    const service_type = this.categoryMap[this.selectedServiceType];

    this.selectedDistrict = "";
    this.selectedTehsil = "";
    this.selectedVillage = "";
    this.districts = [];
    this.tehsils = [];
    this.villages = [];

    this.searchService
      .searchServices({ service_type, State: this.selectedState })
      .subscribe((res: any) => {
        this.districts = [
          ...new Set(
            res.map((state: any) =>
              (state.District || "").toString().trim().toLowerCase()
            )
          ),
        ]
          .filter((dist: any) => dist !== "")
          .map((dist: any) => dist.charAt(0).toUpperCase() + dist.slice(1))
          .sort();
      });
  }

  // 🔵 STEP 3: DISTRICT → TEHSIL
  onDistrictChange() {
    const service_type = this.categoryMap[this.selectedServiceType];

    this.selectedTehsil = "";
    this.selectedVillage = "";
    this.tehsils = [];
    this.villages = [];

    this.searchService
      .searchServices({
        service_type,
        State: this.selectedState,
        District: this.selectedDistrict,
      })
      .subscribe((res: any) => {
        this.tehsils = [
          ...new Set(res.map((district: any) => (district.Tehsil || "").trim())),
        ].filter((tehsil) => tehsil !== "");
      });
  }

  // 🔵 STEP 4: TEHSIL → VILLAGE
  onTehsilChange() {
    const service_type = this.categoryMap[this.selectedServiceType];

    this.selectedVillage = "";
    this.villages = [];

    this.searchService
      .searchServices({
        service_type,
        State: this.selectedState,
        District: this.selectedDistrict,
        Tehsil: this.selectedTehsil,
      })
      .subscribe((res: any) => {
        this.villages = [
          ...new Set(res.map((tehsil: any) => (tehsil.Village || "").trim())),
        ].filter((village) => village !== "");
      });
  }

  // 🔵 FINAL SEARCH
  searchBoards() {
    console.log("Search initiated");
    const filters = {
      service_type: this.categoryMap[this.selectedServiceType],
      State: this.selectedState,
      District: this.selectedDistrict,
      Tehsil: this.selectedTehsil,
      Village: this.selectedVillage,
    };

    this.searchService.searchServices(filters).subscribe({
      next: (res: any) => {
        this.filterData = res;
        this.showcards = true;
        console.log("API Response:", this.filterData);
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error fetching boards:", err),
    });
  }
}