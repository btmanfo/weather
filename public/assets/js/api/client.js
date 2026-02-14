export async function apiFetch(url, options = {}) {
  const config = { ...options };
  config.headers = { ...(options.headers || {}) };

  if (config.body && !config.headers["Content-Type"]) {
    config.headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, config);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }

  return payload;
}
