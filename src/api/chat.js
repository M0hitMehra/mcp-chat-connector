import axios from "axios";

export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export const AUTH_TOKEN_KEY = "mcp_auth_token";
export const AUTH_USER_KEY = "mcp_auth_user";

export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

export const getSavedApiKey = () =>
  sessionStorage.getItem("mcp_api_key") || localStorage.getItem("mcp_api_key") || "";

export const saveThreadDefaults = ({ apiKey, modelName }) => {
  if (apiKey) sessionStorage.setItem("mcp_api_key", apiKey);
  if (modelName) localStorage.setItem("mcp_model", modelName);
};

export const getAuthUser = () => {
  const user = localStorage.getItem(AUTH_USER_KEY);
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};

export const getAuthHeaders = () => {
  const token = getAuthToken();
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

export const setAuthSession = ({ token, user }) => {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
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
  localStorage.removeItem("mcp_pitch_thread_id");
  localStorage.removeItem("mcp_pitch_company");
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

// Backend API Wrappers
export const registerUser = (payload) => api.post("/auth/register", payload);

export const loginUser = (payload) => api.post("/auth/login", payload);

export const checkHealth = () => api.get("/health");

export const listThreads = () => api.get("/threads");

export const createThread = (payload) => api.post("/threads", payload);

export const getThreadMessages = (threadId) =>
  api.get(`/threads/${threadId}/messages`);

export const updateThreadConfig = (threadId, payload) =>
  api.patch(`/threads/${threadId}/config`, payload);

export const updatePitchThreadConfig = (threadId, payload) =>
  api.patch(`/pitch/${threadId}/config`, payload);

export const searchPitchCompanies = (companyName) =>
  api.post("/pitch/company-search", null, {
    params: { company_name: companyName },
  });

export const createPitchThread = (payload) => api.post("/pitch/", payload);

export const listPitchThreads = () => api.get("/pitch/");

export const getPitchThreadMessages = (threadId) =>
  api.get(`/pitch/${threadId}/messages`);

export default api;
