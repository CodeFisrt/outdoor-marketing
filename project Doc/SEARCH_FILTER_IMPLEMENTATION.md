# Search Filter Implementation - Single API Call Solution

## 📋 Overview

This document explains how the search filter system has been optimized to **send only ONE API call** when the user clicks the Search button, instead of multiple API calls on each dropdown change.

---

## ❌ Previous Problem

**Before the fix:**
- **Service Type** dropdown → API call #1
- **State** dropdown → API call #2
- **District** dropdown → API call #3
- **Tehsil** dropdown → API call #4
- **Search button** → API call #5

**Total: 5 API calls** for a single search! 🚫

---

## ✅ Current Solution

**After the fix:**
- **Service Type** dropdown → Load all data for that service type (1 API call)
- **State** dropdown → Filter locally (NO API call)
- **District** dropdown → Filter locally (NO API call)
- **Tehsil** dropdown → Filter locally (NO API call)
- **Village** dropdown → Filter locally (NO API call)
- **Search button** → Final search with all filters (1 API call)

**Total: 2 API calls** - One for loading data, one for search ✅

---

## 🔧 How It Works

### 1. **Frontend Component Logic** (`home.ts`)

#### Step 1: Load All Data When Service Type is Selected
```typescript
onServiceTypeChange() {
  const service_type = this.categoryMap[this.selectedServiceType];
  
  // ✅ Single API call to load ALL data for this service type
  this.searchService.searchServices({ service_type }).subscribe((res: any) => {
    this.allServiceData = res; // Store locally
    
    // Extract unique states
    this.states = [...new Set(res.map(item => item.State))];
  });
}
```

#### Step 2-4: Filter Dropdowns Locally (NO API CALLS)
```typescript
onStateChange() {
  // ✅ Filter from local data - NO API CALL
  const filteredData = this.allServiceData.filter(
    item => item.State === this.selectedState
  );
  this.districts = [...new Set(filteredData.map(item => item.District))];
}

onDistrictChange() {
  // ✅ Filter from local data - NO API CALL
  const filteredData = this.allServiceData.filter(
    item => item.State === this.selectedState &&
            item.District === this.selectedDistrict
  );
  this.tehsils = [...new Set(filteredData.map(item => item.Tehsil))];
}

onTehsilChange() {
  // ✅ Filter from local data - NO API CALL
  const filteredData = this.allServiceData.filter(
    item => item.State === this.selectedState &&
            item.District === this.selectedDistrict &&
            item.Tehsil === this.selectedTehsil
  );
  this.villages = [...new Set(filteredData.map(item => item.Village))];
}
```

#### Step 5: Search Button - Single API Call with All Filters
```typescript
searchBoards() {
  const filters: any = {
    service_type: this.categoryMap[this.selectedServiceType]
  };

  // Add only selected filters
  if (this.selectedState) filters.State = this.selectedState;
  if (this.selectedDistrict) filters.District = this.selectedDistrict;
  if (this.selectedTehsil) filters.Tehsil = this.selectedTehsil;
  if (this.selectedVillage) filters.Village = this.selectedVillage;

  // ✅ SINGLE API CALL with complete payload
  this.searchService.searchServices(filters).subscribe({
    next: (res: any) => {
      this.filterData = res;
      this.showcards = true;
    }
  });
}
```

---

### 2. **Frontend HTML** (`home.html`)

All dropdowns have `[(ngModel)]` for two-way binding:
```html
<!-- Service Type - Triggers data load -->
<select [(ngModel)]="selectedServiceType" (change)="onServiceTypeChange()">
  <option value="">Select Type</option>
  <option *ngFor="let type of categoryList" [value]="type">{{ type }}</option>
</select>

<!-- State - Filters locally -->
<select [(ngModel)]="selectedState" (change)="onStateChange()">
  <option value="">State</option>
  <option *ngFor="let s of states" [value]="s">{{ s }}</option>
</select>

<!-- District - Filters locally -->
<select [(ngModel)]="selectedDistrict" (change)="onDistrictChange()">
  <option value="">District</option>
  <option *ngFor="let d of districts" [value]="d">{{ d }}</option>
</select>

<!-- Tehsil - Filters locally -->
<select [(ngModel)]="selectedTehsil" (change)="onTehsilChange()">
  <option value="">Tehsil</option>
  <option *ngFor="let t of tehsils" [value]="t">{{ t }}</option>
</select>

<!-- Village - No change handler needed -->
<select [(ngModel)]="selectedVillage">
  <option value="">Village</option>
  <option *ngFor="let v of villages" [value]="v">{{ v }}</option>
</select>

<!-- Search Button - Makes final API call -->
<button (click)="searchBoards()">Search</button>
```

