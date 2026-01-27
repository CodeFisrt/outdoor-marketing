# Inventory Map Features - Complete Implementation Guide

## 🎯 Overview

This document describes all the advanced features added to the PlaneFinder-style inventory map application.

## ✅ Implemented Features

### 1. MySQL Spatial Indexing & GeoJSON Support
- **Location**: `backend/routes/inventory.routes.js`
- **Features**:
  - Uses MySQL spatial functions for efficient bounding box queries
  - Returns GeoJSON format for map visualization
  - Optimized for large datasets with spatial indexing

**Usage**: The API automatically uses spatial queries when `bounds` parameter is provided.

### 2. WebSocket Integration (Real-time Updates)
- **Backend**: Socket.io server in `backend/index.js`
- **Frontend**: Socket.io-client in `frontend/src/app/pages/inventory-map/inventory-map.ts`
- **Features**:
  - Real-time inventory status updates
  - Real-time booking notifications
  - Automatic reconnection handling

**Events**:
- `join-inventory`: Join inventory updates room
- `inventory-updated`: Receive status change notifications
- `booking-created`: Receive new booking notifications

### 3. Heatmap Visualization
- **Location**: `frontend/src/app/pages/inventory-map/inventory-map.ts`
- **Features**:
  - Traffic density heatmap overlay
  - Color-coded by traffic score (blue → green → orange → red)
  - Zoom-based intensity adjustment
  - Toggle via "Heatmap" button in map mode controls

**Usage**: Click "Heatmap" button in top-right map controls to toggle.

### 4. Booking Calendar Integration
- **Location**: `frontend/src/app/pages/inventory-map/inventory-map.ts`
- **Backend API**: `POST /inventory/bookings`, `GET /inventory/bookings`
- **Features**:
  - Create bookings for inventory items
  - View existing bookings calendar
  - Date conflict detection
  - Real-time booking updates via WebSocket

**Usage**:
1. Click on any inventory marker
2. Click "Book Now" in popup
3. Select start and end dates
4. Create booking (requires admin/agency role)

### 5. Role-Based Access Control
- **Location**: `frontend/src/app/pages/inventory-map/inventory-map.ts`
- **Features**:
  - View access: All authenticated users
  - Booking access: Admin and Agency roles only
  - Automatic role checking before booking creation

**Roles**:
- `admin`: Full access
- `agency`: Can create bookings
- `screenowner`: View only
- `guest`: View only

### 6. Dummy Data Seeding Script
- **Location**: `backend/scripts/seed-inventory-data.js`
- **Features**:
  - Generates 200-400+ inventory items across 10 major Indian cities
  - Mix of hoardings and digital screens
  - Realistic coordinates, sizes, and metadata
  - Featured items, various statuses

**Usage**:
```bash
cd backend
node scripts/seed-inventory-data.js
```

**Generated Data**:
- 15-25 hoardings per city (150-250 total)
- 10-20 digital screens per city (100-200 total)
- Cities: Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad, Jaipur, Surat

### 7. Navbar Menu Item
- **Location**: `frontend/src/app/shared/header/header.html`
- **Feature**: Added "Inventory Map" link in main navigation

## 🚀 Setup Instructions

### Backend Setup

1. **Install Dependencies**:
```bash
cd backend
npm install
```

2. **Configure Database**:
Update `.env` file with your MySQL credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=your_database
DB_PORT=3306
```

3. **Seed Dummy Data** (Optional):
```bash
node scripts/seed-inventory-data.js
```

4. **Start Server**:
```bash
npm start
# Server runs on http://localhost:8080
# WebSocket server ready for connections
```

### Frontend Setup

1. **Install Dependencies**:
```bash
cd frontend
npm install
```

2. **Start Development Server**:
```bash
npm start
# App runs on http://localhost:4200
```

3. **Access Inventory Map**:
Navigate to: `http://localhost:4200/inventory-map`

## 📋 API Endpoints

### Inventory APIs

- `GET /inventory` - Get all inventory with filters
  - Query params: `mediaType`, `city`, `availabilityStatus`, `isDigital`, `minTrafficScore`, `bounds`
  - Returns: GeoJSON FeatureCollection

- `GET /inventory/:id` - Get single inventory item
  - Returns: InventoryItem object

- `GET /inventory/trending?limit=10` - Get trending items
  - Returns: Array of InventoryItem

- `PUT /inventory/:id/status` - Update availability status
  - Body: `{ "availabilityStatus": "available|booked|maintenance" }`
  - Emits WebSocket event: `inventory-updated`

### Booking APIs

- `POST /inventory/bookings` - Create booking
  - Body: `{ inventoryId, mediaType, startDate, endDate, userId?, agencyId? }`
  - Emits WebSocket event: `booking-created`

- `GET /inventory/bookings` - Get bookings
  - Query params: `inventoryId`, `startDate`, `endDate`
  - Returns: Array of booking objects

## 🎨 Map Features

### Map Modes
- **All**: Show all inventory
- **Digital Only**: Only digital screens
- **High Traffic**: Traffic score ≥ 80
- **Available**: Available status only
- **Maintenance**: Under maintenance
- **Heatmap**: Traffic density visualization

### Filters
- Media Type (Hoarding, Digital Screen, LED, etc.)
- City (auto-populated from data)
- Availability Status
- Visibility/Traffic Rating
- Search (Code, Area, Landmark)

### Sidebar
- **Trending Tab**: Top 10 high-traffic items
- **Disruptions Tab**: Items with issues
- **Map Focus**: Radio buttons for quick filtering
- **Filters Panel**: Advanced filtering options

## 🔧 Database Schema

### Inventory Bookings Table (Auto-created)
```sql
CREATE TABLE inventory_bookings (
  booking_id INT AUTO_INCREMENT PRIMARY KEY,
  inventory_id VARCHAR(255) NOT NULL,
  media_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  user_id INT,
  agency_id INT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_inventory (inventory_id),
  INDEX idx_dates (start_date, end_date)
);
```

## 🎯 Usage Examples

### View Inventory Map
1. Navigate to `/inventory-map`
2. Map loads with all inventory items
3. Use filters to narrow down results
4. Click markers to see details

### Create Booking
1. Click on inventory marker
2. Click "Book Now" in popup
3. Select dates (must be admin/agency role)
4. Click "Create Booking"
5. Booking appears in calendar

### View Heatmap
1. Click "Heatmap" button in map controls
2. See traffic density visualization
3. Click again to toggle off

### Real-time Updates
- Status changes broadcast to all connected clients
- Bookings appear immediately for all users
- No page refresh needed

## 🐛 Troubleshooting

### WebSocket Connection Issues
- Ensure backend server is running on port 8080
- Check CORS settings in `backend/index.js`
- Verify Socket.io client URL matches server

### Database Connection
- Verify MySQL credentials in `.env`
- Ensure database exists
- Check table structure matches expected schema

### Map Not Loading
- Check browser console for errors
- Verify MapLibre GL CSS is loaded
- Ensure inventory data exists (run seed script)

## 📝 Notes

- Spatial indexing improves query performance for large datasets
- WebSocket connections auto-reconnect on disconnect
- Heatmap intensity adjusts based on zoom level
- Booking calendar shows conflicts in real-time
- All features are production-ready and tested

## 🔐 Security

- Role-based access enforced on booking creation
- JWT tokens required for authenticated routes
- WebSocket connections validated
- SQL injection protection via parameterized queries

---

**Built with**: Angular 20, MapLibre GL JS, Socket.io, MySQL, Express.js

