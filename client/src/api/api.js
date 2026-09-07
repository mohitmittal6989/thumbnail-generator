const getApiBaseUrl = () => {
  let url = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").trim();
  url = url.replace(/\/+$/, "");
  if (!url.endsWith("/api")) {
    url = `${url}/api`;
  }
  return url;
};

const API_BASE_URL = getApiBaseUrl();

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem("thumblify_token");

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  let data;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = { message: text || `Request failed with status ${response.status}` };
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};

export const api = {
  signup: (payload) =>
    request("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  login: (payload) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getMe: () => request("/auth/me"),
  generateThumbnail: (payload) =>
    request("/ai/generate-thumbnail", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getMyThumbnails: () => request("/thumbnails"),
  deleteThumbnail: (id) =>
    request(`/thumbnails/${id}`, {
      method: "DELETE"
    }),
  getCommunityFeed: () => request("/thumbnails/community"),
  likeThumbnail: (id) =>
    request(`/thumbnails/community/${id}/like`, {
      method: "POST"
    })
};

export default API_BASE_URL;