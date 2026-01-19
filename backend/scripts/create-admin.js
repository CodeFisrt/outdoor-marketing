const bcrypt = require("bcryptjs");
const db = require("../db.js");
const readline = require("readline");

function ask(rl, q) {
  return new Promise((resolve) => rl.question(q, (ans) => resolve(ans.trim())));
}

// ✅ Strong password validation: min 8, 1 upper, 1 lower, 1 number, 1 special
function isStrongPassword(password) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  return regex.test(password);
}

(async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log("\n=== Create FIRST Admin ===\n");

    const adminName = await ask(rl, "Enter Admin Name: ");
    const adminEmail = await ask(rl, "Enter Admin Email: ");
    const password = await ask(
      rl,
      "Enter Password (min 8, 1 Upper, 1 Lower, 1 Number, 1 Special): "
    );
    const confirm = await ask(rl, "Re-enter Password: ");

    if (!adminName || !adminEmail || !password || !confirm) {
      console.log("❌ All fields required");
      rl.close();
      return;
    }

    if (!isStrongPassword(password)) {
      console.log(
        "❌ Weak password! Must contain:\n" +
          "- Minimum 8 characters\n" +
          "- 1 uppercase letter (A-Z)\n" +
          "- 1 lowercase letter (a-z)\n" +
          "- 1 number (0-9)\n" +
          "- 1 special symbol (@#$%!)\n"
      );
      rl.close();
      return;
    }

    if (password !== confirm) {
      console.log("❌ Password mismatch");
      rl.close();
      return;
    }

    db.query(
      "SELECT adminId FROM admins WHERE adminEmail=? LIMIT 1",
      [adminEmail],
      async (err, ex) => {
        if (err) {
          console.log("DB Error:", err.message);
          rl.close();
          return;
        }

        if (ex.length > 0) {
          console.log("❌ Email already exists");
          rl.close();
          return;
        }

        const hash = await bcrypt.hash(password, 10);

        db.query(
          "INSERT INTO admins (adminName, adminEmail, passwordHash, status) VALUES (?,?,?, 'active')",
          [adminName, adminEmail, hash],
          (err2) => {
            if (err2) console.log("Insert Error:", err2.message);
            else console.log("✅ First Admin created successfully!");
            rl.close();
          }
        );
      }
    );
  } catch (e) {
    console.log("❌", e.message);
    rl.close();
  }
})();
