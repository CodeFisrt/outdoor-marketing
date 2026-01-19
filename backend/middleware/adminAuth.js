const jwt = require("jsonwebtoken");

module.exports = function adminAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) return res.status(401).json({ message: "Token required" });

    const JWT_SECRET = process.env.JWT_SECRET || "secret";
    const decoded = jwt.verify(token, JWT_SECRET);

    // token must be admin
    if (!decoded || decoded.type !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    req.admin = decoded; // { adminId, adminEmail, type }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid/Expired token" });
  }
};
