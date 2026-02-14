const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const AppError = require("../errors/AppError");
const { resolveLocation } = require("../services/locationService");
const { fetchCurrentWeather } = require("../services/weatherService");
const { buildLocationInsights } = require("../services/insightService");

const router = express.Router();

router.get(
  "/weather",
  asyncHandler(async (req, res) => {
    let locationInput = String(req.query.location || "").trim();

    if (!locationInput && req.query.lat && req.query.lon) {
      locationInput = `${req.query.lat},${req.query.lon}`;
    }

    if (!locationInput) {
      throw new AppError(400, "Provide `location` or `lat` and `lon` query params.");
    }

    const location = await resolveLocation(locationInput);
    const weather = await fetchCurrentWeather(location);
    const insights = await buildLocationInsights(location);

    res.json({ location, weather, insights });
  }),
);

module.exports = router;
