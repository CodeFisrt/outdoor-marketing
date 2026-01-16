module.exports = function registerSearchRoutes(app, db) {
  app.get("/search-services", (req, res) => {
    const { service_type, State, District, Tehsil, Village } = req.query;

    console.log("🔍 Search API Called:", {
      service_type,
      filters: { State, District, Tehsil, Village },
    });

    if (!service_type) {
      return res.status(400).json({ message: "service_type is required" });
    }

    const serviceTables = {
      balloon_marketing: "balloon_marketing",
      society_marketing: "society_marketing",
      vehicle_marketing: "vehicle_marketing",
      hoardings: "hoardings",
      outdoormarketingscreens: "outdoormarketingscreens",
    };

    const tableName = serviceTables[service_type];
    if (!tableName) {
      return res.status(400).json({ message: "Invalid service type" });
    }

    let query = `SELECT *, '${service_type}' AS service_type FROM ${tableName} WHERE 1=1`;
    const params = [];

    if (State) {
      query += " AND State = ?";
      params.push(State);
    }
    if (District) {
      query += " AND District = ?";
      params.push(District);
    }
    if (Tehsil) {
      query += " AND Tehsil = ?";
      params.push(Tehsil);
    }
    if (Village) {
      query += " AND Village = ?";
      params.push(Village);
    }

    console.log("📤 Executing SQL Query:", query);
    console.log("📋 Query Parameters:", params);

    db.query(query, params, (err, results) => {
      if (err) {
        console.error("❌ SQL ERROR:", err.sqlMessage || err);
        return res.status(500).json({ message: err.sqlMessage || err.message });
      }

      console.log(`✅ Query successful. Returned ${results.length} results.`);
      res.json(results);
    });
  });
};
