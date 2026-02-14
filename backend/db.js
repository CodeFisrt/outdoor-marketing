require("dotenv").config();

const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,

  charset: "utf8mb4",               // ✅ ADD THIS
  collation: "utf8mb4_general_ci",  // ✅ ADD THIS
});

db.connect((err) => {
  if (err) {
    console.error("Database Connection Failed:" + err.stack);
    return;
  }
  console.log("Connected to MySQL Database");
});

module.exports = db;
