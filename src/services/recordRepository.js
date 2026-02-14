const { run, get, all } = require("../db/database");

function mapRow(row) {
  if (!row) {
    return null;
  }

  let payload = {};
  try {
    payload = JSON.parse(row.temperature_payload);
  } catch {
    payload = {};
  }

  return {
    id: row.id,
    locationQuery: row.location_query,
    locationName: row.location_name,
    latitude: row.latitude,
    longitude: row.longitude,
    startDate: row.start_date,
    endDate: row.end_date,
    temperaturePayload: payload,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listRecords(limit) {
  const rows = await all(`SELECT * FROM weather_records ORDER BY id DESC LIMIT ?`, [limit]);
  return rows.map(mapRow);
}

async function listAllRecords() {
  const rows = await all(`SELECT * FROM weather_records ORDER BY id DESC`);
  return rows.map(mapRow);
}

async function getRecordById(id) {
  const row = await get(`SELECT * FROM weather_records WHERE id = ?`, [id]);
  return mapRow(row);
}

async function createRecord(input) {
  const result = await run(
    `
    INSERT INTO weather_records (
      location_query,
      location_name,
      latitude,
      longitude,
      start_date,
      end_date,
      temperature_payload,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.locationQuery,
      input.locationName,
      input.latitude,
      input.longitude,
      input.startDate,
      input.endDate,
      JSON.stringify(input.temperaturePayload),
      input.createdAt,
      input.updatedAt,
    ],
  );

  return getRecordById(result.lastID);
}

async function updateRecord(id, input) {
  await run(
    `
    UPDATE weather_records
    SET
      location_query = ?,
      location_name = ?,
      latitude = ?,
      longitude = ?,
      start_date = ?,
      end_date = ?,
      temperature_payload = ?,
      updated_at = ?
    WHERE id = ?
    `,
    [
      input.locationQuery,
      input.locationName,
      input.latitude,
      input.longitude,
      input.startDate,
      input.endDate,
      JSON.stringify(input.temperaturePayload),
      input.updatedAt,
      id,
    ],
  );

  return getRecordById(id);
}

async function deleteRecordById(id) {
  const result = await run(`DELETE FROM weather_records WHERE id = ?`, [id]);
  return Boolean(result.changes);
}

module.exports = {
  listRecords,
  listAllRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecordById,
};
