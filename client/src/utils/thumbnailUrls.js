import API_BASE_URL from "../api/api";

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;
const POLLINATIONS_HOSTS = new Set(["image.pollinations.ai", "pollinations.ai"]);

export const resolveThumbnailUrl = (imageUrl) => {
  if (!imageUrl) {
    return "";
  }

  if (imageUrl.startsWith("data:") || imageUrl.startsWith("blob:")) {
    return imageUrl;
  }

  if (!ABSOLUTE_URL_PATTERN.test(imageUrl)) {
    return imageUrl;
  }

  try {
    const parsedUrl = new URL(imageUrl);

    if (POLLINATIONS_HOSTS.has(parsedUrl.hostname)) {
      return parsedUrl.toString();
    }
  } catch (error) {
    return imageUrl;
  }

  return `${API_BASE_URL}/thumbnails/proxy?url=${encodeURIComponent(imageUrl)}`;
};