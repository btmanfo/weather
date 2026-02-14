const { fetchJson } = require("./httpService");

async function fetchWikipediaSummary(locationName) {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      locationName,
    )}&utf8=1&format=json`;
    const searchData = await fetchJson(searchUrl);
    const firstHit = searchData?.query?.search?.[0];

    if (!firstHit?.title) {
      return null;
    }

    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(firstHit.title)}`;
    const summaryData = await fetchJson(summaryUrl);

    return {
      title: summaryData.title || firstHit.title,
      extract: summaryData.extract || "",
      url:
        summaryData?.content_urls?.desktop?.page ||
        `https://en.wikipedia.org/wiki/${encodeURIComponent(firstHit.title)}`,
    };
  } catch {
    return null;
  }
}

async function buildLocationInsights(location) {
  const wikipedia = await fetchWikipediaSummary(location.name);

  return {
    mapUrl: `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=11/${location.latitude}/${location.longitude}`,
    youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(location.name + " travel guide")}`,
    wikipedia,
  };
}

module.exports = {
  buildLocationInsights,
};
