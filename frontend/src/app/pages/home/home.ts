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

  // 🔥 Store all data locally to avoid multiple API calls
  allServiceData: any[] = [];

  // 🔵 STEP 1: SERVICE TYPE → Load ALL data for this service type ONCE
  onServiceTypeChange() {
    const service_type = this.categoryMap[this.selectedServiceType];

    // Reset all filters
    this.selectedState = "";
    this.selectedDistrict = "";
    this.selectedTehsil = "";
    this.selectedVillage = "";
    this.states = [];
    this.districts = [];
    this.tehsils = [];
    this.villages = [];
    this.allServiceData = [];

    // ✅ ONLY ONE API CALL - Load all data for this service type
    this.searchService.searchServices({ service_type }).subscribe((res: any) => {
      this.allServiceData = res; // Store all data locally

      // Extract unique states from the data
      this.states = [
        ...new Set(
          res.map((service: any) => (service.State || "").toString().trim().toLowerCase())
        ),
      ]
        .filter((state: any) => state !== "")
        .map((state: any) => state.charAt(0).toUpperCase() + state.slice(1))
        .sort();
    });
  }

  // � STEP 2: STATE → Filter districts locally (NO API CALL)
  onStateChange() {
    this.selectedDistrict = "";
    this.selectedTehsil = "";
    this.selectedVillage = "";
    this.districts = [];
    this.tehsils = [];
    this.villages = [];

    if (!this.selectedState) return;

    // ✅ Filter from local data - NO API CALL
    const filteredData = this.allServiceData.filter(
      (item: any) => item.State?.toLowerCase() === this.selectedState.toLowerCase()
    );

    this.districts = [
      ...new Set(
        filteredData.map((item: any) =>
          (item.District || "").toString().trim().toLowerCase()
        )
      ),
    ]
      .filter((dist: any) => dist !== "")
      .map((dist: any) => dist.charAt(0).toUpperCase() + dist.slice(1))
      .sort();
  }

  // 🔵 STEP 3: DISTRICT → Filter tehsils locally (NO API CALL)
  onDistrictChange() {
    this.selectedTehsil = "";
    this.selectedVillage = "";
    this.tehsils = [];
    this.villages = [];

    if (!this.selectedDistrict) return;

    // ✅ Filter from local data - NO API CALL
    const filteredData = this.allServiceData.filter(
      (item: any) =>
        item.State?.toLowerCase() === this.selectedState.toLowerCase() &&
        item.District?.toLowerCase() === this.selectedDistrict.toLowerCase()
    );

    this.tehsils = [
      ...new Set(filteredData.map((item: any) => (item.Tehsil || "").trim())),
    ]
      .filter((tehsil) => tehsil !== "")
      .sort();
  }

  // 🔵 STEP 4: TEHSIL → Filter villages locally (NO API CALL)
  onTehsilChange() {
    this.selectedVillage = "";
    this.villages = [];

    if (!this.selectedTehsil) return;

    // ✅ Filter from local data - NO API CALL
    const filteredData = this.allServiceData.filter(
      (item: any) =>
        item.State?.toLowerCase() === this.selectedState.toLowerCase() &&
        item.District?.toLowerCase() === this.selectedDistrict.toLowerCase() &&
        item.Tehsil?.trim() === this.selectedTehsil.trim()
    );

    this.villages = [
      ...new Set(filteredData.map((item: any) => (item.Village || "").trim())),
    ]
      .filter((village) => village !== "")
      .sort();
  }

  // 🔵 FINAL SEARCH - Only ONE API call when button is clicked
  searchBoards() {
    console.log("🔍 Search initiated - Single API call with all filters");

    const filters: any = {
      service_type: this.categoryMap[this.selectedServiceType]
    };

    // Only add filters that are selected
    if (this.selectedState) filters.State = this.selectedState;
    if (this.selectedDistrict) filters.District = this.selectedDistrict;
    if (this.selectedTehsil) filters.Tehsil = this.selectedTehsil;
    if (this.selectedVillage) filters.Village = this.selectedVillage;

    console.log("📤 API Request Payload:", filters);

    // ✅ SINGLE API CALL with all selected filters
    this.searchService.searchServices(filters).subscribe({
      next: (res: any) => {
        this.filterData = res;
        this.showcards = true;
        console.log("✅ API Response:", this.filterData);
        this.cdr.detectChanges();
      },
      error: (err) => console.error("❌ Error fetching boards:", err),
    });
  }
}