import axios from "axios";

export const MANAGEMENT_API_URL =
  import.meta.env.VITE_MANAGEMENT_API_URL ||
  "https://spring-boot-test-production-a0d6.up.railway.app";

export const MANAGEMENT_TOKEN_KEY = "management_auth_token";
export const MANAGEMENT_USER_KEY = "management_auth_user";

export const getManagementToken = () =>
  localStorage.getItem(MANAGEMENT_TOKEN_KEY);

export const getManagementUser = () => {
  const user = localStorage.getItem(MANAGEMENT_USER_KEY);
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return { email: user };
  }
};

export const setManagementSession = ({ token, user }) => {
  if (token) localStorage.setItem(MANAGEMENT_TOKEN_KEY, token);
  if (user) localStorage.setItem(MANAGEMENT_USER_KEY, JSON.stringify(user));
};

export const clearManagementSession = () => {
  localStorage.removeItem(MANAGEMENT_TOKEN_KEY);
  localStorage.removeItem(MANAGEMENT_USER_KEY);
};

const managementApi = axios.create({
  baseURL: MANAGEMENT_API_URL,
  headers: { "Content-Type": "application/json" },
});

managementApi.interceptors.request.use((config) => {
  const token = getManagementToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Spring Boot Railway Auth Endpoints
export const managementLogin = (payload) =>
  managementApi.post("/login", payload);

export const managementSignup = (payload) =>
  managementApi.post("/signup", payload);

export const managementSignupWithRoles = (payload) =>
  managementApi.post("/admin/signupWithRoles", payload);

export const managementAuthCheck = () => managementApi.get("/auth");

// Employees
export const getEmployees = () => managementApi.get("/api/v1/employees");
export const createEmployee = (payload) =>
  managementApi.post("/api/v1/employees", payload);
export const getEmployee = (code) =>
  managementApi.get(`/api/v1/employees/${encodeURIComponent(code)}`);
export const updateEmployee = (code, payload) =>
  managementApi.put(`/api/v1/employees/${encodeURIComponent(code)}`, payload);
export const deleteEmployee = (code) =>
  managementApi.delete(`/api/v1/employees/${encodeURIComponent(code)}`);

// Companies
export const getCompanies = (params) =>
  managementApi.get("/api/v1/companies/", { params });
export const createCompany = (payload) =>
  managementApi.post("/api/v1/companies/", payload);
export const getCompany = (companyCode) =>
  managementApi.get(`/api/v1/companies/${encodeURIComponent(companyCode)}`);
export const updateCompany = (companyCode, payload) =>
  managementApi.put(`/api/v1/companies/${encodeURIComponent(companyCode)}`, payload);
export const deleteCompany = (companyCode) =>
  managementApi.delete(`/api/v1/companies/${encodeURIComponent(companyCode)}`);

// Generic resource helper for Branches, Departments, Teams, Designations, Roles, Access Levels
const resourceUrl = (path, code) =>
  `/api/v1/${path}${code == null ? "" : `/${encodeURIComponent(code)}`}`;

export const listManagementResource = (path) =>
  managementApi.get(resourceUrl(path));
export const createManagementResource = (path, payload) =>
  managementApi.post(resourceUrl(path), payload);
export const updateManagementResource = (path, code, payload) =>
  managementApi.put(resourceUrl(path, code), payload);
export const deleteManagementResource = (path, code) =>
  managementApi.delete(resourceUrl(path, code));

export default managementApi;
