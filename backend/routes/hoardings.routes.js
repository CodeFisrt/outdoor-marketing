module.exports = function registerHoardingRoutes(app, db) {
  const safe = (v) => {
    if (v === undefined || v === null || v === "") return null;
    return v;
  };

  app.get("/hoardings", (req, res) => {
    const { city, limit } = req.query;
    let sql = "SELECT * FROM hoardings";
    const params = [];
    if (city && String(city).trim()) {
      sql += " WHERE LOWER(TRIM(city)) = LOWER(?)";
      params.push(String(city).trim());
    }
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 0, 0), 2000);
    if (limitNum > 0) {
      sql += " LIMIT ?";
      params.push(limitNum);
    }
    db.query(sql, params, (err, results) => {
      if (err) {
        console.error("DB ERROR:", err);
        return res.status(500).json({
          message: "Database error",
          error: err,
        });
      }

      res.json(results);
    });
  });

  app.get("/hoardings/:id", (req, res) => {
    const { id } = req.params;

    db.query("SELECT * FROM hoardings WHERE h_id = ?", [id], (err, results) => {
      if (err) {
        console.error("DB ERROR:", err);
        return res.status(500).json({
          message: "Database error",
          error: err,
        });
      }

      if (!results.length) return res.status(404).send("Hoarding not found");

      res.json(results[0]); // pdf blob NOT sent here
    });
  });

  // GET PDF by hoarding id
  app.get("/hoardings/:id/pdf", (req, res) => {
    const { id } = req.params;
    db.query(
      "SELECT case_study_pdf FROM hoardings WHERE h_id = ?",
      [id],
      (err, results) => {
        if (err) {
          console.error("DB ERROR:", err);
          return res.status(500).json({
            message: "Database error",
            error: err,
          });
        }

        if (!results.length || !results[0].case_study_pdf) {
          return res.status(404).send("PDF not found");
        }

        const pdfBuffer = results[0].case_study_pdf;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `inline; filename=case-study-${id}.pdf`
        );
        res.send(pdfBuffer);
      }
    );
  });

  const multer = require("multer");
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  });

  app.post("/hoardings", upload.single("caseStudyPdf"), (req, res) => {
    const data = req.body;
    const pdfBuffer = req.file ? req.file.buffer : null;

    const sql = `
      INSERT INTO hoardings (
        h_name, address, city, State, latitude, longitude, size,
        owner_name, contact_person, contact_number,
        ad_start_date, ad_end_date, status,
        rental_cost, contract_start_date, contract_end_date,
        notes, featured, case_study_pdf
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      safe(data.h_name),
      safe(data.address),
      safe(data.city),
      safe(data.State),
      safe(data.latitude),
      safe(data.longitude),
      safe(data.size),
      safe(data.owner_name),
      safe(data.contact_person),
      safe(data.contact_number),
      safe(data.ad_start_date),
      safe(data.ad_end_date),
      safe(data.status),
      safe(data.rental_cost),
      safe(data.contract_start_date),
      safe(data.contract_end_date),
      safe(data.notes),
      Number(data.featured) === 1 ? 1 : 0,
      pdfBuffer,
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("DB ERROR:", err);
        return res.status(500).json({
          message: "Database error",
          error: err,
        });
      }

      res.status(201).send({ id: result.insertId });
    });
  });

  app.put("/hoardings/:id", upload.single("caseStudyPdf"), (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const pdfBuffer = req.file ? req.file.buffer : null;

    let sql, values;

    if (pdfBuffer) {
      sql = `
        UPDATE hoardings SET
          h_name=?, address=?, city=?, State=?, latitude=?, longitude=?,
          size=?, owner_name=?, contact_person=?, contact_number=?,
          ad_start_date=?, ad_end_date=?, status=?, rental_cost=?,
          contract_start_date=?, contract_end_date=?, notes=?,
          featured=?, case_study_pdf=?
        WHERE h_id=?
      `;

      values = [
        safe(data.h_name),
        safe(data.address),
        safe(data.city),
        safe(data.State),
        safe(data.latitude),
        safe(data.longitude),
        safe(data.size),
        safe(data.owner_name),
        safe(data.contact_person),
        safe(data.contact_number),
        safe(data.ad_start_date),
        safe(data.ad_end_date),
        safe(data.status),
        safe(data.rental_cost),
        safe(data.contract_start_date),
        safe(data.contract_end_date),
        safe(data.notes),
        Number(data.featured) === 1 ? 1 : 0,
        pdfBuffer,
        id,
      ];
    } else {
      sql = `
        UPDATE hoardings SET
          h_name=?, address=?, city=?, State=?, latitude=?, longitude=?,
          size=?, owner_name=?, contact_person=?, contact_number=?,
          ad_start_date=?, ad_end_date=?, status=?, rental_cost=?,
          contract_start_date=?, contract_end_date=?, notes=?,
          featured=?
        WHERE h_id=?
      `;

      values = [
        safe(data.h_name),
        safe(data.address),
        safe(data.city),
        safe(data.State),
        safe(data.latitude),
        safe(data.longitude),
        safe(data.size),
        safe(data.owner_name),
        safe(data.contact_person),
        safe(data.contact_number),
        safe(data.ad_start_date),
        safe(data.ad_end_date),
        safe(data.status),
        safe(data.rental_cost),
        safe(data.contract_start_date),
        safe(data.contract_end_date),
        safe(data.notes),
        Number(data.featured) === 1 ? 1 : 0,
        id,
      ];
    }

    db.query(sql, values, (err) => {
      if (err) {
        console.error("DB ERROR:", err);
        return res.status(500).json({
          message: "Database error",
          error: err,
        });
      }

      res.send({ message: "Hoarding updated successfully" });
    });
  });

  app.delete("/hoardings/:id", (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM hoardings WHERE h_id = ?", [id], (err) => {
      if (err) {
        console.error("DB ERROR:", err);
        return res.status(500).json({
          message: "Database error",
          error: err,
        });
      }

      res.send({ message: "Hoarding deleted" });
    });
  });
};
