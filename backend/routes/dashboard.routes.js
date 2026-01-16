module.exports = function registerDashboardRoutes(app, db) {
  app.get("/dashboard/counts", (req, res) => {
    const queries = {
      vehicles: "SELECT COUNT(*) AS count FROM vehicle_marketing",
      societies: "SELECT COUNT(*) AS count FROM society_marketing",
      balloons: "SELECT COUNT(*) AS count FROM balloon_marketing",
      screens: "SELECT COUNT(*) AS count FROM outdoormarketingscreens",
      hoardings: "SELECT COUNT(*) AS count FROM hoardings",
    };

    let results = {};
    let completed = 0;
    let total = Object.keys(queries).length;

    Object.entries(queries).forEach(([key, sql]) => {
      db.query(sql, (err, rows) => {
        if (err) return res.status(500).send(err);

        results[key] = rows[0].count;
        completed++;

        if (completed === total) {
          res.json(results);
        }
      });
    });
  });
};
