import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScreenBoardCardList } from '../screen-board-card-list/screen-board-card-list';
import { Search } from '../../SearchServices/search';
import { HttpParams } from '@angular/common/http';

import { CategoryCards } from '../category-cards/category-cards';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, ScreenBoardCardList, CategoryCards],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  constructor(private searchService: Search, private cdr: ChangeDetectorRef) { }

  categoryMap: any = {
    "Billboard & Hoarding Advertising": "hoardings",
    "Transit Advertising": "vehicle_marketing",
    "Digital Outdoor Advertising (DOOH)": "outdoormarketingscreens",
    "Poll Kiosk": "balloon_marketing",
    "Wall Painting": "society_marketing",
    "Posters, Banners & Street Signage": "posters_banners_streetsignage",
    "Event Sponsorship & Brand Activation": "event_sponsorship_brand_activation",
    "RWA & Society Branding": "society_marketing",
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

  onCategorySelect(category: string) {
    if (this.categoryMap[category]) {
      this.selectedServiceType = category;
      this.onServiceTypeChange();

      // Scroll to filter section smoothly
      document.querySelector('.filter-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

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

      this.saveState(); // Save state after loading initial data
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

    this.saveState();
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

    this.saveState();
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

    this.saveState();
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
        this.saveState(); // Save state with results
        this.cdr.detectChanges();
      },
      error: (err) => console.error("❌ Error fetching boards:", err),
    });
  }
  // Save full state to service
  saveState() {
    this.searchService.setSearchState({
      criteria: {
        selectedServiceType: this.selectedServiceType,
        selectedState: this.selectedState,
        selectedDistrict: this.selectedDistrict,
        selectedTehsil: this.selectedTehsil,
        selectedVillage: this.selectedVillage,
      },
      dropdowns: {
        states: this.states,
        districts: this.districts,
        tehsils: this.tehsils,
        villages: this.villages,
      },
      data: {
        allServiceData: this.allServiceData,
        filterData: this.filterData,
        showcards: this.showcards
      }
    });
  }

  // Restore state from service
  restoreState() {
    const state = this.searchService.getSearchState();
    if (state) {
      console.log("Restoring search state...", state);

      this.selectedServiceType = state.criteria.selectedServiceType;
      this.selectedState = state.criteria.selectedState;
      this.selectedDistrict = state.criteria.selectedDistrict;
      this.selectedTehsil = state.criteria.selectedTehsil;
      this.selectedVillage = state.criteria.selectedVillage;

      this.states = state.dropdowns.states;
      this.districts = state.dropdowns.districts;
      this.tehsils = state.dropdowns.tehsils;
      this.villages = state.dropdowns.villages;

      this.allServiceData = state.data.allServiceData;
      this.filterData = state.data.filterData;
      this.showcards = state.data.showcards;

      this.cdr.detectChanges();

      // Scroll to results if we have them
      if (this.showcards) {
        setTimeout(() => {
          document.querySelector('.search-results-container')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }

  ngOnInit() {
    this.restoreState();
  }
}
