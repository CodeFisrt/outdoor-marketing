# Complete Working Code (Copy-Paste Ready)

## 🎯 This file contains the complete, working code for all modified files

---

## 📄 File 1: `frontend/src/app/pages/home/home.ts`

```typescript
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

  // 🔵 STEP 2: STATE → Filter districts locally (NO API CALL)
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
```

---

## 📄 File 2: `frontend/src/app/pages/home/home.html`

```html
<section class="home-sec">
  <div class="container-fluid px-0 main-container">
    <div id="home-carousel" class="carousel slide carousel-fade" data-bs-ride="carousel">
      <div class="carousel-inner">
        <div class="carousel-item active">
          <img src="assets/billboardimg.jpg" class="d-block w-100" alt="..." />
        </div>
        <div class="carousel-item">
          <img src="assets/digitalscreen.jpg" class="d-block w-100" alt="..." loading="lazy" />
        </div>
        <div class="carousel-item">
          <img src="assets/digitalscreen.jpg" class="d-block w-100" alt="..." loading="lazy" />
        </div>
        <div class="carousel-item">
          <img src="assets/vehicleimg.jpg" class="d-block w-100" alt="..." loading="lazy" />
        </div>
        <div class="carousel-item">
          <img src="assets/streetimg.jpg" class="d-block w-100" alt="..." />
        </div>
      </div>
      <button class="carousel-control-prev" type="button" data-bs-target="#home-carousel" data-bs-slide="prev">
        <span class="carousel-control-prev-icon bg-primary rounded-3 border" aria-hidden="true"></span>
        <span class="visually-hidden">Previous</span>
      </button>
      <button class="carousel-control-next" type="button" data-bs-target="#home-carousel" data-bs-slide="next">
        <span class="carousel-control-next-icon bg-primary rounded-3 border" aria-hidden="true"></span>
        <span class="visually-hidden">Next</span>
      </button>
    </div>
  </div>
</section>

<section class="filter-section">
  <div class="filter-card">
    <h3 class="filter-title">Find Outdoor Advertising</h3>

    <div class="filter-row">

      <!-- CATEGORY -->
      <select class="filter-item"
              [(ngModel)]="selectedServiceType"
              (change)="onServiceTypeChange()">
        <option value="">Select Type</option>
        <option *ngFor="let type of categoryList" [value]="type">
          {{ type }}
        </option>
      </select>

      <!-- STATE -->
      <select class="filter-item"
              [(ngModel)]="selectedState"
              (change)="onStateChange()">
        <option value="">State</option>
        <option *ngFor="let s of states" [value]="s">
          {{ s }}
        </option>
      </select>

      <!-- DISTRICT -->
      <select class="filter-item"
              [(ngModel)]="selectedDistrict"
              (change)="onDistrictChange()">
        <option value="">District</option>
        <option *ngFor="let d of districts" [value]="d">
          {{ d }}
        </option>
      </select>

      <!-- TEHSIL -->
      <select class="filter-item"
              [(ngModel)]="selectedTehsil"
              (change)="onTehsilChange()">
        <option value="">Tehsil</option>
        <option *ngFor="let t of tehsils" [value]="t">
          {{ t }}
        </option>
      </select>

      <!-- VILLAGE -->
      <select class="filter-item"
              [(ngModel)]="selectedVillage">
        <option value="">Village</option>
        <option *ngFor="let v of villages" [value]="v">
          {{ v }}
        </option>
      </select>

      <button class="filter-btn" (click)="searchBoards()">
        Search
      </button>

    </div>
  </div>
</section>

<ng-container *ngIf="showcards">
  <app-screen-board-card-list [filters]="filterData"></app-screen-board-card-list>
</ng-container>
```

---

## 📄 File 3: `frontend/src/app/SearchServices/search.ts`

```typescript
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Search {
  private apiUrl = 'http://localhost:8080/search-services';

  constructor(private http: HttpClient) { }

  searchServices(params: any): Observable<any> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key]) httpParams = httpParams.set(key, params[key]);
    });
    return this.http.get(this.apiUrl, { params: httpParams });
  }
}
```

---

## 📄 File 4: `backend/index.js` (Search API Endpoint Only)

**Add or replace the `/search-services` endpoint with this code:**

