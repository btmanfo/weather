import { apiFetch } from "./api/client.js";
import { elements } from "./dom/elements.js";
import { initMetaFeature } from "./features/meta.js";
import { initRecordsFeature } from "./features/records.js";
import { initWeatherFeature } from "./features/weather.js";
import { escapeHtml, displayDate } from "./utils/formatters.js";
import { hideMessage, showMessage } from "./utils/messages.js";

function bootstrap() {
  const shared = {
    elements,
    apiFetch,
    showMessage,
    hideMessage,
    escapeHtml,
    displayDate,
  };

  initRecordsFeature(shared);
  initWeatherFeature(shared);
  void initMetaFeature(shared);
}

bootstrap();
