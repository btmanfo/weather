const express = require("express");
const path = require("path");
const metaRoutes = require("./routes/metaRoutes");
const weatherRoutes = require("./routes/weatherRoutes");
const recordRoutes = require("./routes/recordRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandlers");

function createApp() {
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use(express.static(path.join(__dirname, "..", "public")));

  app.use("/api", metaRoutes);
  app.use("/api", weatherRoutes);
  app.use("/api", recordRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
