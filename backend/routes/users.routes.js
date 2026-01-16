// NOTE: This file keeps your same logic. It expects these to exist in index.js already:
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const JWT_SECRET = process.env.JWT_SECRET || "secret";

module.exports = function registerUserRoutes(app, db, bcrypt, jwt, JWT_SECRET) {
  app.get("/Users", (req, res) => {
    db.query("SELECT * FROM users", (err, results) => {
      if (err) return res.status(500).send(err);
      res.json(results);
    });
  });

  app.get("/Users/:id", (req, res) => {
    const { id } = req.params;
    db.query("SELECT * FROM users WHERE userId = ?", [id], (err, results) => {
      if (err) return res.status(500).send(err);
      if (results.length === 0) return res.status(404).send("Users not found");
      res.json(results[0]);
    });
  });

  app.post("/Users/register", async (req, res) => {
    try {
      const data = req.body;
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const sql = `
        INSERT INTO users
        (userName, emailId, password)
        VALUES (?, ?, ?)
    `;
      const values = [data.userName, data.emailId, hashedPassword];

      db.query(sql, values, (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).send({ message: "Email already exists" });
          }
          return res.status(500).send(err);
        }
        res.status(201).send({ message: "User created", id: result.insertId });
      });
    } catch (err) {
      res.status(500).send({ message: err.message });
    }
  });

  app.put("/Users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;

      const hashedPassword = await bcrypt.hash(data.password, 10);

      const sql = `
        UPDATE users SET
        userName=?, emailId=?, password=?
        WHERE userId=?
    `;

      const values = [data.userName, data.emailId, hashedPassword, id];

      db.query(sql, values, (err, result) => {
        if (err) return res.status(500).send(err);
        res.send({ status: 201, message: "User updated" });
      });
    } catch (err) {
      res.status(500).send({ status: 500, message: err.message });
    }
  });

  app.delete("/Users/:id", (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM users WHERE userId = ?", [id], (err) => {
      if (err) return res.status(500).send(err);
      res.send({ message: "User deleted" });
    });
  });

  app.post("/Users/login", (req, res) => {
    const { emailId, password } = req.body;

    db.query(
      "SELECT * FROM users WHERE userEmail = ?",
      [emailId],
      async (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0)
          return res.status(400).send({ message: "User not found" });

        const user = results[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
          return res.status(400).send({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
          expiresIn: "1h",
        });

        res.send({
          status: 200,
          message: "Login successful",
          data: user,
          token,
        });
      }
    );
  });

  app.post("/signup", (req, res) => {
    const { userName, userEmail, password } = req.body;

    const sql =
      "INSERT INTO users (userName, userEmail, password) VALUES (?,?,?)";

    db.query(sql, [userName, userEmail, password], (err, result) => {
      if (err) return res.status(500).json({ message: "Error", err });

      return res.json({ message: "User registered successfully" });
    });
  });
};
