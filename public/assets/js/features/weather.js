const WEATHER_CODE_DICTIONARY = new Map([
  [0, { label: "Clear Sky", icon: "SUN" }],
  [1, { label: "Mainly Clear", icon: "SUN" }],
  [2, { label: "Partly Cloudy", icon: "PARTLY" }],
  [3, { label: "Overcast", icon: "CLOUD" }],
  [45, { label: "Fog", icon: "FOG" }],
  [48, { label: "Dense Fog", icon: "FOG" }],
  [51, { label: "Light Drizzle", icon: "RAIN" }],
  [53, { label: "Drizzle", icon: "RAIN" }],
  [55, { label: "Heavy Drizzle", icon: "RAIN" }],
  [56, { label: "Freezing Drizzle", icon: "ICE" }],
  [57, { label: "Dense Freezing Drizzle", icon: "ICE" }],
  [61, { label: "Light Rain", icon: "RAIN" }],
  [63, { label: "Rain", icon: "RAIN" }],
  [65, { label: "Heavy Rain", icon: "RAIN" }],
  [66, { label: "Freezing Rain", icon: "ICE" }],
  [67, { label: "Heavy Freezing Rain", icon: "ICE" }],
  [71, { label: "Light Snow", icon: "SNOW" }],
  [73, { label: "Snow", icon: "SNOW" }],
  [75, { label: "Heavy Snow", icon: "SNOW" }],
  [77, { label: "Snow Grains", icon: "SNOW" }],
  [80, { label: "Rain Showers", icon: "SHOWER" }],
  [81, { label: "Heavy Rain Showers", icon: "SHOWER" }],
  [82, { label: "Violent Rain Showers", icon: "STORM" }],
  [85, { label: "Snow Showers", icon: "SNOW" }],
  [86, { label: "Heavy Snow Showers", icon: "SNOW" }],
  [95, { label: "Thunderstorm", icon: "STORM" }],
  [96, { label: "Thunderstorm + Hail", icon: "STORM" }],
  [99, { label: "Severe Thunderstorm + Hail", icon: "STORM" }],
]);

function hasWeatherDom(elements) {
  return Boolean(elements.weatherForm && elements.locationInput);
}

function weatherMeta(code, isDay) {
  if (WEATHER_CODE_DICTIONARY.has(code)) {
    return WEATHER_CODE_DICTIONARY.get(code);
  }

  return isDay
    ? { label: "Unknown Conditions", icon: "DAY" }
    : { label: "Unknown Conditions", icon: "NIGHT" };
}

function renderWeather(elements, payload, escapeHtml, displayDate) {
  const { location, weather, insights } = payload;
  const current = weather.current;
  const currentMeta = weatherMeta(current.weatherCode, current.isDay);

  elements.currentLocation.textContent = location.name;
  elements.currentSummary.textContent =
    `${currentMeta.icon} ${currentMeta.label} | ` +
    `${current.temperatureC} C (feels ${current.apparentTemperatureC} C)`;
  elements.currentHumidity.textContent = `${current.relativeHumidity}%`;
  elements.currentWind.textContent = `${current.windSpeedKmh} km/h`;

  elements.forecastGrid.innerHTML = "";
  weather.forecast.forEach((day) => {
    const itemMeta = weatherMeta(day.weatherCode, true);
    const article = document.createElement("article");
    article.className = "forecast-card";
    article.innerHTML = `
      <p class="label">${escapeHtml(displayDate(day.date))}</p>
      <p><strong>${escapeHtml(itemMeta.icon)} ${escapeHtml(itemMeta.label)}</strong></p>
      <p>Min: ${escapeHtml(day.minC)} C</p>
      <p>Max: ${escapeHtml(day.maxC)} C</p>
      <p>Rain Prob: ${escapeHtml(day.precipitationProbabilityMax ?? "-")}%</p>
    `;
    elements.forecastGrid.appendChild(article);
  });

  elements.mapLink.href = insights.mapUrl;
  elements.youtubeLink.href = insights.youtubeUrl;

  if (insights.wikipedia) {
    elements.wikiText.textContent = insights.wikipedia.extract || "No summary text returned.";
    elements.wikiLink.href = insights.wikipedia.url;
    elements.wikiLink.textContent = `Read: ${insights.wikipedia.title}`;
    elements.wikiLink.classList.remove("hidden");
  } else {
    elements.wikiText.textContent = "No Wikipedia summary available for this location.";
    elements.wikiLink.classList.add("hidden");
  }

  elements.weatherOutput.classList.remove("hidden");
}

export function initWeatherFeature({
  elements,
  apiFetch,
  showMessage,
  hideMessage,
  escapeHtml,
  displayDate,
}) {
  if (!hasWeatherDom(elements)) {
    return;
  }

  async function lookupWeather(params) {
    hideMessage(elements.weatherError);
    elements.weatherOutput?.classList.add("hidden");

    const searchParams = new URLSearchParams();
    if (params.location) {
      searchParams.set("location", params.location);
    }
    if (params.lat && params.lon) {
      searchParams.set("lat", params.lat);
      searchParams.set("lon", params.lon);
    }

    const result = await apiFetch(`/api/weather?${searchParams.toString()}`);
    renderWeather(elements, result, escapeHtml, displayDate);
  }

  elements.weatherForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const location = elements.locationInput.value.trim();
    if (!location) {
      showMessage(elements.weatherError, "Please provide a location first.");
      return;
    }

    try {
      await lookupWeather({ location });
      if (elements.recordLocationInput) {
        elements.recordLocationInput.value = location;
      }
    } catch (error) {
      showMessage(elements.weatherError, error.message);
    }
  });

  elements.myLocationBtn?.addEventListener("click", () => {
    hideMessage(elements.weatherError);
    if (!navigator.geolocation) {
      showMessage(elements.weatherError, "Geolocation is not supported in this browser.");
      return;
    }

    elements.myLocationBtn.disabled = true;
    elements.myLocationBtn.textContent = "Detecting...";

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude.toFixed(6);
          const lon = position.coords.longitude.toFixed(6);
          elements.locationInput.value = `${lat},${lon}`;
          await lookupWeather({ lat, lon });
          if (elements.recordLocationInput) {
            elements.recordLocationInput.value = `${lat},${lon}`;
          }
        } catch (error) {
          showMessage(elements.weatherError, error.message);
        } finally {
          elements.myLocationBtn.disabled = false;
          elements.myLocationBtn.textContent = "Use My Location";
        }
      },
      (error) => {
        const reason =
          error.code === 1
            ? "Location permission denied."
            : error.code === 2
              ? "Position unavailable."
              : "Location request timed out.";
        showMessage(elements.weatherError, reason);
        elements.myLocationBtn.disabled = false;
        elements.myLocationBtn.textContent = "Use My Location";
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
}
