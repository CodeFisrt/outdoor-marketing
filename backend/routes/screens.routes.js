module.exports = function registerScreenRoutes(app, db) {
  app.get("/screens", (req, res) => {
    db.query("SELECT * FROM outdoormarketingscreens", (err, results) => {
      if (err) return res.status(500).send(err);
      res.send({
        result: true,
        status: 200,
        message: "Scrrent data fech Success",
        data: results,
      });
    });
  });

  app.get("/screens/:id", (req, res) => {
    const { id } = req.params;
    db.query(
      "SELECT * FROM outdoormarketingscreens WHERE ScreenID = ?",
      [id],
      (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).send("Screen not found");
        res.json({
          result: true,
          status: 200,
          message: "screen data fetched",
          data: results[0],
        });
      }
    );
  });

  app.post("/screens", (req, res) => {
    const data = req.body;
    const sql = `
            INSERT INTO outdoormarketingscreens
            (ScreenName, Location, City, State, Latitude, Longitude, ScreenType, Size, Resolution, OwnerName, ContactPerson, ContactNumber, OnboardingDate, Status, RentalCost, ContractStartDate, ContractEndDate, PowerBackup, InternetConnectivity, Notes, featured)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
    const values = [
      data.ScreenName,
      data.Location,
      data.City,
      data.State,
      data.Latitude,
      data.Longitude,
      data.ScreenType,
      data.Size,
      data.Resolution,
      data.OwnerName,
      data.ContactPerson,
      data.ContactNumber,
      data.OnboardingDate,
      data.Status,
      data.RentalCost,
      data.ContractStartDate,
      data.ContractEndDate,
      data.PowerBackup,
      data.InternetConnectivity,
      data.Notes,
      data.featured ? 1 : 0,
    ];

    db.query(sql, values, (err, result) => {
      if (err) return res.status(500).send(err);
      res.status(201).send({
        retult: true,
        status: 201,
        message: "Screen created",
        data: result,
      });
    });
  });

  app.put("/screens/:id", (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const sql = `
            UPDATE outdoormarketingscreens SET
            ScreenName=?, Location=?, City=?, State=?, Latitude=?, Longitude=?, ScreenType=?, Size=?, Resolution=?, 
            OwnerName=?, ContactPerson=?, ContactNumber=?, OnboardingDate=?, Status=?, RentalCost=?, ContractStartDate=?, 
            ContractEndDate=?, PowerBackup=?, InternetConnectivity=?, Notes=?, featured=?
            WHERE ScreenID=?
        `;
    const values = [
      data.ScreenName,
      data.Location,
      data.City,
      data.State,
      data.Latitude,
      data.Longitude,
      data.ScreenType,
      data.Size,
      data.Resolution,
      data.OwnerName,
      data.ContactPerson,
      data.ContactNumber,
      data.OnboardingDate,
      data.Status,
      data.RentalCost,
      data.ContractStartDate,
      data.ContractEndDate,
      data.PowerBackup,
      data.InternetConnectivity,
      data.Notes,
      data.featured ? 1 : 0,
      id,
    ];

    db.query(sql, values, (err, result) => {
      if (err) return res.status(500).send(err);
      res.send({
        result: true,
        status: 200,
        message: "Screen updated",
        data: result,
      });
    });
  });

  app.delete("/screens/:id", (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM outdoormarketingscreens WHERE ScreenID = ?", [id], (err) => {
      if (err) return res.status(500).send(err);
      res.send({ result: true, status: 201, message: "Screen deleted" });
    });
  });
};
