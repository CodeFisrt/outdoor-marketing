/**
 * Seed script to populate database with dummy inventory data for testing
 * Run: node scripts/seed-inventory-data.js
 */

require("dotenv").config();
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "your_database",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
});

db.connect((err) => {
  if (err) {
    console.error("Database Connection Failed:", err);
    process.exit(1);
  }
  console.log("Connected to MySQL Database");
  seedData();
});

// Major Indian cities with coordinates
const cities = [
  { name: "Mumbai", state: "Maharashtra", lat: 19.0760, lng: 72.8777 },
  { name: "Delhi", state: "Delhi", lat: 28.6139, lng: 77.2090 },
  { name: "Bangalore", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
  { name: "Hyderabad", state: "Telangana", lat: 17.3850, lng: 78.4867 },
  { name: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707 },
  { name: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639 },
  { name: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567 },
  { name: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714 },
  { name: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873 },
  { name: "Surat", state: "Gujarat", lat: 21.1702, lng: 72.8311 },
];

// Generate random coordinates within city bounds (±0.1 degrees)
function getRandomCoords(city) {
  const latOffset = (Math.random() - 0.5) * 0.2;
  const lngOffset = (Math.random() - 0.5) * 0.2;
  return {
    lat: city.lat + latOffset,
    lng: city.lng + lngOffset,
  };
}

// Generate dummy hoardings
function seedHoardings() {
  const hoardings = [];
  const sizes = ["10x20", "12x24", "14x48", "16x32", "20x40"];
  const statuses = ["available", "booked", "maintenance"];
  const owners = ["AdTech Media", "Outdoor Solutions", "Billboard Pro", "City Ads", "Highway Media"];

  cities.forEach((city, cityIndex) => {
    // Create 15-25 hoardings per city
    const count = 15 + Math.floor(Math.random() * 11);
    for (let i = 0; i < count; i++) {
      const coords = getRandomCoords(city);
      const isFeatured = Math.random() < 0.1; // 10% featured
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      hoardings.push({
        h_name: `Hoarding ${city.name} ${i + 1}`,
        address: `${Math.floor(Math.random() * 100) + 1} Main Street, ${city.name}`,
        city: city.name,
        State: city.state,
        latitude: coords.lat,
        longitude: coords.lng,
        size: sizes[Math.floor(Math.random() * sizes.length)],
        owner_name: owners[Math.floor(Math.random() * owners.length)],
        contact_person: `Contact ${i + 1}`,
        contact_number: `9${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        status: status,
        rental_cost: Math.floor(Math.random() * 50000) + 10000,
        featured: isFeatured ? 1 : 0,
        ad_start_date: null,
        ad_end_date: null,
        contract_start_date: new Date().toISOString().split("T")[0],
        contract_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        notes: `High visibility location in ${city.name}`,
      });
    }
  });

  return hoardings;
}

// Generate dummy digital screens
function seedScreens() {
  const screens = [];
  const screenTypes = ["LED Display", "Digital Billboard", "LED Wall", "Digital Screen", "LED Panel"];
  const sizes = ["5x3", "6x4", "8x5", "10x6", "12x8"];
  const resolutions = ["1920x1080", "2560x1440", "3840x2160", "1920x1200"];
  const statuses = ["available", "booked", "maintenance"];
  const owners = ["Digital Media Solutions", "LED Pro", "Screen Tech", "Digital Ads Co", "Smart Display"];

  cities.forEach((city) => {
    // Create 10-20 screens per city
    const count = 10 + Math.floor(Math.random() * 11);
    for (let i = 0; i < count; i++) {
      const coords = getRandomCoords(city);
      const isFeatured = Math.random() < 0.15; // 15% featured
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      screens.push({
        ScreenName: `${screenTypes[Math.floor(Math.random() * screenTypes.length)]} ${city.name} ${i + 1}`,
        Location: `${Math.floor(Math.random() * 100) + 1} Tech Park, ${city.name}`,
        City: city.name,
        State: city.state,
        Latitude: coords.lat,
        Longitude: coords.lng,
        ScreenType: screenTypes[Math.floor(Math.random() * screenTypes.length)],
        Size: sizes[Math.floor(Math.random() * sizes.length)],
        Resolution: resolutions[Math.floor(Math.random() * resolutions.length)],
        OwnerName: owners[Math.floor(Math.random() * owners.length)],
        ContactPerson: `Contact ${i + 1}`,
        ContactNumber: `9${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        Status: status,
        RentalCost: Math.floor(Math.random() * 80000) + 20000,
        featured: isFeatured ? 1 : 0,
        OnboardingDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        ContractStartDate: new Date().toISOString().split("T")[0],
        ContractEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        PowerBackup: Math.random() > 0.3 ? "Yes" : "No",
        InternetConnectivity: Math.random() > 0.2 ? "Yes" : "No",
        Notes: `Digital screen in prime ${city.name} location`,
      });
    }
  });

  return screens;
}

async function seedData() {
  try {
    console.log("Starting data seeding...");

    // Seed hoardings
    const hoardings = seedHoardings();
    console.log(`Generated ${hoardings.length} hoardings`);

    const hoardingQuery = `
      INSERT INTO hoardings (
        h_name, address, city, State, latitude, longitude, size,
        owner_name, contact_person, contact_number, status, rental_cost,
        featured, contract_start_date, contract_end_date, notes
      ) VALUES ?
    `;

    const hoardingValues = hoardings.map((h) => [
      h.h_name,
      h.address,
      h.city,
      h.State,
      h.latitude,
      h.longitude,
      h.size,
      h.owner_name,
      h.contact_person,
      h.contact_number,
      h.status,
      h.rental_cost,
      h.featured,
      h.contract_start_date,
      h.contract_end_date,
      h.notes,
    ]);

    await db.promise().query(hoardingQuery, [hoardingValues]);
    console.log(`✓ Inserted ${hoardings.length} hoardings`);

    // Seed screens
    const screens = seedScreens();
    console.log(`Generated ${screens.length} digital screens`);

    const screenQuery = `
      INSERT INTO outdoormarketingscreens (
        ScreenName, Location, City, State, Latitude, Longitude, ScreenType, Size, Resolution,
        OwnerName, ContactPerson, ContactNumber, Status, RentalCost, featured,
        OnboardingDate, ContractStartDate, ContractEndDate, PowerBackup, InternetConnectivity, Notes
      ) VALUES ?
    `;

    const screenValues = screens.map((s) => [
      s.ScreenName,
      s.Location,
      s.City,
      s.State,
      s.Latitude,
      s.Longitude,
      s.ScreenType,
      s.Size,
      s.Resolution,
      s.OwnerName,
      s.ContactPerson,
      s.ContactNumber,
      s.Status,
      s.RentalCost,
      s.featured,
      s.OnboardingDate,
      s.ContractStartDate,
      s.ContractEndDate,
      s.PowerBackup,
      s.InternetConnectivity,
      s.Notes,
    ]);

    await db.promise().query(screenQuery, [screenValues]);
    console.log(`✓ Inserted ${screens.length} digital screens`);

    console.log("\n✅ Data seeding completed successfully!");
    console.log(`Total inventory items: ${hoardings.length + screens.length}`);
    console.log(`  - Hoardings: ${hoardings.length}`);
    console.log(`  - Digital Screens: ${screens.length}`);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

