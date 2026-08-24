const sanitizeText = (str) => String(str || "").trim();

/**
 * Searches YouTube for top ranking viral videos related to the topic
 * and returns the best matching reference video with title, thumbnail, channel, and views.
 */
const searchYouTubeReference = async (query) => {
  if (!query || !query.trim()) return null;

  try {
    const cleanQuery = sanitizeText(query);
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanQuery)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const html = await response.text();
    const match =
      html.match(/var ytInitialData = ({.*?});<\/script>/s) ||
      html.match(/ytInitialData\s*=\s*({.+?});/s);

    if (!match) return null;

    const data = JSON.parse(match[1]);
    const contents =
      data.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];

    const videos = [];
    for (const item of contents) {
      const v = item.videoRenderer;
      if (v && v.videoId) {
        const title = v.title?.runs?.[0]?.text || "";
        const channel = v.ownerText?.runs?.[0]?.text || "";
        const views =
          v.viewCountText?.simpleText ||
          v.viewCountText?.runs?.[0]?.text ||
          "Viral Video";
        const videoId = v.videoId;

        videos.push({
          videoId,
          title,
          channel,
          views,
          thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          highResThumbnailUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`
        });
      }
      if (videos.length >= 4) break;
    }

    if (!videos.length) return null;

    // Pick top ranking matching video
    return videos[0];
  } catch (error) {
    // Graceful fallback if YouTube search fails
    return null;
  }
};

module.exports = {
  searchYouTubeReference
};
