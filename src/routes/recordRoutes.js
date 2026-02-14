const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const AppError = require("../errors/AppError");
const { resolveLocation } = require("../services/locationService");
const {
  validateRecordPayload,
  fetchTemperatureRange,
  buildTemperaturePayload,
} = require("../services/weatherService");
const {
  listRecords,
  listAllRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecordById,
} = require("../services/recordRepository");
const { exportAsCsv, exportAsMarkdown, exportAsXml } = require("../utils/exportUtils");

const router = express.Router();

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, "Invalid id.");
  }
  return id;
}

function parseLimit(rawLimit) {
  const requestedLimit = Number(rawLimit || 100);
  return Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 500) : 100;
}

router.get(
  "/records",
  asyncHandler(async (req, res) => {
    const records = await listRecords(parseLimit(req.query.limit));
    res.json(records);
  }),
);

router.get(
  "/records/export",
  asyncHandler(async (req, res) => {
    const format = String(req.query.format || "json").toLowerCase();
    const records = await listAllRecords();

    if (format === "json") {
      res.setHeader("Content-Disposition", "attachment; filename=weather-records.json");
      res.json(records);
      return;
    }

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=weather-records.csv");
      res.send(exportAsCsv(records));
      return;
    }

    if (format === "md" || format === "markdown") {
      res.setHeader("Content-Type", "text/markdown; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=weather-records.md");
      res.send(exportAsMarkdown(records));
      return;
    }

    if (format === "xml") {
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=weather-records.xml");
      res.send(exportAsXml(records));
      return;
    }

    throw new AppError(400, "Unsupported export format. Use json, csv, md, or xml.");
  }),
);

router.get(
  "/records/:id",
  asyncHandler(async (req, res) => {
    const record = await getRecordById(parseId(req.params.id));
    if (!record) {
      throw new AppError(404, "Record not found.");
    }
    res.json(record);
  }),
);

router.post(
  "/records",
  asyncHandler(async (req, res) => {
    const { location, startDate, endDate } = validateRecordPayload(req.body);
    const resolved = await resolveLocation(location);
    const dailyTemperatures = await fetchTemperatureRange(resolved, startDate, endDate);
    const now = new Date().toISOString();

    const created = await createRecord({
      locationQuery: location,
      locationName: resolved.name,
      latitude: resolved.latitude,
      longitude: resolved.longitude,
      startDate,
      endDate,
      temperaturePayload: buildTemperaturePayload(dailyTemperatures),
      createdAt: now,
      updatedAt: now,
    });

    res.status(201).json(created);
  }),
);

router.put(
  "/records/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const existing = await getRecordById(id);
    if (!existing) {
      throw new AppError(404, "Record not found.");
    }

    const merged = validateRecordPayload({
      location: req.body?.location ?? existing.locationQuery,
      startDate: req.body?.startDate ?? existing.startDate,
      endDate: req.body?.endDate ?? existing.endDate,
    });

    const resolved = await resolveLocation(merged.location);
    const dailyTemperatures = await fetchTemperatureRange(resolved, merged.startDate, merged.endDate);
    const updated = await updateRecord(id, {
      locationQuery: merged.location,
      locationName: resolved.name,
      latitude: resolved.latitude,
      longitude: resolved.longitude,
      startDate: merged.startDate,
      endDate: merged.endDate,
      temperaturePayload: buildTemperaturePayload(dailyTemperatures),
      updatedAt: new Date().toISOString(),
    });

    res.json(updated);
  }),
);

router.delete(
  "/records/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const deleted = await deleteRecordById(id);
    if (!deleted) {
      throw new AppError(404, "Record not found.");
    }
    res.json({ deleted: true, id });
  }),
);

module.exports = router;
