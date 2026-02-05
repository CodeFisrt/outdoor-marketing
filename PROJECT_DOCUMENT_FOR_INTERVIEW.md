# Outdoor Marketing (AdOnStreet) — Project Document for Interview

## 1. Project Overview

**Project Name:** Outdoor Marketing / AdOnStreet  
**Type:** Full-stack web application  
**Purpose:** A B2B platform for **outdoor advertising inventory** — discovery, booking, and management of billboards, digital screens, hoardings, vehicle ads, society/event campaigns, balloon ads, and wall painting across India.

**In one line:** *“A platform where agencies and advertisers can discover, filter, and book outdoor ad inventory (hoardings, digital screens, vehicle ads, etc.) with location-based search, role-based dashboards, and real-time inventory map.”*

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Angular 20, TypeScript, Angular Material, Bootstrap 5, RxJS |
| **Maps & Charts** | MapLibre GL JS (inventory map), Chart.js / ng2-charts (dashboards) |
| **Backend** | Node.js, Express 5 |
| **Database** | MySQL (mysql2 driver) |
| **Auth** | JWT (jsonwebtoken), bcryptjs for password hashing |
| **Real-time** | Socket.io (server + client) |
| **File Upload** | Multer |
| **Email** | Nodemailer |
| **API Docs** | Swagger (swagger-jsdoc, swagger-ui-express) |

---

## 3. Architecture

- **Monorepo-style:** `frontend/` (Angular SPA) and `backend/` (Express API) in one repo.
- **REST API:** All business logic exposed via REST endpoints; routes split by domain (users, inventory, booking, vehicles, hoardings, screens, etc.).
- **WebSocket:** Socket.io for real-time inventory status updates and booking notifications on the inventory map.
- **Database:** Single MySQL instance; connection via `mysql2`; env-based config (`.env`).

---

## 4. Key Features & Modules

### 4.1 Public / Marketing Site
- **Home:** Category cards (Hoarding, Vehicle Ads, Digital Screen, Poll Kiosk, Wall Painting, Society), featured items, search (state → district → tehsil → village).
- **Services:** List of service types with descriptions and CTAs.
- **Our Work, Blog, Blog Details:** Content pages.
- **Contact Us:** Contact form (likely backed by contact API).
- **SEO:** Dynamic meta title, description, keywords, canonical (e.g. via `SeoService`).

### 4.2 Authentication & Users
- **Sign In / Sign Up:** JWT-based login; role-based registration (Admin, Agency, Screen Owner, Guest).
- **Guards:** `authGuard` (must be logged in), `roleGuard` (role-based route access).
- **Interceptor:** Attaches `Authorization: Bearer <token>` to API requests.
- **Admin user management:** List users, add user (with role-specific fields: agency, owner, guest), strong password validation.

### 4.3 Role-Based Dashboards
- **Admin:** Full access; user management, all inventory and booking operations.
- **Agency:** Book inventory, view dashboards, submit forms.
- **Screen Owner:** Manage own screens/inventory, view dashboards.
- **Guest:** Limited view (e.g. browse, no booking).

Dashboard routes (under `/dashboard`) include:
- Overview (stats/charts)
- Hoardings, Digital Screen, Vehicle Ads, Poll Kiosk, Wall Painting (list + CRUD forms)
- User management (users-list, add user)
- Child routes for forms: e.g. `screen-Form/:id`, `hoarding-form/:id`, etc.

### 4.4 Inventory Map (Highlight for Interview)
- **Page:** `/inventory-map` (Angular component + MapLibre GL).
- **Features:**
  - Map view of all inventory (hoardings, digital screens) with markers.
  - **Spatial queries:** Backend uses MySQL spatial functions and bounding box; returns **GeoJSON** for the current view.
  - **Filters:** Media type, city, availability, traffic score, search by code/area/landmark.
  - **Heatmap:** Traffic density overlay (toggle in UI).
  - **Booking:** Click marker → “Book Now” → select dates → create booking (Admin/Agency only).
  - **Real-time:** Socket.io — `inventory-updated`, `booking-created` so all clients see updates without refresh.
- **APIs:** `GET /inventory` (with filters + optional `bounds`), `GET /inventory/:id`, `PUT /inventory/:id/status`, `POST /inventory/bookings`, `GET /inventory/bookings`.

### 4.5 Service-Specific Modules (Backend + Frontend)
- **Vehicles:** Vehicle ad campaigns (type, area, city, dates, cost, payment status).
- **Societies:** Society/event campaigns (event type, date, approval status, cost).
- **Balloons:** Balloon/billboard locations (location, size, type, dates, cost).
- **Screens:** Digital screens (name, location, city, size, resolution, owner, rental cost, contract dates).
- **Hoardings:** Hoarding inventory (name, address, city, size, status, rental cost, contract dates).
- **Booking & Contact:** Booking flows and contact form submission.

Each has dedicated routes (e.g. `vehicles.routes.js`, `societies.routes.js`) and frontend services/forms.

### 4.6 Search & Dashboard Data
- **Search:** Centralized search API used by home (state/district/tehsil/village + service type).
- **Dashboard:** Aggregated stats and charts (dashboard.routes.js + DashboardOverview component).

---

## 5. Data Models (Summary)

