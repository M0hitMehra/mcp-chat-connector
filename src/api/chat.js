import axios from "axios";

export const API_URL =
  import.meta.env.VITE_API_URL || "https://chat-mcp-fastapi.onrender.com";

export const AUTH_TOKEN_KEY = "mcp_auth_token";
export const AUTH_USER_KEY = "mcp_auth_user";

export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

export const getAuthHeaders = () => {
  const token = getAuthToken();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

export const setAuthSession = ({ token, user }) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);

  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem("mcp_session_id");
  localStorage.removeItem("mcp_thread_id");
  localStorage.removeItem("mcp_thread_name");
  sessionStorage.removeItem("mcp_api_key");
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const registerUser = (payload) => api.post("/auth/register", payload);

export const loginUser = (payload) => api.post("/auth/login", payload);

export const checkHealth = () => api.get("/health");

export const connectAgent = () => api.post("/connect");

export const listSessions = () => api.get("/sessions");

export const deleteSession = (sessionId) =>
  api.delete(`/session/${sessionId}`);

export const listThreads = () => api.get("/threads");

export const createThread = (payload) => api.post("/threads", payload);

export const getThreadMessages = (threadId) =>
  api.get(`/threads/${threadId}/messages`);

export const updateThreadConfig = (threadId, payload) =>
  api.patch(`/threads/${threadId}/config`, payload);

export default api;
