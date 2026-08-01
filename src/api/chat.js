import axios from "axios";

export const API_URL =
  import.meta.env.VITE_API_URL || "https://chat-mcp-fastapi.onrender.com";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const connectAgent = (payload) => api.post("/connect", payload);

export const listSessions = () => api.get("/sessions");

export const deleteSession = (sessionId) =>
  api.delete(`/session/${sessionId}`);

export default api;
