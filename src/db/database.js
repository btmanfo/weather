const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const DB_PATH = path.join(__dirname, "..", "..", "weather.db");
const db = new sqlite3.Database(DB_PATH);

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this);
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });

async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS weather_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_query TEXT NOT NULL,
      location_name TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      temperature_payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
}

module.exports = {
  run,
  get,
  all,
  initDb,
};
