const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const port = 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const cors = require("cors");

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const db = require("./db");

// Create HTTP server for Socket.io
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:4200", "http://localhost:5173"],
    methods: ["GET", "POST"]
  }
});

app.use(
  cors({
    origin: ["http://localhost:4200", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    exposedHeaders: ["Content-Type", "Content-Disposition"],
  })
);

// Make io available to routes
app.set("io", io);

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

// Wishlist Refactor
const wishlistRoutes = require("./routes/wishlist.routes");
app.use("/wishlist", wishlistRoutes);

// deps for users login/register exactly like your code
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "secret";

registerAllRoutes(app, db, { bcrypt, jwt, JWT_SECRET });

// ---------------- Socket.io Connection Handling ----------------
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Join inventory room for real-time updates
  socket.on("join-inventory", () => {
    socket.join("inventory-updates");
    console.log(`Client ${socket.id} joined inventory-updates room`);
  });

  // Handle status updates
  socket.on("inventory-status-update", (data) => {
    // Broadcast to all clients in inventory room
    io.to("inventory-updates").emit("inventory-updated", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ---------------- Start Server ----------------
server.listen(8080, () => {
  console.log(`Server running at http://localhost:${8080}`);
  console.log(`WebSocket server ready for connections`);
});
