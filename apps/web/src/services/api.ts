import axios from "axios";

// Generate or retrieve persistent guest session ID
let guestSessionId = localStorage.getItem("uh_guest_session_id");
if (!guestSessionId) {
  guestSessionId = `uh_guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  localStorage.setItem("uh_guest_session_id", guestSessionId);
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
    "x-session-id": guestSessionId,
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("uh_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes("/login")) {
      // Session expired, remove stale token
      // localStorage.removeItem("uh_token");
    }
    return Promise.reject(error);
  }
);
