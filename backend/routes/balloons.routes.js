module.exports = function registerBalloonRoutes(app, db) {
  app.get("/balloons", (req, res) => {
    db.query("SELECT * FROM balloon_marketing", (err, results) => {
      if (err) return res.status(500).send(err);
      res.json(results);
    });
  });

  app.get("/balloons/:id", (req, res) => {
    const { id } = req.params;
    db.query(
      "SELECT * FROM balloon_marketing WHERE b_id = ?",
      [id],
      (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).send("Record not found");
        res.json(results[0]);
      }
    );
  });

  app.post("/balloons", (req, res) => {
    const data = req.body;
    const sql = `
            INSERT INTO balloon_marketing
            (b_location_name, b_area, b_city, b_address, b_lat, b_long, b_size, b_type, b_height, b_duration_days, b_start_date, b_end_date, expected_crowd, b_contact_person_name, b_contact_num, b_cost, payment_status, remarks, featured)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
    const values = [
      data.b_location_name,
      data.b_area,
      data.b_city,
      data.b_address,
      data.b_lat,
      data.b_long,
      data.b_size,
      data.b_type,
      data.b_height,
      data.b_duration_days,
      data.b_start_date,
      data.b_end_date,
      data.expected_crowd,
      data.b_contact_person_name,
      data.b_contact_num,
      data.b_cost,
      data.payment_status,
      data.remarks,
      data.featured ? 1 : 0,
    ];

    db.query(sql, values, (err, result) => {
      if (err) return res.status(500).send(err);
      res.status(201).send({ message: "Balloon created", id: result.insertId });
    });
  });

  app.put("/balloons/:id", (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const sql = `
            UPDATE balloon_marketing SET
            b_location_name=?, b_area=?, b_city=?, b_address=?, b_lat=?, b_long=?, b_size=?, b_type=?, 
            b_height=?, b_duration_days=?, b_start_date=?, b_end_date=?, expected_crowd=?, 
            b_contact_person_name=?, b_contact_num=?, b_cost=?, payment_status=?, remarks=?, featured=?
            WHERE b_id=?
        `;
    const values = [
      data.b_location_name,
      data.b_area,
      data.b_city,
      data.b_address,
      data.b_lat,
      data.b_long,
      data.b_size,
      data.b_type,
      data.b_height,
      data.b_duration_days,
      data.b_start_date,
      data.b_end_date,
      data.expected_crowd,
      data.b_contact_person_name,
      data.b_contact_num,
      data.b_cost,
      data.payment_status,
      data.remarks,
      data.featured ? 1 : 0,
      id,
    ];

    db.query(sql, values, (err) => {
      if (err) return res.status(500).send(err);
      res.send({ message: "Balloon updated" });
    });
  });

  app.delete("/balloons/:id", (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM balloon_marketing WHERE b_id = ?", [id], (err) => {
      if (err) return res.status(500).send(err);
      res.send({ message: "Balloon deleted" });
    });
  });
};
