module.exports = function registerVehicleRoutes(app, db) {
  // ---------------- CRUD APIs ----------------

  app.get("/vehicles", (req, res) => {
    db.query("SELECT * FROM vehicle_marketing", (err, results) => {
      if (err) return res.status(500).send(err);
      res.json(results);
    });
  });

  app.get("/vehicles/:id", (req, res) => {
    const { id } = req.params;
    db.query(
      "SELECT * FROM vehicle_marketing WHERE v_id = ?",
      [id],
      (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).send("Record not found");
        res.json(results[0]);
      }
    );
  });

  app.post("/vehicles", (req, res) => {
    const data = req.body;
    const sql = `
            INSERT INTO vehicle_marketing 
            (v_type, v_number, v_area, v_city, v_start_date, v_end_date, v_duration_days, expected_crowd, v_contact_person_name, v_contact_num, v_cost, payment_status, remarks, featured)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
    const values = [
      data.v_type,
      data.v_number,
      data.v_area,
      data.v_city,
      data.v_start_date,
      data.v_end_date,
      data.v_duration_days,
      data.expected_crowd,
      data.v_contact_person_name,
      data.v_contact_num,
      data.v_cost,
      data.payment_status,
      data.remarks,
      data.featured ? 1 : 0,
    ];

    db.query(sql, values, (err, result) => {
      if (err) return res.status(500).send(err);
      res.status(201).send({ message: "Vehicle created", id: result.insertId });
    });
  });

  app.put("/vehicles/:id", (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const sql = `
            UPDATE vehicle_marketing SET 
            v_type=?, v_number=?, v_area=?, v_city=?, v_start_date=?, v_end_date=?, v_duration_days=?, expected_crowd=?, 
            v_contact_person_name=?, v_contact_num=?, v_cost=?, payment_status=?, remarks=?, featured=?
            WHERE v_id=?
        `;
    const values = [
      data.v_type,
      data.v_number,
      data.v_area,
      data.v_city,
      data.v_start_date,
      data.v_end_date,
      data.v_duration_days,
      data.expected_crowd,
      data.v_contact_person_name,
      data.v_contact_num,
      data.v_cost,
      data.payment_status,
      data.remarks,
      data.featured ? 1 : 0,
      id,
    ];

    db.query(sql, values, (err, result) => {
      if (err) return res.status(500).send(err);
      res.send({ message: "Vehicle updated" });
    });
  });

  app.delete("/vehicles/:id", (req, res) => {
    const { id } = req.params;
    db.query(
      "DELETE FROM vehicle_marketing WHERE v_id = ?",
      [id],
      (err, result) => {
        if (err) return res.status(500).send(err);
        res.send({ message: "Vehicle deleted" });
      }
    );
  });
};