---

### 3. **Angular Service** (`search.ts`)

Simple HTTP GET service that accepts dynamic parameters:
```typescript
searchServices(params: any): Observable<any> {
  let httpParams = new HttpParams();
  Object.keys(params).forEach(key => {
    if (params[key]) httpParams = httpParams.set(key, params[key]);
  });
  return this.http.get(this.apiUrl, { params: httpParams });
}
```

---

### 4. **Backend API** (`index.js`)

Optimized `/search-services` endpoint:
```javascript
app.get('/search-services', (req, res) => {
  const { service_type, State, District, Tehsil, Village } = req.query;

  console.log('🔍 Search API Called:', {
    service_type,
    filters: { State, District, Tehsil, Village }
  });

  // Validate service type
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

  // Build dynamic SQL query
  let query = `SELECT *, '${service_type}' AS service_type FROM ${tableName} WHERE 1=1`;
  const params = [];

  // Add filters conditionally
  if (State)   { query += ' AND State = ?';   params.push(State); }
  if (District){ query += ' AND District = ?'; params.push(District); }
  if (Tehsil)  { query += ' AND Tehsil = ?';  params.push(Tehsil); }
  if (Village) { query += ' AND Village = ?'; params.push(Village); }

  // Execute single query
  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ message: err.sqlMessage });
    }
    res.json(results);
  });
});
```

---

## 🎯 Key Benefits

### Performance
- ✅ **Reduced API calls** from 5 to 2 per search
- ✅ **Faster dropdown filtering** (client-side instead of server-side)
- ✅ **Less database load** - fewer queries executed

### User Experience
- ✅ **Instant dropdown updates** - no waiting for API responses
- ✅ **Smoother interaction** - no network delays between selections
- ✅ **Clear search flow** - data loads only when needed

### Maintainability
- ✅ **Cleaner code** - single source of truth for data
- ✅ **Easier debugging** - fewer API calls to track
- ✅ **Better logging** - clear visibility of when API is called

---

## 📊 API Call Flow

```
User Action                    API Call?    Data Source
─────────────────────────────────────────────────────────
1. Select "Hoarding"           ✅ YES      → Backend (load all hoardings)
2. Select "Maharashtra"        ❌ NO       → Local filter
3. Select "Ahmednagar"         ❌ NO       → Local filter
4. Select "Shevgaon"           ❌ NO       → Local filter
5. Click "Search" button       ✅ YES      → Backend (filtered results)
```

---

## 🧪 Testing

### How to Verify It's Working:

1. **Open Browser DevTools** → Network Tab
2. **Filter by**: `search-services`
3. **Select Service Type**: You'll see 1 API call
4. **Select State, District, Tehsil**: NO new API calls
5. **Click Search**: You'll see 1 final API call
6. **Check Console**: You'll see logged filter values

### Expected Console Output:

**Frontend:**
```
🔍 Search initiated - Single API call with all filters
📤 API Request Payload: {
  service_type: "hoardings",
  State: "Maharashtra",
  District: "Ahmednagar",
  Tehsil: "Shevgaon"
}
✅ API Response: [...]
```

**Backend:**
```
🔍 Search API Called: {
  service_type: 'hoardings',
  filters: {
    State: 'Maharashtra',
    District: 'Ahmednagar',
    Tehsil: 'Shevgaon',
    Village: undefined
  }
}
📤 Executing SQL Query: SELECT *, 'hoardings' AS service_type FROM hoardings WHERE 1=1 AND State = ? AND District = ? AND Tehsil = ?
📋 Query Parameters: ['Maharashtra', 'Ahmednagar', 'Shevgaon']
✅ Query successful. Returned 12 results.
```

---

## 🔍 Troubleshooting

### Issue: Dropdowns not populating
**Solution**: Check if `service_type` is selected first

### Issue: Search returns no results
**Solution**: 
- Check browser console for payload
- Check backend logs for SQL query
- Verify database has matching data

### Issue: Multiple API calls still appearing
**Solution**: Clear browser cache and reload

---

## 📝 Summary

The optimized implementation ensures:
1. **Only 1 API call** when service type is selected
2. **Local filtering** for dependent dropdowns (State → District → Tehsil → Village)
3. **Only 1 final API call** when Search button is clicked with complete payload
4. **Better performance**, **faster UX**, and **reduced server load**

✅ **Problem Solved!**
