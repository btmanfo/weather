function formatDateUTC(dateObj) {
  return dateObj.toISOString().slice(0, 10);
}

function parseDateUTC(dateString) {
  return new Date(`${dateString}T00:00:00Z`);
}

function isValidDate(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }

  const parsed = parseDateUTC(dateString);
  return !Number.isNaN(parsed.getTime()) && formatDateUTC(parsed) === dateString;
}

function addDays(dateString, days) {
  const dateObj = parseDateUTC(dateString);
  dateObj.setUTCDate(dateObj.getUTCDate() + days);
  return formatDateUTC(dateObj);
}

function daysInclusive(startDate, endDate) {
  const diffMs = parseDateUTC(endDate).getTime() - parseDateUTC(startDate).getTime();
  return Math.floor(diffMs / 86400000) + 1;
}

module.exports = {
  formatDateUTC,
  parseDateUTC,
  isValidDate,
  addDays,
  daysInclusive,
};
