module.exports = function registerAdminRoutes(app, db, bcrypt, jwt, JWT_SECRET) {
  const adminAuth = require("../middleware/adminAuth");

  // ✅ Create admin (protected: only admin can create another admin)
  // POST /admin/create
  app.post("/admin/create", adminAuth, async (req, res) => {
    try {
      // const { adminName, adminEmail, password } = req.body;
      const { adminEmail, emailId, password } = req.body;
                   const email = adminEmail || emailId;
      if (!adminName || !adminEmail || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password min 6 characters" });
      }

      db.query(
        "SELECT adminId FROM admins WHERE adminEmail = ? LIMIT 1",
        [adminEmail],
        async (err, exists) => {
          if (err) return res.status(500).send(err);
          if (exists.length > 0)
            return res.status(400).json({ message: "Email already exists" });

          const hash = await bcrypt.hash(password, 10);

          db.query(
            "INSERT INTO admins (adminName, adminEmail, passwordHash, status) VALUES (?,?,?, 'active')",
            [adminName, adminEmail, hash],
            (err2, result) => {
              if (err2) return res.status(500).send(err2);
              res.status(201).json({
                message: "Admin created",
                adminId: result.insertId,
              });
            }
          );
        }
      );
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });

  // ✅ Admin login (this is used on your Sign-In page)
  // POST /admin/login
  app.post("/admin/login", (req, res) => {
    const { adminEmail, password } = req.body;

    if (!adminEmail || !password) {
      return res.status(400).json({ message: "Email and Password required" });
    }

    db.query(
      "SELECT * FROM admins WHERE adminEmail = ? LIMIT 1",
      [adminEmail],
      async (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length === 0)
          return res.status(400).json({ message: "Admin not found" });

        const admin = results[0];

        if (admin.status === "blocked") {
          return res.status(403).json({ message: "Admin is blocked" });
        }

        const ok = await bcrypt.compare(password, admin.passwordHash);
        if (!ok) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign(
          { adminId: admin.adminId, adminEmail: admin.adminEmail, type: "admin" },
          JWT_SECRET,
          { expiresIn: "2h" }
        );

        res.json({
          status: 200,
          message: "Admin login success",
          token,
          admin: {
            adminId: admin.adminId,
            adminName: admin.adminName,
            adminEmail: admin.adminEmail,
            status: admin.status,
          },
        });
      }
    );
  });

  // ✅ Admin list (protected)
  // GET /admin/list
  app.get("/admin/list", adminAuth, (req, res) => {
    db.query(
      "SELECT adminId, adminName, adminEmail, status, created_at FROM admins ORDER BY adminId DESC",
      (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
      }
    );
  });

  // ✅ Block/Unblock admin (protected)
  // PUT /admin/status/:id
  app.put("/admin/status/:id", adminAuth, (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // active or blocked

    if (!["active", "blocked"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    db.query(
      "UPDATE admins SET status = ? WHERE adminId = ?",
      [status, id],
      (err) => {
        if (err) return res.status(500).send(err);
        res.json({ message: "Admin status updated" });
      }
    );
  });
};