- **Screen:** ScreenID, ScreenName, Location, City, State, Lat/Long, ScreenType, Size, Resolution, Owner, Contact, Dates, Status, RentalCost, etc.
- **Vehicle:** v_id, v_type, v_number, v_area, v_city, dates, expected_crowd, contact, v_cost, payment_status.
- **Balloon:** b_id, location, area, city, lat/long, size, type, dates, cost, payment_status.
- **Society:** s_id, name, area, city, pincode, event_type, event_date, approval_status, costs, etc.
- **Hoarding:** h_id, name, address, city, lat/long, size, status (Available/Occupied/Booked/Maintenance), rental_cost, contract dates.
- **Users:** userId, userName, userEmail, role (admin/agency/screenowner/guest), role-specific fields (agencyName, ownerCompanyName, guestPhone, etc.).
- **Inventory (unified):** Used for map — id, mediaType, location (geo), city, availabilityStatus, traffic score, etc.; **inventory_bookings** for booking records.

---

## 6. Security & Best Practices

- **Auth:** JWT in `Authorization: Bearer <token>`; verified in middleware (`auth.js`, `adminAuth.js`).
- **Passwords:** Hashed with bcryptjs; strong password rule for admin-created users (length + upper + lower + number + special).
- **Role-based access:** Admin-only routes (e.g. `/Users`, `/Users/register`); booking creation restricted to Admin/Agency.
- **SQL:** Parameterized queries (e.g. `?` placeholders) to avoid SQL injection.
- **CORS:** Configured for frontend origins (e.g. localhost:4200, 5173).
- **File uploads:** Served from `/uploads` (e.g. images for hoardings/screens).

---

## 7. Setup & Run (Quick)

**Backend**
```bash
cd backend
cp .env.example .env   # set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET
npm install
node scripts/seed-inventory-data.js   # optional: seed inventory for map
npm start   # Server: http://localhost:8080, Swagger: /api-docs
```

**Frontend**
```bash
cd frontend
npm install
npm start   # App: http://localhost:4200
```

**Important URLs**
- App: `http://localhost:4200`
- API: `http://localhost:8080`
- API Docs: `http://localhost:8080/api-docs`
- Inventory Map: `http://localhost:4200/inventory-map`

---

## 8. Interview Talking Points

- **Full-stack ownership:** “I worked on both Angular frontend and Node/Express backend, including API design, auth, and database.”
- **Real-time:** “We used Socket.io so inventory status and new bookings reflect live for all users on the map without refresh.”
- **Scalable API design:** “Routes are split by domain (inventory, users, vehicles, etc.) and registered from a single place; Swagger for documentation.”
- **Maps & geo:** “The inventory map uses MapLibre GL and GeoJSON; the backend uses MySQL spatial queries and bounding box for efficient map loading.”
- **Role-based UX:** “Different dashboards and permissions for Admin, Agency, Screen Owner, and Guest; guards and interceptors for protected routes.”
- **Data modeling:** “Multiple inventory types (screens, hoardings, vehicles, societies, balloons) with consistent patterns and a unified inventory layer for the map and bookings.”
- **Security:** “JWT auth, bcrypt for passwords, parameterized SQL, and role checks on sensitive operations.”

---

## 9. File Structure (High Level)

```
outdoor-marketing/
├── backend/
│   ├── index.js              # Express app, Socket.io, CORS, route registration
│   ├── db.js                 # MySQL connection
│   ├── config.js
│   ├── middleware/           # auth.js, adminAuth.js
│   ├── routes/               # registerAll.js, users, inventory, vehicles, hoardings, etc.
│   ├── scripts/              # create-admin.js, seed-inventory-data.js
│   └── uploads/              # Static images
├── frontend/
│   └── src/app/
│       ├── ApiServices/      # API clients (inventory, vehicle, hoarding, etc.)
│       ├── guards/           # authGuard, roleGuard
│       ├── Interceptor/      # auth-interceptor
│       ├── Model/            # TypeScript interfaces (Screen, Vehicle, Hoarding, etc.)
│       ├── pages/            # home, inventory-map, dashboards, sign-in, etc.
│       ├── Services/         # Feature modules (hoardings, digital-screen, vehicle-ads, etc.)
│       ├── Services Forms/   # Forms for each service type
│       ├── shared/           # header, footer
│       └── app.routes.ts
└── project Doc/              # Internal docs (API flow, design, fixes)
```

---

## 10. One-Paragraph Project Summary (For Resume / Intro)

*“Outdoor Marketing (AdOnStreet) is a full-stack B2B platform for outdoor advertising in India. The frontend is built with Angular 20 and TypeScript, and the backend with Node.js and Express, using MySQL for persistence. It supports multiple inventory types—hoardings, digital screens, vehicle ads, society campaigns, balloon ads, and wall painting—with role-based dashboards for Admin, Agency, Screen Owner, and Guest. A key feature is an interactive inventory map (MapLibre GL) with spatial queries, GeoJSON, filters, heatmap, and booking; real-time updates are delivered via Socket.io. The project includes JWT authentication, role-based access control, REST APIs documented with Swagger, and responsive UI with Angular Material and Bootstrap.”*

---

*Use this document to explain the project, tech stack, and your role in interviews. Adjust the “I” vs “we” and add specific tasks you implemented (e.g. “I implemented the inventory map and Socket.io integration”) as needed.*
