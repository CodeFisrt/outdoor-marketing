module.exports = function registerUserRoutes(app, db, bcrypt, jwt, JWT_SECRET) {
  // ✅ Admin middleware (same as you used for admin)
  const adminAuth = require("../middleware/adminAuth");

  // ✅ GET all users (ADMIN ONLY)
  app.get("/Users", adminAuth, (req, res) => {
    db.query(
      `SELECT userId, userName, userEmail, role, status,
       agencyName, agencyPhone, agencyCity,
       ownerCompanyName, ownerPhone, ownerAddress, ownerCity,
       guestPhone, guestCity,
       clientCompanyName, clientPhone, clientEmail
FROM users

       ORDER BY userId DESC`,
      (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
      }
    );
  });

  // ✅ GET user by id (ADMIN ONLY)
  app.get("/Users/:id", adminAuth, (req, res) => {
    const { id } = req.params;
    db.query(
      `SELECT userId, userName, userEmail, role, status,
       agencyName, agencyPhone, agencyCity,
       ownerCompanyName, ownerPhone, ownerAddress, ownerCity,
       guestPhone, guestCity,
       clientCompanyName, clientPhone, clientEmail
FROM users
 WHERE userId = ? LIMIT 1`,
      [id],
      (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0) return res.status(404).send("User not found");
        res.json(results[0]);
      }
    );
  });

  // ✅ ADMIN creates user with role + strong password hashing
  // POST /Users/register (ADMIN ONLY)
  app.post("/Users/register", adminAuth, async (req, res) => {
    try {
      const {
        userName,
        userEmail,
        password,
        role,
        status,
        agencyName,
        agencyPhone,
        agencyCity,
        ownerCompanyName,
        ownerPhone,
        ownerAddress,
        ownerCity,
        guestPhone,
        guestCity,
        clientCompanyName,
        clientPhone,
        clientEmail
      } = req.body;

      if (!userName || !userEmail || !password || !role) {
        return res.status(400).json({ message: "Required fields missing" });
      }

      const strong =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

      if (!strong.test(password)) {
        return res.status(400).json({
          message: "Weak password"
        });
      }

      db.query(
        "SELECT userId FROM users WHERE userEmail=? LIMIT 1",
        [userEmail],
        async (err, ex) => {
          if (err) return res.status(500).send(err);
          if (ex.length > 0)
            return res.status(400).json({ message: "Email already exists" });

          const hash = await bcrypt.hash(password, 10);

          const sql = `
          INSERT INTO users
          (userName, userEmail, password, role, status,
           agencyName, agencyPhone, agencyCity,
           ownerCompanyName, ownerPhone, ownerAddress, ownerCity,
           guestPhone, guestCity,
           clientCompanyName, clientPhone, clientEmail)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `;

          const values = [
            userName,
            userEmail,
            hash,
            role,
            status || "active",
            agencyName || null,
            agencyPhone || null,
            agencyCity || null,
            ownerCompanyName || null,
            ownerPhone || null,
            ownerAddress || null,
            ownerCity || null,
            guestPhone || null,
            guestCity || null,
            clientCompanyName || null,
            clientPhone || null,
            clientEmail || null
          ];

          db.query(sql, values, (err2, result) => {
            if (err2) return res.status(500).send(err2);

            res.status(201).json({
              message: "User created",
              userId: result.insertId,
            });
          });
        }
      );
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });


  // ✅ ADMIN update user
  app.put("/Users/:id", adminAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const {
        userName,
        userEmail,
        role,
        status,
        agencyName,
        agencyPhone,
        agencyCity,
        ownerCompanyName,
        ownerPhone,
        ownerAddress,
        ownerCity,
        guestPhone,
        guestCity,
        clientCompanyName,
        clientPhone,
        clientEmail,
        password
      } = req.body;

      let hashToUpdate = null;

      if (password) {
        hashToUpdate = await bcrypt.hash(password, 10);
      }

      const sql = `
      UPDATE users SET
        userName=?,
        userEmail=?,
        role=?,
        status=?,
        agencyName=?,
        agencyPhone=?,
        agencyCity=?,
        ownerCompanyName=?,
        ownerPhone=?,
        ownerAddress=?,
        ownerCity=?,
        guestPhone=?,
        guestCity=?,
        clientCompanyName=?,
        clientPhone=?,
        clientEmail=?,
        password=COALESCE(?, password)
      WHERE userId=?
    `;

      const values = [
        userName,
        userEmail,
        role,
        status,
        agencyName || null,
        agencyPhone || null,
        agencyCity || null,
        ownerCompanyName || null,
        ownerPhone || null,
        ownerAddress || null,
        ownerCity || null,
        guestPhone || null,
        guestCity || null,
        clientCompanyName || null,
        clientPhone || null,
        clientEmail || null,
        hashToUpdate,
        id
      ];

      db.query(sql, values, (err) => {
        if (err) return res.status(500).send(err);
        res.json({ message: "User updated" });
      });

    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });


  // ✅ ADMIN delete user
  app.delete("/Users/:id", adminAuth, (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM users WHERE userId = ?", [id], (err) => {
      if (err) return res.status(500).send(err);
      res.json({ message: "User deleted" });
    });
  });

  // ✅ Login for ALL ROLES
  app.post("/Users/login", (req, res) => {
    // accept both keys: emailId OR userEmail
    const email = req.body.emailId || req.body.userEmail;
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and Password required" });
    }

    db.query(
      "SELECT * FROM users WHERE userEmail = ? LIMIT 1",
      [email],
      async (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0)
          return res.status(400).json({ message: "User not found" });

        const user = results[0];

        if (user.status === "blocked") {
          return res.status(403).json({ message: "Account is blocked" });
        }

        // ✅ check bcrypt hash from `password` column
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
          { userId: user.userId, role: user.role, type: "user" },
          JWT_SECRET,
          { expiresIn: "2h" }
        );

        res.json({
          status: 200,
          message: "Login successful",
          token,
          user: {
            userId: user.userId,
            userName: user.userName,
            userEmail: user.userEmail,
            role: user.role,
            status: user.status,
          },
        });
      }
    );
  });

  // ✅ Public signup (ONLY normal users)
  app.post("/signup", async (req, res) => {
    const { userName, userEmail, password } = req.body;

    if (!userName || !userEmail || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strong.test(password)) {
      return res.status(400).json({
        message:
          "Weak password. Use min 8 chars + 1 Upper + 1 Lower + 1 Number + 1 Special",
      });
    }

    db.query(
      "SELECT userId FROM users WHERE userEmail=? LIMIT 1",
      [userEmail],
      async (err, ex) => {
        if (err) return res.status(500).send(err);
        if (ex.length > 0)
          return res.status(400).json({ message: "Email already exists" });

        const hash = await bcrypt.hash(password, 10);

        db.query(
          `INSERT INTO users (userName, userEmail, password, role, status)
           VALUES (?,?,?,'user', 'active')`,
          [userName, userEmail, hash],
          (err2) => {
            if (err2) return res.status(500).send(err2);
            res.json({ message: "User registered successfully" });
          }
        );
      }
    );
  });
};





