import axios from "axios";

export const MANAGEMENT_API_URL =
  import.meta.env.VITE_MANAGEMENT_API_URL ||
  "https://spring-boot-test-production-a0d6.up.railway.app";
export const MANAGEMENT_TOKEN_KEY = "management_auth_token";

const managementApi = axios.create({
  baseURL: MANAGEMENT_API_URL,
  headers: { "Content-Type": "application/json" },
});

managementApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(MANAGEMENT_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const managementLogin = (payload) => managementApi.post("/login", payload);
export const managementSignup = (payload) => managementApi.post("/signup", payload);
export const managementSignupWithRoles = (payload) =>
  managementApi.post("/admin/signupWithRoles", payload);
export const managementAuthCheck = () => managementApi.get("/auth");
export const getCompanies = (params) =>
  managementApi.get("/api/v1/companies/", { params });
export const createCompany = (payload) =>
  managementApi.post("/api/v1/companies/", payload);

export default managementApi;
