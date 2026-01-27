/**
 * Unified Inventory API Routes
 * Aggregates hoardings, screens, and other outdoor media into a single inventory endpoint
 * Supports GeoJSON queries and filtering
 */

module.exports = function registerInventoryRoutes(app, db) {
  const io = app.get("io"); // Get Socket.io instance
  
  const safe = (v) => {
    if (v === undefined || v === null || v === "") return null;
    return v;
  };

  // Helper function to create GeoJSON Point from lat/lng
  const createGeoJSONPoint = (lat, lng) => {
    if (!lat || !lng) return null;
    return `POINT(${lng} ${lat})`;
  };

  // Helper function to use MySQL spatial functions
  const buildSpatialQuery = (baseQuery, bounds, params) => {
    if (bounds) {
      const [minLng, minLat, maxLng, maxLat] = bounds.split(",").map(Number);
      // Use ST_Within with bounding box
      baseQuery += ` AND ST_Within(
        ST_GeomFromText(CONCAT('POINT(', longitude, ' ', latitude, ')')),
        ST_GeomFromText('POLYGON((${minLng} ${minLat}, ${maxLng} ${minLat}, ${maxLng} ${maxLat}, ${minLng} ${maxLat}, ${minLng} ${minLat}))')
      )`;
    }
    return baseQuery;
  };

  /**
   * GET /inventory
   * Get all inventory items with optional filters
   * Query params: mediaType, city, availabilityStatus, isDigital, minTrafficScore
   */
  app.get("/inventory", (req, res) => {
    const {
      mediaType,
      city,
      availabilityStatus,
      isDigital,
      minTrafficScore,
      bounds, // "minLng,minLat,maxLng,maxLat"
    } = req.query;

    // Build unified query from hoardings and screens
    let hoardingsQuery = `
      SELECT 
        h_id as inventoryId,
        'hoarding' as mediaType,
        h_name as name,
        CONCAT(COALESCE(address, ''), ', ', COALESCE(city, ''), ', ', COALESCE(State, '')) as location,
        city,
        address as area,
        address as landmark,
        size,
        COALESCE(CAST(status AS CHAR), 'available') as availabilityStatus,
        0 as isDigital,
        latitude,
        longitude,
        COALESCE(CAST(rental_cost AS DECIMAL(10,2)), 0) as rentalCost,
        CASE 
          WHEN featured = 1 THEN 85
          WHEN status = 'available' THEN 70
          ELSE 50
        END as trafficScore,
        NULL as imageUrls,
        NULL as videoFeedUrl,
        NULL as facingDirection,
        NULL as lastInspectionDate,
        owner_name as ownerName,
        contact_number as contactNumber
      FROM hoardings
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    `;

    let screensQuery = `
      SELECT 
        ScreenID as inventoryId,
        CASE 
          WHEN ScreenType LIKE '%LED%' OR ScreenType LIKE '%Digital%' THEN 'led_screen'
          ELSE 'digital_screen'
        END as mediaType,
        ScreenName as name,
        CONCAT(COALESCE(Location, ''), ', ', COALESCE(City, ''), ', ', COALESCE(State, '')) as location,
        City as city,
        Location as area,
        Location as landmark,
        Size as size,
        COALESCE(CAST(Status AS CHAR), 'available') as availabilityStatus,
        1 as isDigital,
        Latitude as latitude,
        Longitude as longitude,
        COALESCE(CAST(RentalCost AS DECIMAL(10,2)), 0) as rentalCost,
        CASE 
          WHEN featured = 1 THEN 90
          WHEN Status = 'available' THEN 75
          WHEN InternetConnectivity = 'Yes' THEN 80
          ELSE 60
        END as trafficScore,
        NULL as imageUrls,
        NULL as videoFeedUrl,
        NULL as facingDirection,
        OnboardingDate as lastInspectionDate,
        OwnerName as ownerName,
        ContactNumber as contactNumber
      FROM outdoormarketingscreens
      WHERE Latitude IS NOT NULL AND Longitude IS NOT NULL
    `;

    const conditions = [];
    const params = [];

    // Apply filters
    if (mediaType) {
      if (mediaType === "hoarding") {
        hoardingsQuery += " AND 1=1";
        screensQuery = ""; // Exclude screens
      } else if (mediaType === "digital_screen" || mediaType === "led_screen") {
        hoardingsQuery = ""; // Exclude hoardings
        if (mediaType === "led_screen") {
          screensQuery += " AND (ScreenType LIKE '%LED%' OR ScreenType LIKE '%Digital%')";
        } else {
          screensQuery += " AND ScreenType NOT LIKE '%LED%'";
        }
      }
    }

    if (city) {
      if (hoardingsQuery) {
        hoardingsQuery += " AND city = ?";
        params.push(city);
      }
      if (screensQuery) {
        screensQuery += screensQuery.includes("WHERE") ? " AND City = ?" : " WHERE City = ?";
        params.push(city);
      }
    }

    if (availabilityStatus) {
      if (hoardingsQuery) {
        hoardingsQuery += " AND status = ?";
        params.push(availabilityStatus);
      }
      if (screensQuery) {
        screensQuery += screensQuery.includes("WHERE") ? " AND Status = ?" : " WHERE Status = ?";
        params.push(availabilityStatus);
      }
    }

    if (isDigital === "true") {
      hoardingsQuery = ""; // Only digital screens
    } else if (isDigital === "false") {
      screensQuery = ""; // Only static hoardings
    }

    if (minTrafficScore) {
      // This will be filtered in post-processing
    }

    // Bounds filtering using MySQL spatial functions (for better performance with spatial index)
    if (bounds) {
      const [minLng, minLat, maxLng, maxLat] = bounds.split(",").map(Number);
      // Use spatial bounding box for better performance
      if (hoardingsQuery) {
        hoardingsQuery += ` AND longitude BETWEEN ${minLng} AND ${maxLng} AND latitude BETWEEN ${minLat} AND ${maxLat}`;
      }
      if (screensQuery) {
        screensQuery += screensQuery.includes("WHERE") 
          ? ` AND Longitude BETWEEN ${minLng} AND ${maxLng} AND Latitude BETWEEN ${minLat} AND ${maxLat}`
          : ` WHERE Longitude BETWEEN ${minLng} AND ${maxLng} AND Latitude BETWEEN ${minLat} AND ${maxLat}`;
      }
    }

    // Combine queries
    let combinedQuery = "";
    if (hoardingsQuery && screensQuery) {
      combinedQuery = `(${hoardingsQuery}) UNION ALL (${screensQuery})`;
    } else if (hoardingsQuery) {
      combinedQuery = hoardingsQuery;
    } else if (screensQuery) {
      combinedQuery = screensQuery;
    } else {
      return res.json([]);
    }

    db.query(combinedQuery, params, (err, results) => {
      if (err) {
        console.error("DB ERROR:", err);
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      // Post-process: filter by traffic score, format response
      let filtered = results;
      if (minTrafficScore) {
        filtered = results.filter((item) => item.trafficScore >= Number(minTrafficScore));
      }

      // Format as GeoJSON features
      const features = filtered.map((item) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [Number(item.longitude), Number(item.latitude)],
        },
        properties: {
          inventoryId: item.inventoryId,
          mediaType: item.mediaType,
          name: item.name,
          location: item.location,
          city: item.city,
          area: item.area,
          landmark: item.landmark,
          size: item.size,
          availabilityStatus: item.availabilityStatus,
          isDigital: Boolean(item.isDigital),
          rentalCost: item.rentalCost,
          trafficScore: item.trafficScore,
          imageUrls: item.imageUrls ? JSON.parse(item.imageUrls) : [],
          videoFeedUrl: item.videoFeedUrl,
          facingDirection: item.facingDirection,
          lastInspectionDate: item.lastInspectionDate,
          ownerName: item.ownerName,
          contactNumber: item.contactNumber,
        },
      }));

      res.json({
        type: "FeatureCollection",
        features,
      });
    });
  });

  /**
   * GET /inventory/:id
   * Get single inventory item by ID
   */
  app.get("/inventory/:id", (req, res) => {
    const { id } = req.params;

    // Try hoardings first
    db.query("SELECT * FROM hoardings WHERE h_id = ?", [id], (err, hoardingResults) => {
      if (err) {
        return res.status(500).json({ message: "Database error", error: err.message });
      }

      if (hoardingResults.length > 0) {
        const h = hoardingResults[0];
        return res.json({
          inventoryId: h.h_id,
          mediaType: "hoarding",
          name: h.h_name,
          location: `${h.address || ""}, ${h.city || ""}, ${h.State || ""}`,
          city: h.city,
          area: h.address,
          landmark: h.address,
          size: h.size,
          availabilityStatus: h.status || "available",
          isDigital: false,
          latitude: h.latitude,
          longitude: h.longitude,
          rentalCost: h.rental_cost,
          trafficScore: h.featured ? 85 : h.status === "available" ? 70 : 50,
          imageUrls: [],
          videoFeedUrl: null,
          facingDirection: null,
          lastInspectionDate: null,
          ownerName: h.owner_name,
          contactNumber: h.contact_number,
          contactPerson: h.contact_person,
          adStartDate: h.ad_start_date,
          adEndDate: h.ad_end_date,
          contractStartDate: h.contract_start_date,
          contractEndDate: h.contract_end_date,
          notes: h.notes,
        });
      }

      // Try screens
      db.query(
        "SELECT * FROM outdoormarketingscreens WHERE ScreenID = ?",
        [id],
        (err, screenResults) => {
          if (err) {
            return res.status(500).json({ message: "Database error", error: err.message });
          }

          if (screenResults.length === 0) {
            return res.status(404).json({ message: "Inventory item not found" });
          }

          const s = screenResults[0];
          return res.json({
            inventoryId: s.ScreenID,
            mediaType: s.ScreenType?.includes("LED") ? "led_screen" : "digital_screen",
            name: s.ScreenName,
            location: `${s.Location || ""}, ${s.City || ""}, ${s.State || ""}`,
            city: s.City,
            area: s.Location,
            landmark: s.Location,
            size: s.Size,
            availabilityStatus: s.Status || "available",
            isDigital: true,
            latitude: s.Latitude,
            longitude: s.Longitude,
            rentalCost: s.RentalCost,
            trafficScore: s.featured ? 90 : s.Status === "available" ? 75 : 60,
            imageUrls: [],
            videoFeedUrl: null,
            facingDirection: null,
            lastInspectionDate: s.OnboardingDate,
            ownerName: s.OwnerName,
            contactNumber: s.ContactNumber,
            contactPerson: s.ContactPerson,
            screenType: s.ScreenType,
            resolution: s.Resolution,
            powerBackup: s.PowerBackup,
            internetConnectivity: s.InternetConnectivity,
            notes: s.Notes,
          });
        }
      );
    });
  });

  /**
   * GET /inventory/trending
   * Get trending/high-traffic inventory items
   */
  app.get("/inventory/trending", (req, res) => {
    const limit = parseInt(req.query.limit) || 10;

    const query = `
      (
        SELECT 
          h_id as inventoryId,
          'hoarding' as mediaType,
          h_name as name,
          city,
          latitude,
          longitude,
          CASE 
            WHEN featured = 1 THEN 85
            WHEN status = 'available' THEN 70
            ELSE 50
          END as trafficScore
        FROM hoardings
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        ORDER BY featured DESC, status DESC
        LIMIT ?
      )
      UNION ALL
      (
        SELECT 
          ScreenID as inventoryId,
          CASE 
            WHEN ScreenType LIKE '%LED%' THEN 'led_screen'
            ELSE 'digital_screen'
          END as mediaType,
          ScreenName as name,
          City as city,
          Latitude as latitude,
          Longitude as longitude,
          CASE 
            WHEN featured = 1 THEN 90
            WHEN Status = 'available' THEN 75
            ELSE 60
          END as trafficScore
        FROM outdoormarketingscreens
        WHERE Latitude IS NOT NULL AND Longitude IS NOT NULL
        ORDER BY featured DESC, Status DESC
        LIMIT ?
      )
      ORDER BY trafficScore DESC
      LIMIT ?
    `;

    db.query(query, [limit, limit, limit], (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Database error", error: err.message });
      }
      res.json(results);
    });
  });

  /**
   * PUT /inventory/:id/status
   * Update availability status with WebSocket broadcast
   */
  app.put("/inventory/:id/status", (req, res) => {
    const { id } = req.params;
    const { availabilityStatus } = req.body;

    if (!availabilityStatus) {
      return res.status(400).json({ message: "availabilityStatus is required" });
    }

    // Try hoardings first
    db.query(
      "UPDATE hoardings SET status = ? WHERE h_id = ?",
      [availabilityStatus, id],
      (err, result) => {
        if (err) {
          return res.status(500).json({ message: "Database error", error: err.message });
        }

        if (result.affectedRows > 0) {
          // Emit WebSocket update
          if (io) {
            io.to("inventory-updates").emit("inventory-updated", {
              inventoryId: id,
              availabilityStatus,
              mediaType: "hoarding",
              timestamp: new Date().toISOString()
            });
          }
          return res.json({ message: "Status updated successfully" });
        }

        // Try screens
        db.query(
          "UPDATE outdoormarketingscreens SET Status = ? WHERE ScreenID = ?",
          [availabilityStatus, id],
          (err, result) => {
            if (err) {
              return res.status(500).json({ message: "Database error", error: err.message });
            }

            if (result.affectedRows === 0) {
              return res.status(404).json({ message: "Inventory item not found" });
            }

            // Emit WebSocket update
            if (io) {
              io.to("inventory-updates").emit("inventory-updated", {
                inventoryId: id,
                availabilityStatus,
                mediaType: "digital_screen",
                timestamp: new Date().toISOString()
              });
            }

            res.json({ message: "Status updated successfully" });
          }
        );
      }
    );
  });

  /**
   * POST /inventory/bookings
   * Create a booking for inventory item
   */
  app.post("/inventory/bookings", (req, res) => {
    const { inventoryId, mediaType, startDate, endDate, userId, agencyId } = req.body;

    if (!inventoryId || !startDate || !endDate) {
      return res.status(400).json({ message: "inventoryId, startDate, and endDate are required" });
    }

    // Check if table exists, if not create it
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS inventory_bookings (
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
      )
    `;

    db.query(createTableQuery, (err) => {
      if (err) {
        console.error("Error creating bookings table:", err);
      }

      // Insert booking
      const insertQuery = `
        INSERT INTO inventory_bookings 
        (inventory_id, media_type, start_date, end_date, user_id, agency_id, status)
        VALUES (?, ?, ?, ?, ?, ?, 'confirmed')
      `;

      db.query(
        insertQuery,
        [inventoryId, mediaType, startDate, endDate, userId || null, agencyId || null],
        (err, result) => {
          if (err) {
            return res.status(500).json({ message: "Database error", error: err.message });
          }

          // Emit WebSocket update
          if (io) {
            io.to("inventory-updates").emit("booking-created", {
              bookingId: result.insertId,
              inventoryId,
              mediaType,
              startDate,
              endDate,
              timestamp: new Date().toISOString()
            });
          }

          res.status(201).json({
            message: "Booking created successfully",
            bookingId: result.insertId
          });
        }
      );
    });
  });

  /**
   * GET /inventory/bookings
   * Get bookings for inventory item or date range
   */
  app.get("/inventory/bookings", (req, res) => {
    const { inventoryId, startDate, endDate } = req.query;

    let query = "SELECT * FROM inventory_bookings WHERE 1=1";
    const params = [];

    if (inventoryId) {
      query += " AND inventory_id = ?";
      params.push(inventoryId);
    }

    if (startDate) {
      query += " AND end_date >= ?";
      params.push(startDate);
    }

    if (endDate) {
      query += " AND start_date <= ?";
      params.push(endDate);
    }

    query += " ORDER BY start_date ASC";

    db.query(query, params, (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Database error", error: err.message });
      }
      res.json(results);
    });
  });
};

