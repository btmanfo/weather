async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "weather-assessment-app/1.0",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Upstream HTTP ${response.status}: ${body.slice(0, 200)}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { fetchJson };
