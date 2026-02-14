const AppError = require("../errors/AppError");
const { fetchJson } = require("./httpService");

function parseCoordinates(rawInput) {
  const match = String(rawInput)
    .trim()
    .match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) {
    return null;
  }

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }

  return { latitude, longitude };
}

async function resolveLocation(locationInput) {
  const trimmedInput = String(locationInput || "").trim();
  if (!trimmedInput) {
    throw new AppError(400, "Location is required.");
  }

  const coordinates = parseCoordinates(trimmedInput);
  if (coordinates) {
    let locationName = `Lat ${coordinates.latitude.toFixed(4)}, Lon ${coordinates.longitude.toFixed(4)}`;

    try {
      const reverseGeoUrl = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&count=1&language=en&format=json`;
      const reverseGeo = await fetchJson(reverseGeoUrl);
      const first = reverseGeo?.results?.[0];

      if (first) {
        const parts = [first.name, first.admin1, first.country].filter(Boolean);
        if (parts.length) {
          locationName = parts.join(", ");
        }
      }
    } catch {
      // Keep coordinate display name when reverse lookup fails.
    }

    return {
      query: trimmedInput,
      name: locationName,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    };
  }

  const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    trimmedInput,
  )}&count=5&language=en&format=json`;

  const geocodingResult = await fetchJson(geocodingUrl);
  const firstMatch = geocodingResult?.results?.[0];

  if (!firstMatch) {
    throw new AppError(404, "Location not found. Try a city, postal code, landmark, or lat,lon.");
  }

  const locationName = [firstMatch.name, firstMatch.admin1, firstMatch.country].filter(Boolean).join(", ");
  return {
    query: trimmedInput,
    name: locationName || firstMatch.name,
    latitude: firstMatch.latitude,
    longitude: firstMatch.longitude,
  };
}

module.exports = {
  resolveLocation,
};
