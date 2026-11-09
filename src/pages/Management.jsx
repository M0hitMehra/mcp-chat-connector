import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowRightOnRectangleIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  CpuChipIcon,
  KeyIcon,
  LockClosedIcon,
  RectangleGroupIcon,
  ServerStackIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

import Navbar from "../components/Navbar";
import ManagementResource from "../components/ManagementResource";
import {
  clearManagementSession,
  getManagementToken,
  MANAGEMENT_API_URL,
  managementLogin,
  managementSignup,
  setManagementSession,
} from "../api/management";
import { getAuthToken } from "../api/chat";

const STATUS_OPTIONS = ["ACTIVE", "INACTIVE"];

const MANAGEMENT_RESOURCES = [
  {
    id: "employees",
    label: "Employees",
    singular: "Employee",
    plural: "Employees",
    path: "employees",
    getKey: (row) => row.employeeCode || row.id,
    fields: [
      { name: "firstName", label: "First name", required: true },
      { name: "middleName", label: "Middle name" },
      { name: "lastName", label: "Last name", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Phone", type: "tel" },
      { name: "teamCode", label: "Team code", required: true, read: (row) => row.teamCode || row.team_id },
      { name: "designation", label: "Designation", required: true, read: (row) => row.designation || row.designation_id },
      { name: "managerCode", label: "Manager employee code", required: true, read: (row) => row.managerCode || row.manager_id },
      {
        name: "status",
        label: "Employment status",
        type: "select",
        options: ["ACTIVE", "ON_LEAVE", "SUSPENDED", "RESIGNED", "TERMINATED"],
        defaultValue: "ACTIVE",
        read: (row) => row.status || row.employmentStatus,
      },
      { name: "roles", label: "Roles (comma separated)", type: "list", read: (row) => row.roles },
    ],
    filters: [
      { name: "employeeCode", label: "Employee code", value: (row) => row.employeeCode },
      { name: "name", label: "Name", value: (row) => [row.firstName, row.middleName, row.lastName].filter(Boolean).join(" ") },
      { name: "email", label: "Email", value: (row) => row.email },
      { name: "status", label: "Status", value: (row) => row.employmentStatus || row.status },
    ],
    columns: [
      { label: "Employee code", value: (row) => row.employeeCode },
      { label: "Name", value: (row) => [row.firstName, row.middleName, row.lastName].filter(Boolean).join(" ") },
      { label: "Email", value: (row) => row.email },
      { label: "Team", value: (row) => row.team_id || row.teamCode },
      { label: "Designation", value: (row) => row.designation_id || row.designation },
      { label: "Status", value: (row) => row.employmentStatus || row.status },
    ],
  },
  {
    id: "companies",
    label: "Companies",
    singular: "Company",
    plural: "Companies",
    path: "companies",
    getKey: (row) => row.code || row.companyCode || row.id,
    fields: [
      { name: "name", label: "Company name", required: true, read: (row) => row.name || row.companyName },
      { name: "code", label: "Company code", required: true, read: (row) => row.code || row.companyCode },
      { name: "legalName", label: "Legal name", read: (row) => row.legalName },
      { name: "email", label: "Email", type: "email" },
      { name: "phone", label: "Phone", type: "tel" },
      { name: "gstin", label: "GSTIN" },
      { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS, defaultValue: "ACTIVE" },
    ],
    filters: [
      { name: "code", label: "Code", value: (row) => row.code || row.companyCode },
      { name: "name", label: "Name", value: (row) => row.name || row.companyName },
      { name: "gstin", label: "GSTIN", value: (row) => row.gstin },
      { name: "status", label: "Status", value: (row) => row.status },
    ],
    columns: [
      { label: "Code", value: (row) => row.code || row.companyCode },
      { label: "Name", value: (row) => row.name || row.companyName },
      { label: "Legal name", value: (row) => row.legalName },
      { label: "Email", value: (row) => row.email },
      { label: "Phone", value: (row) => row.phone },
      { label: "Status", value: (row) => row.status },
    ],
  },
  {
    id: "branches",
    label: "Branches",
    singular: "Branch",
    plural: "Branches",
    path: "branches",
    getKey: (row) => row.code,
    fields: [
      { name: "name", label: "Branch name", required: true },
      { name: "companyCode", label: "Company code", required: true, read: (row) => row.companyCode || row.company?.code },
      { name: "email", label: "Email", type: "email" },
      { name: "phone", label: "Phone", type: "tel" },
      { name: "managerCode", label: "Manager code", required: true, read: (row) => row.managerCode || row.manager?.employeeCode },
      { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS, defaultValue: "ACTIVE" },
    ],
    filters: [
      { name: "code", label: "Code", value: (row) => row.code },
      { name: "name", label: "Name", value: (row) => row.name },
      { name: "status", label: "Status", value: (row) => row.status },
    ],
    columns: [
      { label: "Code", value: (row) => row.code },
      { label: "Name", value: (row) => row.name },
      { label: "Company", value: (row) => row.company?.code || row.companyCode },
      { label: "Email", value: (row) => row.email },
      { label: "Status", value: (row) => row.status },
    ],
  },
  {
    id: "departments",
    label: "Departments",
    singular: "Department",
    plural: "Departments",
    path: "departments",
    getKey: (row) => row.code,
    fields: [
      { name: "name", label: "Department name", required: true },
      { name: "branchCode", label: "Branch code", required: true, read: (row) => row.branchCode || row.branch?.code },
      { name: "description", label: "Description", type: "textarea" },
      { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS, defaultValue: "ACTIVE" },
    ],
    filters: [
      { name: "code", label: "Code", value: (row) => row.code },
      { name: "name", label: "Name", value: (row) => row.name },
      { name: "status", label: "Status", value: (row) => row.status },
    ],
    columns: [
      { label: "Code", value: (row) => row.code },
      { label: "Name", value: (row) => row.name },
      { label: "Branch", value: (row) => row.branch?.code || row.branchCode },
      { label: "Status", value: (row) => row.status },
    ],
  },
  {
    id: "teams",
    label: "Teams",
    singular: "Team",
    plural: "Teams",
    path: "teams",
    getKey: (row) => row.code,
    fields: [
      { name: "name", label: "Team name", required: true },
      { name: "departmentCode", label: "Department code", required: true, read: (row) => row.departmentCode || row.department?.code },
      { name: "leadCode", label: "Lead employee code", required: true, read: (row) => row.leadCode || row.lead?.employeeCode },
      { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS, defaultValue: "ACTIVE" },
    ],
    filters: [
      { name: "code", label: "Code", value: (row) => row.code },
      { name: "name", label: "Name", value: (row) => row.name },
      { name: "status", label: "Status", value: (row) => row.status },
    ],
    columns: [
      { label: "Code", value: (row) => row.code },
      { label: "Name", value: (row) => row.name },
      { label: "Department", value: (row) => row.department?.code || row.departmentCode },
      { label: "Lead", value: (row) => row.lead?.employeeCode || row.leadCode },
      { label: "Status", value: (row) => row.status },
    ],
  },
  {
    id: "designations",
    label: "Designations",
    singular: "Designation",
    plural: "Designations",
    path: "designations",
    getKey: (row) => row.code || row.designationCode,
    fields: [
      { name: "title", label: "Designation title", required: true, read: (row) => row.title || row.name },
      { name: "code", label: "Designation code", required: true, read: (row) => row.code || row.designationCode },
      { name: "description", label: "Description", type: "textarea" },
    ],
    filters: [
      { name: "code", label: "Code", value: (row) => row.code || row.designationCode },
      { name: "title", label: "Title", value: (row) => row.title || row.name },
    ],
    columns: [
      { label: "Code", value: (row) => row.code || row.designationCode },
      { label: "Title", value: (row) => row.title || row.name },
      { label: "Description", value: (row) => row.description },
    ],
  },
  {
    id: "roles",
    label: "Roles",
    singular: "Role",
    plural: "Roles",
    path: "roles",
    getKey: (row) => row.roleCode || row.code,
    fields: [
      { name: "roleName", label: "Role name", required: true, read: (row) => row.roleName || row.name },
      { name: "roleCode", label: "Role code", required: true, read: (row) => row.roleCode || row.code },
      { name: "description", label: "Description", type: "textarea" },
      { name: "isActive", label: "Active", type: "checkbox", defaultValue: true, read: (row) => row.isActive ?? row.active },
    ],
    filters: [
      { name: "roleCode", label: "Code", value: (row) => row.roleCode || row.code },
      { name: "roleName", label: "Name", value: (row) => row.roleName || row.name },
    ],
    columns: [
      { label: "Code", value: (row) => row.roleCode || row.code },
      { label: "Role name", value: (row) => row.roleName || row.name },
      { label: "Description", value: (row) => row.description },
      { label: "Active", value: (row) => (row.isActive ?? row.active ? "Yes" : "No") },
    ],
  },
  {
    id: "access-levels",
    label: "Access Levels",
    singular: "Access level",
    plural: "Access levels",
    path: "access-levels",
    getKey: (row) => row.accessLevelCode || row.code,
    fields: [
      { name: "levelName", label: "Level name", required: true, read: (row) => row.levelName || row.name },
      { name: "accessLevelCode", label: "Level code", required: true, read: (row) => row.accessLevelCode || row.code },
      { name: "description", label: "Description", type: "textarea" },
    ],
    filters: [
      { name: "accessLevelCode", label: "Code", value: (row) => row.accessLevelCode || row.code },
      { name: "levelName", label: "Name", value: (row) => row.levelName || row.name },
    ],
    columns: [
      { label: "Code", value: (row) => row.accessLevelCode || row.code },
      { label: "Level name", value: (row) => row.levelName || row.name },
      { label: "Description", value: (row) => row.description },
    ],
  },
];

export default function Management() {
  const navigate = useNavigate();

  // FastAPI auth check: must be logged into main app first
  useEffect(() => {
    if (!getAuthToken()) {
      navigate("/");
    }
  }, [navigate]);

  const [hasToken, setHasToken] = useState(() => Boolean(getManagementToken()));
  const [activeTab, setActiveTab] = useState(MANAGEMENT_RESOURCES[0].id);

  // EMS login form state
  const [loginMode, setLoginMode] = useState("login");
  const [credentials, setCredentials] = useState({
    email: "string@string.com",
    password: "string",
    username: "",
    firstName: "",
    lastName: "",
    middleName: "",
    team_id: "",
    designation_id: "",
    manager_id: "",
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleFillDemo = () => {
    setCredentials((prev) => ({
      ...prev,
      email: "string@string.com",
      password: "string",
    }));
    setAuthError("");
  };

  const handleEmsAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      if (loginMode === "login") {
        const response = await managementLogin({
          email: credentials.email.trim(),
          password: credentials.password,
        });

        const token =
          response.data?.data?.token ||
          response.data?.token ||
          (typeof response.data === "string" ? response.data : null);

        if (!token) {
          throw new Error("Spring Boot did not return an authentication token.");
        }

        setManagementSession({
          token,
          user: { email: credentials.email.trim() },
        });

        setHasToken(true);
      } else {
        await managementSignup({
          username: credentials.username.trim(),
          email: credentials.email.trim(),
          password: credentials.password,
          firstName: credentials.firstName.trim() || "User",
          lastName: credentials.lastName.trim() || "Member",
          middleName: credentials.middleName.trim() || "",
          team_id: credentials.team_id.trim() || "default",
          designation_id: credentials.designation_id.trim() || "default",
          manager_id: credentials.manager_id.trim() || "default",
        });

        // Automatically log in after sign up
        const loginRes = await managementLogin({
          email: credentials.email.trim(),
          password: credentials.password,
        });

        const token = loginRes.data?.data?.token || loginRes.data?.token;
        if (token) {
          setManagementSession({
            token,
            user: { email: credentials.email.trim() },
          });
          setHasToken(true);
        }
      }
    } catch (err) {
      console.error(err);
      setAuthError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          err.message ||
          "Failed to authenticate with Railway Spring Boot server."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLockEms = () => {
    clearManagementSession();
    setHasToken(false);
  };

  const activeResource =
    MANAGEMENT_RESOURCES.find((r) => r.id === activeTab) ||
    MANAGEMENT_RESOURCES[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-900/5 dark:bg-slate-950/40 text-slate-900 dark:text-white transition-colors duration-300">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* If user is NOT logged into Spring Boot EMS, show Spring Boot Auth screen */}
        {!hasToken ? (
          <div className="max-w-md mx-auto my-8 sm:my-16 animate-rise">
            <div className="glass-card p-6 sm:p-9 border border-purple-500/30 dark:border-purple-500/20 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="text-center mb-6">
                <div className="w-13 h-13 rounded-2xl bg-purple-500/10 text-purple-700 dark:text-purple-400 flex items-center justify-center mx-auto mb-3.5 border border-purple-500/20">
                  <LockClosedIcon className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-950 dark:text-white">
                  EMS Authentication
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-mono font-medium">
                  {MANAGEMENT_API_URL.replace("https://", "")}
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 font-medium">
                  Accessing Option 3 (EMS) requires independent authentication with the Railway Spring Boot backend.
                </p>
              </div>

              {/* Demo Credentials Auto-Fill Pill */}
              <div className="mb-5 p-3 rounded-2xl glass-subtle flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <SparklesIcon className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <div className="font-mono text-[11px] leading-tight">
                    <span className="text-slate-500 dark:text-slate-400 font-sans">Demo:</span> string@string.com / string
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="px-2.5 py-1 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-700 dark:text-purple-400 font-bold text-[11px] transition-colors border border-purple-500/30"
                >
                  Auto-fill
                </button>
              </div>

              {/* Tabs */}
              <div className="grid grid-cols-2 p-1 rounded-2xl glass-subtle mb-5 gap-1">
                <button
                  type="button"
                  onClick={() => setLoginMode("login")}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    loginMode === "login"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                      : "text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
                  }`}
                >
                  Sign In to EMS
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMode("signup")}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    loginMode === "signup"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                      : "text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
                  }`}
                >
                  New EMS User
                </button>
              </div>

              {authError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold">
                  {authError}
                </div>
              )}

              <form onSubmit={handleEmsAuth} className="space-y-3.5">
                {loginMode === "signup" && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Username *
                      </label>
                      <input
                        type="text"
                        required
                        value={credentials.username}
                        onChange={(e) =>
                          setCredentials({ ...credentials, username: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                          First Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={credentials.firstName}
                          onChange={(e) =>
                            setCredentials({ ...credentials, firstName: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={credentials.lastName}
                          onChange={(e) =>
                            setCredentials({ ...credentials, lastName: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    EMS Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={credentials.email}
                    onChange={(e) =>
                      setCredentials({ ...credentials, email: e.target.value })
                    }
                    placeholder="string@string.com"
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={credentials.password}
                    onChange={(e) =>
                      setCredentials({ ...credentials, password: e.target.value })
                    }
                    placeholder="Enter password"
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  {authLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Verifying Spring Boot...</span>
                    </span>
                  ) : (
                    <>
                      <span>{loginMode === "login" ? "Authenticate with Railway" : "Create EMS Account"}</span>
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* User is authenticated to Spring Boot EMS */
          <div className="space-y-6 animate-fade">
            {/* EMS Top Bar */}
            <div className="p-4 sm:p-5 rounded-2xl glass-card border border-slate-300 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
                    <BuildingOffice2Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-extrabold text-slate-950 dark:text-white">
                      Employee Management System
                    </h1>
                    <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="font-mono font-medium">spring-boot-test-production-a0d6.up.railway.app</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleLockEms}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-subtle hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold transition-colors"
                  title="Locks EMS requiring login again"
                >
                  <LockClosedIcon className="w-3.5 h-3.5" />
                  <span>Lock EMS</span>
                </button>
              </div>
            </div>

            {/* Sub-navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl glass-card border border-slate-300 dark:border-white/10 overflow-x-auto scroll-area">
              {MANAGEMENT_RESOURCES.map((res) => {
                const active = res.id === activeTab;
                return (
                  <button
                    key={res.id}
                    onClick={() => setActiveTab(res.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      active
                        ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-[1.02]"
                        : "text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    {res.label}
                  </button>
                );
              })}
            </div>

            {/* Active Resource View */}
            <ManagementResource key={activeResource.id} resource={activeResource} />
          </div>
        )}
      </main>
    </div>
  );
}
