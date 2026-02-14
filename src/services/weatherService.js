const AppError = require("../errors/AppError");
const { fetchJson } = require("./httpService");
const { formatDateUTC, addDays, isValidDate, daysInclusive } = require("../utils/dateUtils");

function toDailyEntries(dailyData) {
  if (!dailyData?.time || !Array.isArray(dailyData.time)) {
    return [];
  }

  return dailyData.time.map((day, idx) => ({
    date: day,
    weatherCode: dailyData.weather_code?.[idx] ?? null,
    minC: dailyData.temperature_2m_min?.[idx] ?? null,
    maxC: dailyData.temperature_2m_max?.[idx] ?? null,
    precipitationProbabilityMax: dailyData.precipitation_probability_max?.[idx] ?? null,
    sunrise: dailyData.sunrise?.[idx] ?? null,
    sunset: dailyData.sunset?.[idx] ?? null,
  }));
}

async function fetchCurrentWeather(location) {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&forecast_days=5&timezone=auto`;
  const weatherData = await fetchJson(weatherUrl);

  if (!weatherData?.current) {
    throw new AppError(502, "Weather provider did not return current conditions.");
  }

  return {
    current: {
      temperatureC: weatherData.current.temperature_2m,
      apparentTemperatureC: weatherData.current.apparent_temperature,
      relativeHumidity: weatherData.current.relative_humidity_2m,
      weatherCode: weatherData.current.weather_code,
      windSpeedKmh: weatherData.current.wind_speed_10m,
      isDay: weatherData.current.is_day,
      time: weatherData.current.time,
    },
    forecast: toDailyEntries(weatherData.daily),
  };
}

function validateRecordPayload(payload) {
  const location = String(payload?.location || "").trim();
  const startDate = String(payload?.startDate || "").trim();
  const endDate = String(payload?.endDate || "").trim();

  if (!location) {
    throw new AppError(400, "location is required.");
  }

  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    throw new AppError(400, "startDate and endDate must use YYYY-MM-DD format.");
  }

  if (startDate > endDate) {
    throw new AppError(400, "startDate must be earlier than or equal to endDate.");
  }

  const dayCount = daysInclusive(startDate, endDate);
  if (dayCount > 31) {
    throw new AppError(400, "Date range cannot exceed 31 days.");
  }

  return { location, startDate, endDate };
}

function parseDailyTemperature(daily) {
  if (!daily?.time || !Array.isArray(daily.time)) {
    return [];
  }

  return daily.time.map((day, idx) => ({
    date: day,
    minC: daily.temperature_2m_min?.[idx] ?? null,
    maxC: daily.temperature_2m_max?.[idx] ?? null,
  }));
}

async function fetchRangeSegment(apiType, latitude, longitude, startDate, endDate) {
  if (startDate > endDate) {
    return [];
  }

  const url =
    apiType === "archive"
      ? `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_min,temperature_2m_max&timezone=auto`
      : `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_min,temperature_2m_max&timezone=auto`;

  const data = await fetchJson(url);
  return parseDailyTemperature(data.daily);
}

async function fetchTemperatureRange(location, startDate, endDate) {
  const today = formatDateUTC(new Date());
  const yesterday = addDays(today, -1);

  const segments = [];
  if (startDate <= yesterday) {
    segments.push({
      apiType: "archive",
      startDate,
      endDate: endDate < today ? endDate : yesterday,
    });
  }

  if (endDate >= today) {
    segments.push({
      apiType: "forecast",
      startDate: startDate > today ? startDate : today,
      endDate,
    });
  }

  const collected = [];
  for (const segment of segments) {
    const entries = await fetchRangeSegment(
      segment.apiType,
      location.latitude,
      location.longitude,
      segment.startDate,
      segment.endDate,
    );
    collected.push(...entries);
  }

  collected.sort((a, b) => a.date.localeCompare(b.date));
  if (!collected.length) {
    throw new AppError(
      502,
      "No weather data returned for this date range. Try a nearby range or smaller window.",
    );
  }

  return collected;
}

function buildTemperaturePayload(entries) {
  const minValues = entries.map((entry) => entry.minC).filter((value) => Number.isFinite(value));
  const maxValues = entries.map((entry) => entry.maxC).filter((value) => Number.isFinite(value));

  return {
    unit: "C",
    generatedAt: new Date().toISOString(),
    summary: {
      overallMinC: minValues.length ? Math.min(...minValues) : null,
      overallMaxC: maxValues.length ? Math.max(...maxValues) : null,
      dayCount: entries.length,
    },
    daily: entries,
  };
}

module.exports = {
  fetchCurrentWeather,
  validateRecordPayload,
  fetchTemperatureRange,
  buildTemperaturePayload,
};
