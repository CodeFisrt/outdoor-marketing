module.exports = function registerHoardingRoutes(app, db) {
  app.get("/hoardings", (req, res) => {
    db.query("SELECT * FROM hoardings", (err, results) => {
      if (err) return res.status(500).send(err);
      res.json(results);
    });
  });

  app.get("/hoardings/:id", (req, res) => {
    const { id } = req.params;
    db.query("SELECT * FROM hoardings WHERE h_id = ?", [id], (err, results) => {
      if (err) return res.status(500).send(err);
      if (results.length === 0) return res.status(404).send("Hoarding not found");
      res.json(results[0]);
    });
  });

  app.post("/hoardings", (req, res) => {
    const data = req.body;

    const sql = `
    INSERT INTO hoardings
    (h_name, address, city, state, latitude, longitude, size, owner_name, contact_person, contact_number, ad_start_date, ad_end_date, status, rental_cost, contract_start_date, contract_end_date, notes, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    const values = [
      data.h_name,
      data.address,
      data.city,
      data.state,
      data.latitude,
      data.longitude,
      data.size,
      data.owner_name,
      data.contact_person,
      data.contact_number,
      data.ad_start_date,
      data.ad_end_date,
      data.status,
      data.rental_cost,
      data.contract_start_date,
      data.contract_end_date,
      data.notes,
      data.featured ? 1 : 0,
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Insert error:", err);
        return res.status(500).send(err);
      }
      res.status(201).send({ message: "Hoarding created", id: result.insertId });
    });
  });

  app.put("/hoardings/:id", (req, res) => {
    const { id } = req.params;
    const data = req.body;

    const sql = `
    UPDATE hoardings SET
      h_name=?, address=?, city=?, state=?, latitude=?, longitude=?, size=?, owner_name=?, contact_person=?, contact_number=?, ad_start_date=?, ad_end_date=?, status=?, rental_cost=?, contract_start_date=?, contract_end_date=?, notes=?, featured=?
    WHERE h_id=?
  `;

    const values = [
      data.h_name,
      data.address,
      data.city,
      data.state,
      data.latitude,
      data.longitude,
      data.size,
      data.owner_name,
      data.contact_person,
      data.contact_number,
      data.ad_start_date,
      data.ad_end_date,
      data.status,
      data.rental_cost,
      data.contract_start_date,
      data.contract_end_date,
      data.notes,
      data.featured ? 1 : 0,
      id,
    ];

    db.query(sql, values, (err) => {
      if (err) {
        console.error("Update error:", err);
        return res.status(500).send(err);
      }
      res.send({ message: "Hoarding updated successfully ✅" });
    });
  });

  app.delete("/hoardings/:id", (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM hoardings WHERE h_id = ?", [id], (err) => {
      if (err) return res.status(500).send(err);
      res.send({ message: "Hoarding deleted" });
    });
  });
};
