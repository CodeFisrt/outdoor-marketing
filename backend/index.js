const express = require("express");
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for HTML forms

const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const cors = require("cors");

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const db = require("./db");

app.use(
  cors({
    origin: ["http://localhost:4200", "http://localhost:5173"], // Angular dev server
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// Swagger Setup (kept same, now scans index.js + routes folder)
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AdOnStreet Project API",
      version: "1.0.0",
      description: "API to manage vehicle marketing records",
    },
  },
  apis: ["./index.js", "./routes/*.js"], // scan separated files too
};
const specs = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.get("/", (req, res) => res.send("Welcome to Vehicle Marketing API"));

// ✅ Register ALL routes from separate files (same endpoints, same logic)
const registerAllRoutes = require("./routes/registerAll");

// deps for users login/register exactly like your code
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "secret";

registerAllRoutes(app, db, { bcrypt, jwt, JWT_SECRET });

// ---------------- Start Server ----------------
app.listen(8080, () => {
  console.log(`Server running at http://localhost:${8080}`);
});