```javascript
/**
 * @swagger
 * /search-services:
 *   get:
 *     summary: Get a specific marketing service by type
 *     description: |
 *       Fetch marketing services from a single service type (balloon, society, vehicle, hoardings, outdoor screens) with all fields included.
 *       Optional filters can be applied based on State, District, Tehsil, and Village.
 *
 *     parameters:
 *       - in: query
 *         name: service_type
 *         required: true
 *         schema:
 *           type: string
 *           enum:
 *             - balloon_marketing
 *             - society_marketing
 *             - vehicle_marketing
 *             - hoardings
 *             - outdoormarketingscreens
 *         description: Type of marketing service to fetch
 *
 *       - in: query
 *         name: State
 *         schema:
 *           type: string
 *         description: Filter services by state
 *         example: Maharashtra
 *
 *       - in: query
 *         name: District
 *         schema:
 *           type: string
 *         description: Filter services by district
 *         example: Pune
 *
 *       - in: query
 *         name: Tehsil
 *         schema:
 *           type: string
 *         description: Filter services by tehsil
 *         example: Haveli
 *
 *       - in: query
 *         name: Village
 *         schema:
 *           type: string
 *         description: Filter services by village
 *         example: Shivajinagar
 *
 *     responses:
 *       200:
 *         description: List of services for the selected service type
 *       400:
 *         description: Missing or invalid service_type
 *       500:
 *         description: Server or SQL error
 */
app.get('/search-services', (req, res) => {
  const { service_type, State, District, Tehsil, Village } = req.query;

  // 🔍 Log incoming request
  console.log('🔍 Search API Called:', {
    service_type,
    filters: { State, District, Tehsil, Village }
  });

  if (!service_type) {
    return res.status(400).json({ message: 'service_type is required' });
  }

  const serviceTables = {
    balloon_marketing: 'balloon_marketing',
    society_marketing: 'society_marketing',
    vehicle_marketing: 'vehicle_marketing',
    hoardings: 'hoardings',
    outdoormarketingscreens: 'outdoormarketingscreens'
  };

  const tableName = serviceTables[service_type];
  if (!tableName) {
    return res.status(400).json({ message: 'Invalid service type' });
  }

  // ✅ Build optimized query with dynamic filters
  let query = `SELECT *, '${service_type}' AS service_type FROM ${tableName} WHERE 1=1`;
  const params = [];

  // Add filters only if they are provided
  if (State)   { query += ' AND State = ?';   params.push(State); }
  if (District){ query += ' AND District = ?';params.push(District); }
  if (Tehsil)  { query += ' AND Tehsil = ?';  params.push(Tehsil); }
  if (Village) { query += ' AND Village = ?'; params.push(Village); }

  console.log('📤 Executing SQL Query:', query);
  console.log('📋 Query Parameters:', params);

  // Execute single optimized query
  db.query(query, params, (err, results) => {
    if (err) {
      console.error("❌ SQL ERROR:", err.sqlMessage || err);
      return res.status(500).json({ message: err.sqlMessage || err.message });
    }
    
    console.log(`✅ Query successful. Returned ${results.length} results.`);
    res.json(results);
  });
});
```

---

## 🚀 How to Deploy These Changes

### Option 1: Copy-Paste Each File

1. Open each file in your editor
2. Copy the complete code from this document
3. Paste and save

### Option 2: Already Applied

✅ **These changes have already been applied to your project!**

You just need to:

1. **Restart your backend:**
   ```bash
   cd d:\codefirst\CLIENT PROJECT\OutDoor_Marketing\adOnStreet-Angular\backend
   node index.js
   ```

2. **Restart your frontend:**
   ```bash
   cd d:\codefirst\CLIENT PROJECT\OutDoor_Marketing\adOnStreet-Angular\frontend
   npm start
   ```

3. **Test in browser:**
   - Open DevTools → Network tab
   - Filter by: `search-services`
   - Test the dropdown flow
   - Verify only 2 API calls total

---

## ✅ Verification

After applying, you should see:

**Browser Console:**
```
🔍 Search initiated - Single API call with all filters
📤 API Request Payload: {service_type: "hoardings", State: "Maharashtra", ...}
✅ API Response: [...]
```

**Backend Terminal:**
```
🔍 Search API Called: { service_type: 'hoardings', filters: { State: 'Maharashtra', ... } }
📤 Executing SQL Query: SELECT *, 'hoardings' AS service_type FROM hoardings WHERE 1=1 AND State = ? ...
📋 Query Parameters: ['Maharashtra', 'Ahmednagar', 'Shevgaon']
✅ Query successful. Returned 12 results.
```

---

**All code ready to use! ✅**
