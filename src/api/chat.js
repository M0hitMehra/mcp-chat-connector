import axios from "axios";

export const API_URL =
  import.meta.env.VITE_API_URL || "https://chat-mcp-fastapi.onrender.com";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;