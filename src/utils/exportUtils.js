function escapeCsv(value) {
  const text = String(value ?? "");
  if (!/[",\n]/.test(text)) {
    return text;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

function exportAsCsv(records) {
  const headers = [
    "id",
    "location_query",
    "location_name",
    "latitude",
    "longitude",
    "start_date",
    "end_date",
    "overall_min_c",
    "overall_max_c",
    "created_at",
    "updated_at",
  ];

  const lines = [headers.join(",")];
  for (const record of records) {
    const values = [
      record.id,
      record.locationQuery,
      record.locationName,
      record.latitude,
      record.longitude,
      record.startDate,
      record.endDate,
      record.temperaturePayload?.summary?.overallMinC,
      record.temperaturePayload?.summary?.overallMaxC,
      record.createdAt,
      record.updatedAt,
    ];
    lines.push(values.map(escapeCsv).join(","));
  }

  return lines.join("\n");
}

function exportAsMarkdown(records) {
  const lines = [
    "| id | location | range | min C | max C | created |",
    "| --- | --- | --- | --- | --- | --- |",
  ];

  for (const record of records) {
    lines.push(
      `| ${record.id} | ${record.locationName} | ${record.startDate} to ${record.endDate} | ${record.temperaturePayload?.summary?.overallMinC ?? ""} | ${record.temperaturePayload?.summary?.overallMaxC ?? ""} | ${record.createdAt} |`,
    );
  }

  return lines.join("\n");
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function exportAsXml(records) {
  const body = records
    .map(
      (record) => `
  <record>
    <id>${record.id}</id>
    <locationQuery>${escapeXml(record.locationQuery)}</locationQuery>
    <locationName>${escapeXml(record.locationName)}</locationName>
    <latitude>${record.latitude}</latitude>
    <longitude>${record.longitude}</longitude>
    <startDate>${record.startDate}</startDate>
    <endDate>${record.endDate}</endDate>
    <overallMinC>${record.temperaturePayload?.summary?.overallMinC ?? ""}</overallMinC>
    <overallMaxC>${record.temperaturePayload?.summary?.overallMaxC ?? ""}</overallMaxC>
    <createdAt>${escapeXml(record.createdAt)}</createdAt>
    <updatedAt>${escapeXml(record.updatedAt)}</updatedAt>
  </record>`,
    )
    .join("\n");

  return `<records>${body}\n</records>`;
}

module.exports = {
  exportAsCsv,
  exportAsMarkdown,
  exportAsXml,
};
