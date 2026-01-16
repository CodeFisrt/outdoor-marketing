module.exports = function registerSocietyRoutes(app, db) {
  app.get("/societies", (req, res) => {
    db.query("SELECT * FROM society_marketing", (err, results) => {
      if (err) return res.status(500).send(err);
      res.json(results);
    });
  });

  app.get("/societies/:id", (req, res) => {
    const { id } = req.params;
    db.query(
      "SELECT * FROM society_marketing WHERE s_id = ?",
      [id],
      (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).send("Record not found");
        res.json(results[0]);
      }
    );
  });

  app.post("/societies", (req, res) => {
    const data = req.body;
    const sql = `
            INSERT INTO society_marketing
            (s_name, s_area, s_city, s_pincode, s_contact_person_name, s_contact_num, s_no_flats, s_type, s_event_type, event_date, event_time, s_address, s_lat, s_long, s_crowd, approval_status, event_status, expected_cost, actual_cost, responsible_person, follow_up_date, remarks, featured)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
    const values = [
      data.s_name,
      data.s_area,
      data.s_city,
      data.s_pincode,
      data.s_contact_person_name,
      data.s_contact_num,
      data.s_no_flats,
      data.s_type,
      data.s_event_type,
      data.event_date,
      data.event_time,
      data.s_address,
      data.s_lat,
      data.s_long,
      data.s_crowd,
      data.approval_status,
      data.event_status,
      data.expected_cost,
      data.actual_cost,
      data.responsible_person,
      data.follow_up_date,
      data.remarks,
      data.featured ? 1 : 0,
    ];

    db.query(sql, values, (err, result) => {
      if (err) return res.status(500).send(err);
      res.status(201).send({ message: "Society created", id: result.insertId });
    });
  });

  app.put("/societies/:id", (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const sql = `
            UPDATE society_marketing SET
            s_name=?, s_area=?, s_city=?, s_pincode=?, s_contact_person_name=?, s_contact_num=?, s_no_flats=?, s_type=?, 
            s_event_type=?, event_date=?, event_time=?, s_address=?, s_lat=?, s_long=?, s_crowd=?, 
            approval_status=?, event_status=?, expected_cost=?, actual_cost=?, responsible_person=?, follow_up_date=?, remarks=?, featured=?
            WHERE s_id=?
        `;
    const values = [
      data.s_name,
      data.s_area,
      data.s_city,
      data.s_pincode,
      data.s_contact_person_name,
      data.s_contact_num,
      data.s_no_flats,
      data.s_type,
      data.s_event_type,
      data.event_date,
      data.event_time,
      data.s_address,
      data.s_lat,
      data.s_long,
      data.s_crowd,
      data.approval_status,
      data.event_status,
      data.expected_cost,
      data.actual_cost,
      data.responsible_person,
      data.follow_up_date,
      data.remarks,
      data.featured ? 1 : 0,
      id,
    ];

    db.query(sql, values, (err) => {
      if (err) return res.status(500).send(err);
      res.send({ message: "Society updated" });
    });
  });

  app.delete("/societies/:id", (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM society_marketing WHERE s_id = ?", [id], (err) => {
      if (err) return res.status(500).send(err);
      res.send({ message: "Society deleted" });
    });
  });
};
