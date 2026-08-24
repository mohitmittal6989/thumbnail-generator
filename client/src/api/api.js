const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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

  const data = await response.json();

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