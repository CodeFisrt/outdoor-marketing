module.exports = function registerBookingRoutes(app, db) {
  app.post("/book-service", (req, res) => {
    const data = req.body;
    const sql = `
        INSERT INTO service_bookings 
        (full_name, email, contact_number, design_ready, design_team_required, start_date, end_date, payment_completed, booking_again, terms_accepted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      data.fullName,
      data.email,
      data.phone,
      data.designReady.toLowerCase(),
      data.needDesignService.toLowerCase(),
      data.startDate,
      data.endDate,
      data.paymentCompleted.toLowerCase(),
      data.repeatService.toLowerCase(),
      data.agreedToTerms ? 1 : 0,
    ];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Error inserting booking:", err);
        return res.status(500).send(err);
      }
      res
        .status(201)
        .send({ message: "Booking successful", id: result.insertId });
    });
  });
};
