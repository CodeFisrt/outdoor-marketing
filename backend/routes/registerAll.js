const registerVehicleRoutes = require("./vehicles.routes");
const registerSocietyRoutes = require("./societies.routes");
const registerBalloonRoutes = require("./balloons.routes");
const registerScreenRoutes = require("./screens.routes");
const registerHoardingRoutes = require("./hoardings.routes");
const registerDashboardRoutes = require("./dashboard.routes");
const registerSearchRoutes = require("./search.routes");
const registerBookingRoutes = require("./booking.routes");
const registerContactRoutes = require("./contact.routes");
const registerUserRoutes = require("./users.routes");

/**
 * This file ONLY registers routes.
 * It does NOT change your existing index.js logic.
 */
module.exports = function registerAllRoutes(app, db, deps = {}) {
  registerVehicleRoutes(app, db);
  registerSocietyRoutes(app, db);
  registerBalloonRoutes(app, db);
  registerScreenRoutes(app, db);
  registerHoardingRoutes(app, db);
  registerDashboardRoutes(app, db);
  registerSearchRoutes(app, db);
  registerBookingRoutes(app, db);
  registerContactRoutes(app, db);

  // Users module needs bcrypt/jwt/JWT_SECRET exactly like your index.js uses
  if (deps.bcrypt && deps.jwt && deps.JWT_SECRET) {
    registerUserRoutes(app, db, deps.bcrypt, deps.jwt, deps.JWT_SECRET);
  }
};
