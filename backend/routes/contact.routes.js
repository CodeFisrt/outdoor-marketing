const nodemailer = require("nodemailer");

module.exports = function registerContactRoutes(app, db) {
  app.post("/api/contact", (req, res) => {
    const { full_name, email, subject, message } = req.body;

    if (!full_name || !email || !subject || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const sql = `
    INSERT INTO contact_messages (full_name, email, subject, message)
    VALUES (?, ?, ?, ?)
  `;

    const values = [full_name, email, subject, message];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Error inserting contact message:", err);
        return res.status(500).json({ message: "Database error" });
      }

      res.status(201).json({
        message: "Message saved successfully",
        id: result.insertId,
      });
    });
  });

  app.post("/api/send-mail", async (req, res) => {
    const { full_name, email, subject, message } = req.body;

    try {
      console.log("Incoming mail request:", req.body);
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: `"${full_name}"`,
        to: "sagarkolhe008@gmail.com",
        replyTo: email,
        subject: subject,
        html: `
        <h3>Welcome to AdonSteet</h3>
        <p><b>Name:</b> ${full_name}</p>
        <p><b>Email:</b> ${email}</p>
        <p>${message}</p>
      `,
      });
      console.log("Mail sent Info:", info);
      res.json({ message: "Mail sent successfully", info });
    } catch (err) {
      console.error("Mail error:", err);
      res.status(500).json({ message: "Mail failed", error: err.message });
    }
  });
};
