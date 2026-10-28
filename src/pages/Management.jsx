import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
  BuildingOffice2Icon,
  BriefcaseIcon,
  KeyIcon,
  PlusIcon,
  RectangleGroupIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import {
  createCompany,
  deleteCompany,
  clearManagementSession,
  getCompany,
  getManagementToken,
  getCompanies,
  MANAGEMENT_API_URL,
  managementLogin,
  managementSignup,
  managementSignupWithRoles,
  setManagementSession,
  updateCompany,
} from "../api/management";
import useTheme from "../hooks/useTheme";
import ManagementResource from "../components/ManagementResource";

const initialAddress = { line1: "", line2: "", city: "", state: "", postalCode: "", country: "India" };
const initialCompany = {
  companyName: "", legalName: "", email: "", phone: "", gstin: "",
  registeredAddress: { ...initialAddress }, permanentAddress: { ...initialAddress },
};
const COMPANY_FIELDS = [
  ["Name", "name"], ["Code", "code"], ["Legal name", "legalName"],
  ["Email", "email"], ["Phone", "phone"], ["GSTIN", "gstin"], ["Status", "status"],
  ["Registered city", "registeredAddressCity"], ["Registered state", "registeredAddressState"],
  ["Registered country", "registeredAddressCountry"], ["Registered PIN", "registeredAddressPostalCode"],
];
const STATUS_OPTIONS = ["ACTIVE", "INACTIVE"];
const MANAGEMENT_RESOURCES = [
  {
    id: "branches", label: "Branches", singular: "Branch", plural: "Branches", path: "branches", getKey: (row) => row.code,
    fields: [
      { name: "code", label: "Branch code", required: true, createOnly: true },
      { name: "name", label: "Branch name", required: true },
      { name: "companyCode", label: "Company code", required: true, read: (row) => row.companyCode || row.company?.code },
      { name: "email", label: "Email", type: "email", maxLength: 150 },
      { name: "phone", label: "Phone", type: "tel", pattern: "[+]?[0-9]{7,15}", title: "Enter 7 to 15 digits, optionally starting with +" },
      { name: "managerCode", label: "Manager employee code", read: (row) => row.managerCode || row.manager?.employeeCode },
      { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS, defaultValue: "ACTIVE" },
    ],
    filters: [
      { name: "code", label: "Code", value: (row) => row.code },
      { name: "name", label: "Name", value: (row) => row.name },
      { name: "company", label: "Company code", value: (row) => row.company?.code || row.companyCode },
      { name: "status", label: "Status", value: (row) => row.status },
    ],
    columns: [
      { label: "Code", value: (row) => row.code }, { label: "Name", value: (row) => row.name },
      { label: "Company", value: (row) => row.company?.code || row.companyCode }, { label: "Email", value: (row) => row.email },
      { label: "Phone", value: (row) => row.phone }, { label: "Status", value: (row) => row.status },
    ],
  },
  {
    id: "departments", label: "Departments", singular: "Department", plural: "Departments", path: "departments", getKey: (row) => row.code,
    fields: [
      { name: "code", label: "Department code", required: true, createOnly: true },
      { name: "name", label: "Department name", required: true },
      { name: "branchCode", label: "Branch code", required: true, read: (row) => row.branchCode || row.branch?.code },
      { name: "description", label: "Description", type: "textarea" },
      { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS, defaultValue: "ACTIVE" },
    ],
    filters: [
      { name: "code", label: "Code", value: (row) => row.code },
      { name: "name", label: "Name", value: (row) => row.name },
      { name: "branch", label: "Branch code", value: (row) => row.branch?.code || row.branchCode },
      { name: "status", label: "Status", value: (row) => row.status },
    ],
    columns: [
      { label: "Code", value: (row) => row.code }, { label: "Name", value: (row) => row.name },
      { label: "Branch", value: (row) => row.branch?.code || row.branchCode }, { label: "Status", value: (row) => row.status },
    ],
  },
  {
    id: "teams", label: "Teams", singular: "Team", plural: "Teams", path: "teams", getKey: (row) => row.code,
    fields: [
      { name: "code", label: "Team code", required: true, createOnly: true },
      { name: "name", label: "Team name", required: true },
      { name: "departmentCode", label: "Department code", required: true, read: (row) => row.departmentCode || row.department?.code },
      { name: "description", label: "Description", type: "textarea" },
      { name: "leadCode", label: "Lead employee code", read: (row) => row.leadCode || row.lead?.employeeCode },
      { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS, defaultValue: "ACTIVE" },
    ],
    filters: [
      { name: "code", label: "Code", value: (row) => row.code },
      { name: "name", label: "Name", value: (row) => row.name },
      { name: "department", label: "Department code", value: (row) => row.department?.code || row.departmentCode },
      { name: "status", label: "Status", value: (row) => row.status },
    ],
    columns: [
      { label: "Code", value: (row) => row.code }, { label: "Name", value: (row) => row.name },
      { label: "Department", value: (row) => row.department?.code || row.departmentCode },
      { label: "Lead", value: (row) => row.lead?.employeeCode || row.leadCode }, { label: "Status", value: (row) => row.status },
    ],
  },
  {
    id: "employees", label: "Employees", singular: "Employee", plural: "Employees", path: "employees", getKey: (row) => row.employeeCode,
    fields: [
      { name: "employeeCode", label: "Employee code", required: true, createOnly: true },
      { name: "firstName", label: "First name", required: true }, { name: "middleName", label: "Middle name" },
      { name: "lastName", label: "Last name", required: true }, { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Phone", type: "tel", pattern: "[+]?[0-9]{7,15}", title: "Enter 7 to 15 digits, optionally starting with +" },
      { name: "teamCode", label: "Team code", read: (row) => row.teamCode || row.team_id },
      { name: "designation", label: "Designation" }, { name: "managerCode", label: "Manager employee code", read: (row) => row.managerCode || row.manager_id },
      { name: "password", label: "Initial password (optional)", type: "password", createOnly: true },
      { name: "status", label: "Employment status", type: "select", options: ["ACTIVE", "ON_LEAVE", "SUSPENDED", "RESIGNED", "TERMINATED"], defaultValue: "ACTIVE", read: (row) => row.status || row.employmentStatus },
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
      { label: "Email", value: (row) => row.email }, { label: "Team", value: (row) => row.team_id || row.teamCode },
      { label: "Designation", value: (row) => row.designation_id || row.designation },
      { label: "Status", value: (row) => row.employmentStatus || row.status },
    ],
  },
  {
    id: "roles", label: "Roles", singular: "Role", plural: "Roles", path: "roles", getKey: (row) => row.roleCode,
    fields: [
      { name: "roleCode", label: "Role code", required: true, createOnly: true },
      { name: "roleName", label: "Role name", required: true }, { name: "description", label: "Description", type: "textarea" },
      { name: "isActive", label: "Active", type: "checkbox", defaultValue: true },
    ],
    filters: [
      { name: "roleCode", label: "Role code", value: (row) => row.roleCode },
      { name: "roleName", label: "Role name", value: (row) => row.roleName },
      { name: "active", label: "Active", value: (row) => row.isActive ?? row.active },
    ],
    columns: [
      { label: "Code", value: (row) => row.roleCode }, { label: "Role", value: (row) => row.roleName },
      { label: "Description", value: (row) => row.description }, { label: "Active", value: (row) => row.isActive ?? row.active },
    ],
  },
  {
    id: "access-levels", label: "Access levels", singular: "Access level", plural: "Access levels", path: "access-levels", getKey: (row) => row.accessLevelCode,
    fields: [
      { name: "accessLevelCode", label: "Access level code", required: true, createOnly: true },
      { name: "accessLevel", label: "Access level name", required: true }, { name: "description", label: "Description", type: "textarea" },
      { name: "active", label: "Active", type: "checkbox", defaultValue: true },
    ],
    filters: [
      { name: "code", label: "Access code", value: (row) => row.accessLevelCode },
      { name: "name", label: "Access level", value: (row) => row.accessLevel },
      { name: "active", label: "Active", value: (row) => row.active },
    ],
    columns: [
      { label: "Code", value: (row) => row.accessLevelCode }, { label: "Access level", value: (row) => row.accessLevel },
      { label: "Description", value: (row) => row.description }, { label: "Active", value: (row) => row.active },
    ],
  },
];

const responseMessage = (error) =>
  error?.response?.data?.message || error?.response?.data?.detail || error?.message || "Request failed. Please try again.";
const unwrap = (payload) => payload?.data?.data ?? payload?.data ?? payload;

function normalizeCompanyPage(payload) {
  const body = unwrap(payload);
  const rows = Array.isArray(body) ? body : body?.content || body?.items || body?.companies || body?.results || [];
  return {
    rows,
    total: body?.totalElements ?? body?.total ?? rows.length,
    pages: body?.totalPages ?? 1,
    page: body?.number ?? body?.page ?? 0,
  };
}

function Field({ label, error, className = "", ...props }) {
  return (
    <label className={`block text-xs font-semibold text-[var(--muted)] ${className}`}>
      {label}
      <input {...props} className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]" />
      {error && <span className="mt-1 block font-normal text-[var(--danger)]">{error}</span>}
    </label>
  );
}

function AddressFields({ title, value, onChange, required = true, sourceAddress }) {
  const [sameAsSource, setSameAsSource] = useState(false);
  const labels = [["line1", "Address line 1"], ["line2", "Address line 2"], ["city", "City"], ["state", "State"], ["postalCode", "Postal code"], ["country", "Country"]];
  return (
    <fieldset className="rounded-2xl border border-[var(--border)] p-4">
      <legend className="px-2 text-xs font-bold text-[var(--text)]">{title}</legend>
      {sourceAddress && <label className="mb-3 flex w-fit items-center gap-2 text-xs font-medium text-[var(--muted)]"><input type="checkbox" checked={sameAsSource} onChange={(event) => { const checked = event.target.checked; setSameAsSource(checked); if (checked) onChange({ ...sourceAddress }); }} className="accent-[var(--accent)]" />Same as permanent address</label>}
      <div className="grid gap-3 sm:grid-cols-2">
        {labels.map(([key, label]) => (
          <Field key={key} label={`${label}${key === "line2" ? " (optional)" : required ? " *" : " (optional)"}`} value={value[key] || ""} required={required && key !== "line2"} maxLength={key === "line1" || key === "line2" ? 200 : 100} pattern={key === "postalCode" && (required || value.postalCode) ? "[1-9][0-9]{5}" : undefined} title={key === "postalCode" ? "Enter a 6-digit Indian PIN code" : undefined} onChange={(event) => { setSameAsSource(false); onChange({ ...value, [key]: event.target.value }); }} />
        ))}
      </div>
    </fieldset>
  );
}

export default function Management() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [token, setToken] = useState(getManagementToken);
  const [tab, setTab] = useState("companies");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [filters, setFilters] = useState({ name: "", code: "", legalName: "", email: "", phone: "", gstin: "", status: "" });
  const [companyPage, setCompanyPage] = useState({ rows: [], total: 0, pages: 1, page: 0 });
  const [page, setPage] = useState(0);
  const [companyBusy, setCompanyBusy] = useState(Boolean(token));
  const [companyError, setCompanyError] = useState("");
  const [companySuccess, setCompanySuccess] = useState("");
  const [companyEdit, setCompanyEdit] = useState(null);
  const [companyActionError, setCompanyActionError] = useState("");
  const [companyActionBusy, setCompanyActionBusy] = useState(false);
  const [company, setCompany] = useState(initialCompany);
  const [userForm, setUserForm] = useState({ username: "", password: "", firstName: "", middleName: "", lastName: "", team_id: "", designation_id: "", manager_id: "", email: "" });
  const [userMode, setUserMode] = useState("signup");
  const [roles, setRoles] = useState("ROLE_USER");
  const [userBusy, setUserBusy] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const [userError, setUserError] = useState("");

  const loadCompanies = useCallback(async (nextPage = 0, nextFilters) => {
    setCompanyBusy(true); setCompanyError("");
    try {
      const params = Object.fromEntries(Object.entries(nextFilters || {}).filter(([, value]) => value.trim()));
      params.page = nextPage; params.size = 10;
      const response = await getCompanies(params);
      setCompanyPage(normalizeCompanyPage(response)); setPage(nextPage);
    } catch (error) { setCompanyError(responseMessage(error)); }
    finally { setCompanyBusy(false); }
  }, []);

  const signInToManagement = async (event) => {
    event.preventDefault(); setLoginError(""); setLoginBusy(true);
    try {
      const response = await managementLogin({ email: loginEmail.trim(), password: loginPassword });
      const tokenValue = response?.data?.token || response?.data?.data?.token;
      if (!tokenValue) throw new Error("The management API did not return an authentication token.");
      setManagementSession({
        token: tokenValue,
        user: response?.data?.user || response?.data?.data?.user || { email: loginEmail.trim() },
      });
      setToken(tokenValue);
      setLoginPassword("");
    } catch (error) { setLoginError(responseMessage(error)); }
    finally { setLoginBusy(false); }
  };

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    getCompanies({ page: 0, size: 10 })
      .then((response) => { if (!cancelled) { setCompanyPage(normalizeCompanyPage(response)); setPage(0); } })
      .catch((error) => { if (!cancelled) setCompanyError(responseMessage(error)); })
      .finally(() => { if (!cancelled) setCompanyBusy(false); });
    return () => { cancelled = true; };
  }, [token]);

  const submitCompany = async (event) => {
    event.preventDefault(); setCompanyError(""); setCompanySuccess(""); setCompanyBusy(true);
    try {
      const payload = { ...company, companyName: company.companyName.trim(), legalName: company.legalName.trim(), email: company.email.trim(), phone: company.phone.trim(), gstin: company.gstin.trim().toUpperCase() };
      for (const key of ["officeAddress", "currentAddress"]) {
        if (Object.values(payload[key]).every((value) => !String(value || "").trim())) delete payload[key];
      }
      const response = await createCompany(payload);
      setCompanySuccess(response?.data?.message || "Company created successfully."); setCompany(initialCompany); setTab("companies"); await loadCompanies(0, filters);
    } catch (error) { setCompanyError(responseMessage(error)); }
    finally { setCompanyBusy(false); }
  };

  const beginCompanyEdit = async (row) => {
    setCompanyActionError(""); setCompanyActionBusy(true);
    try {
      const details = unwrap(await getCompany(row.code));
      setCompanyEdit({
        code: details.code || row.code,
        name: details.name || details.companyName || row.companyName || row.name || "",
        legalName: details.legalName || "", email: details.email || "",
        phone: details.phone || "", gstin: details.gstin || "",
        status: details.status || "ACTIVE",
      });
    } catch (error) { setCompanyActionError(responseMessage(error)); }
    finally { setCompanyActionBusy(false); }
  };

  const saveCompanyEdit = async (event) => {
    event.preventDefault(); if (!companyEdit) return;
    setCompanyActionBusy(true); setCompanyActionError("");
    try {
      const { code, ...payload } = companyEdit;
      await updateCompany(code, { ...payload, gstin: payload.gstin.toUpperCase() });
      setCompanyEdit(null); setCompanySuccess("Company updated successfully.");
      await loadCompanies(page, filters);
    } catch (error) { setCompanyActionError(responseMessage(error)); }
    finally { setCompanyActionBusy(false); }
  };

  const removeCompany = async (row) => {
    if (!window.confirm(`Delete company “${row.companyName || row.name || row.code}”?`)) return;
    setCompanyActionBusy(true); setCompanyActionError("");
    try {
      await deleteCompany(row.code); setCompanySuccess("Company deleted successfully.");
      await loadCompanies(page, filters);
    } catch (error) { setCompanyActionError(responseMessage(error)); }
    finally { setCompanyActionBusy(false); }
  };

  const submitUser = async (event) => {
    event.preventDefault(); setUserError(""); setUserMessage(""); setUserBusy(true);
    try {
      const payload = userMode === "roles"
        ? { username: userForm.username.trim(), password: userForm.password, email: userForm.email.trim(), roles: roles.split(",").map((role) => role.trim()).filter(Boolean) }
        : { ...userForm, username: userForm.username.trim(), email: userForm.email.trim() };
      const response = userMode === "roles" ? await managementSignupWithRoles(payload) : await managementSignup(payload);
      setUserMessage(response?.data?.message || "User created successfully."); setUserForm({ username: "", password: "", firstName: "", middleName: "", lastName: "", team_id: "", designation_id: "", manager_id: "", email: "" });
    } catch (error) { setUserError(responseMessage(error)); }
    finally { setUserBusy(false); }
  };

  const logout = () => { clearManagementSession(); setToken(""); };
  const pages = Math.max(1, Number(companyPage.pages) || 1);
  const visibleTabs = useMemo(() => [
    { id: "companies", label: "Companies", icon: BuildingOffice2Icon },
    { id: "add-company", label: "Add company", icon: PlusIcon },
    ...MANAGEMENT_RESOURCES.map((resource) => ({
      id: resource.id,
      label: resource.label,
      icon: {
        branches: BuildingOffice2Icon,
        departments: BriefcaseIcon,
        teams: RectangleGroupIcon,
        employees: UserGroupIcon,
        roles: KeyIcon,
        "access-levels": AdjustmentsHorizontalIcon,
      }[resource.id],
    })),
    { id: "users", label: "Users", icon: UserPlusIcon },
  ], []);

  if (!token) {
    return (
      <main className="app-surface flex h-screen items-center justify-center overflow-y-auto px-4 py-6">
        <div className="glass-panel-strong w-full max-w-md rounded-3xl p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)] text-white"><ShieldCheckIcon className="h-6 w-6" /></span>
              <div><div className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">Separate management access</div><h1 className="text-xl font-bold text-[var(--text)]">Sign in to Manage</h1></div>
            </div>
            <button onClick={() => navigate("/chat")} className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)]">Back to chat</button>
          </div>
          <p className="mb-5 text-sm text-[var(--muted)]">Use your management account credentials. Management access has its own session, separate from chat.</p>
          {loginError && <p role="alert" className="mb-4 rounded-xl bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">{loginError}</p>}
          <form onSubmit={signInToManagement} className="space-y-4">
            <Field label="Management email" type="email" autoComplete="username" required value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} />
            <Field label="Management password" type="password" autoComplete="current-password" required value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} />
            <button disabled={loginBusy} className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{loginBusy ? "Signing in…" : "Sign in to management"}</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="app-surface h-screen overflow-y-auto px-4 py-5 sm:px-7">
      <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)] text-white"><ShieldCheckIcon className="h-6 w-6" /></span>
            <div><div className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">Management console</div><h1 className="text-xl font-bold text-[var(--text)]">Manage companies and users</h1></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("/chat")} className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)]"><ArrowLeftIcon className="mr-1 inline h-4 w-4" />Chat</button>
            <button onClick={toggleTheme} className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)]">{isDark ? "Light" : "Dark"}</button>
            {token && <button onClick={logout} className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)]">Sign out</button>}
          </div>
        </header>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-xs text-[var(--muted)]">
          <span>API: <span className="font-mono text-[var(--text)]">{MANAGEMENT_API_URL}</span></span>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {visibleTabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setTab(id); setCompanyError(""); setCompanySuccess(""); setUserError(""); setUserMessage(""); }} className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold ${tab === id ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--border)] bg-[var(--panel)] text-[var(--muted)]"}`}><Icon className="h-4 w-4" />{label}</button>)}
        </div>

        {tab === "companies" && <section className="glass-panel-strong rounded-2xl p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-[var(--text)]">Company directory</h2><p className="text-xs text-[var(--muted)]">{companyPage.total} matching companies</p></div><button onClick={() => loadCompanies(page, filters)} disabled={companyBusy} className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)] disabled:opacity-60"><ArrowPathIcon className={`h-4 w-4 ${companyBusy ? "animate-spin" : ""}`} />Refresh</button></div>
          <form className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(event) => { event.preventDefault(); loadCompanies(0, filters); }}>
            {COMPANY_FIELDS.map(([label, key]) => key === "status" ? <label key={key} className="text-xs font-semibold text-[var(--muted)]">Status<select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 text-sm text-[var(--text)]"><option value="">Any status</option><option>ACTIVE</option><option>INACTIVE</option></select></label> : <Field key={key} label={label} value={filters[key]} onChange={(event) => setFilters({ ...filters, [key]: event.target.value })} />)}
            <div className="flex items-end gap-2"><button className="h-[42px] rounded-xl bg-[var(--accent)] px-4 text-xs font-bold text-white">Search</button><button type="button" onClick={() => { const reset = { name: "", code: "", legalName: "", email: "", phone: "", gstin: "", status: "" }; setFilters(reset); loadCompanies(0, reset); }} className="h-[42px] rounded-xl border border-[var(--border)] px-4 text-xs text-[var(--text)]">Clear</button></div>
          </form>
          {companyError && <p role="alert" className="mb-3 rounded-xl bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">{companyError}</p>}
          {companySuccess && <p role="status" className="mb-3 rounded-xl bg-[var(--emerald-soft)] p-3 text-sm text-[var(--emerald)]">{companySuccess}</p>}
          {companyActionError && <p role="alert" className="mb-3 rounded-xl bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">{companyActionError}</p>}
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]"><table className="w-full min-w-[820px] border-collapse text-left text-xs"><thead className="bg-[var(--panel-muted)] text-[var(--muted)]"><tr>{["Company", "Code", "Legal name", "Email", "Phone", "GSTIN", "Status", "Actions"].map((item) => <th key={item} className="px-3 py-3 font-semibold">{item}</th>)}</tr></thead><tbody className="divide-y divide-[var(--border)]">{companyBusy ? <tr><td colSpan="8" className="p-6 text-center text-[var(--muted)]">Loading companies…</td></tr> : companyPage.rows.length ? companyPage.rows.map((row, index) => <tr key={row.id || row.code || `${row.companyName}-${index}`} className="text-[var(--text)]"><td className="px-3 py-3 font-semibold">{row.companyName || row.name || "—"}</td><td className="px-3 py-3">{row.code || "—"}</td><td className="px-3 py-3">{row.legalName || "—"}</td><td className="px-3 py-3">{row.email || "—"}</td><td className="px-3 py-3">{row.phone || "—"}</td><td className="px-3 py-3 font-mono">{row.gstin || "—"}</td><td className="px-3 py-3">{row.status || "—"}</td><td className="px-3 py-3"><div className="flex gap-2"><button type="button" disabled={companyActionBusy} onClick={() => beginCompanyEdit(row)} className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 hover:border-[var(--accent)]">Edit</button><button type="button" disabled={companyActionBusy} onClick={() => removeCompany(row)} className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[var(--danger)]">Delete</button></div></td></tr>) : <tr><td colSpan="8" className="p-6 text-center text-[var(--muted)]">No companies found.</td></tr>}</tbody></table></div>
          <div className="mt-4 flex items-center justify-between text-xs text-[var(--muted)]"><span>Page {page + 1} of {pages}</span><div className="flex gap-2"><button disabled={page <= 0 || companyBusy} onClick={() => loadCompanies(page - 1, filters)} className="rounded-lg border border-[var(--border)] px-3 py-2 disabled:opacity-40">Previous</button><button disabled={page + 1 >= pages || companyBusy} onClick={() => loadCompanies(page + 1, filters)} className="rounded-lg border border-[var(--border)] px-3 py-2 disabled:opacity-40">Next</button></div></div>
        </section>}

        {tab === "add-company" && <section className="glass-panel-strong rounded-2xl p-4 sm:p-6"><h2 className="text-lg font-bold text-[var(--text)]">Register a company</h2><p className="mb-5 text-xs text-[var(--muted)]">Fields marked * are required. Address PIN codes must contain six digits.</p>
          {companyError && <p role="alert" className="mb-3 rounded-xl bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">{companyError}</p>}
          <form onSubmit={submitCompany} className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Field label="Company name *" required minLength={2} maxLength={150} pattern="[A-Za-z0-9 .,&'()\\-]+" value={company.companyName} onChange={(e) => setCompany({ ...company, companyName: e.target.value })} /><Field label="Legal name *" required minLength={2} maxLength={200} pattern="[A-Za-z0-9 .,&'()\\-]+" value={company.legalName} onChange={(e) => setCompany({ ...company, legalName: e.target.value })} /><Field label="Contact email *" type="email" required maxLength={150} value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} /><Field label="Phone *" type="tel" inputMode="tel" autoComplete="tel-national" required pattern="[+]?[0-9]{7,15}" title="Enter 7 to 15 digits, with an optional + prefix (for example 9582809021 or +919582809021)" value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} /><Field label="GSTIN *" required minLength={15} maxLength={15} pattern="[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z][1-9A-Za-z]Z[0-9A-Za-z]" title="Enter a valid 15-character GSTIN" value={company.gstin} onChange={(e) => setCompany({ ...company, gstin: e.target.value.toUpperCase() })} /></div>
            <AddressFields key={`registered-${companySuccess}`} title="Registered address" value={company.registeredAddress} sourceAddress={company.permanentAddress} onChange={(value) => setCompany({ ...company, registeredAddress: value })} />
            <AddressFields title="Permanent address" value={company.permanentAddress} onChange={(value) => setCompany({ ...company, permanentAddress: value })} />
            <AddressFields key={`office-${companySuccess}`} title="Office address (optional)" required={false} sourceAddress={company.permanentAddress} value={company.officeAddress || initialAddress} onChange={(value) => setCompany({ ...company, officeAddress: value })} />
            <AddressFields key={`current-${companySuccess}`} title="Current address (optional)" required={false} sourceAddress={company.permanentAddress} value={company.currentAddress || initialAddress} onChange={(value) => setCompany({ ...company, currentAddress: value })} />
            <div className="flex flex-wrap gap-2"><button disabled={companyBusy} className="rounded-xl bg-[var(--accent)] px-5 py-3 text-xs font-bold text-white disabled:opacity-60">{companyBusy ? "Creating…" : "Create company"}</button><button type="button" disabled={companyBusy} onClick={() => { setCompany(initialCompany); setCompanyError(""); setTab("companies"); }} className="rounded-xl border border-[var(--border)] px-5 py-3 text-xs text-[var(--text)] disabled:opacity-50">Cancel</button></div>
          </form>
        </section>}

        {MANAGEMENT_RESOURCES.map((resource) => tab === resource.id && <ManagementResource key={resource.id} resource={resource} />)}

        {tab === "users" && <section className="glass-panel-strong rounded-2xl p-4 sm:p-6"><h2 className="text-lg font-bold text-[var(--text)]">User registration</h2><p className="mb-4 text-xs text-[var(--muted)]">The standard signup endpoint requires team, designation, and manager IDs. Role-based signup is restricted by the API to administrators.</p>
          <>
            <div className="mb-4 inline-flex rounded-xl border border-[var(--border)] p-1"><button onClick={() => setUserMode("signup")} className={`rounded-lg px-3 py-2 text-xs ${userMode === "signup" ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--muted)]"}`}>Standard signup</button><button onClick={() => setUserMode("roles")} className={`rounded-lg px-3 py-2 text-xs ${userMode === "roles" ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--muted)]"}`}>Signup with roles (admin)</button></div>
            {userError && <p role="alert" className="mb-3 rounded-xl bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">{userError}</p>}{userMessage && <p role="status" className="mb-3 rounded-xl bg-[var(--emerald-soft)] p-3 text-sm text-[var(--emerald)]">{userMessage}</p>}
            <form onSubmit={submitUser} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Field label="Username *" required value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} /><Field label="Email *" type="email" required value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} /><Field label="Password *" type="password" required autoComplete="new-password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />{userMode === "signup" && <>{[["firstName", "First name"], ["middleName", "Middle name"], ["lastName", "Last name"], ["team_id", "Team ID"], ["designation_id", "Designation ID"], ["manager_id", "Manager ID"]].map(([key, label]) => <Field key={key} label={`${label} *`} required value={userForm[key]} onChange={(e) => setUserForm({ ...userForm, [key]: e.target.value })} />)}</>}{userMode === "roles" && <Field className="sm:col-span-2" label="Roles (comma-separated, e.g. ROLE_USER) *" required value={roles} onChange={(e) => setRoles(e.target.value)} />}</div><button disabled={userBusy} className="rounded-xl bg-[var(--accent)] px-5 py-3 text-xs font-bold text-white disabled:opacity-60">{userBusy ? "Creating user…" : "Create user"}</button></form>
          </>
        </section>}
        {companyEdit && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"><form onSubmit={saveCompanyEdit} className="glass-panel-strong my-auto w-full max-w-2xl rounded-2xl p-5 sm:p-6"><div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-[var(--text)]">Edit company</h2><p className="text-xs text-[var(--muted)]">Company code: {companyEdit.code}</p></div><button type="button" onClick={() => setCompanyEdit(null)} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text)]">Close</button></div>{companyActionError && <p role="alert" className="mb-3 rounded-xl bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">{companyActionError}</p>}<div className="grid gap-3 sm:grid-cols-2"><Field label="Company name" required minLength={2} maxLength={150} pattern="[A-Za-z0-9 .,&'()\\-]+" value={companyEdit.name} onChange={(event) => setCompanyEdit({ ...companyEdit, name: event.target.value })} /><Field label="Legal name" maxLength={200} pattern="[A-Za-z0-9 .,&'()\\-]+" value={companyEdit.legalName} onChange={(event) => setCompanyEdit({ ...companyEdit, legalName: event.target.value })} /><Field label="Email" type="email" maxLength={150} value={companyEdit.email} onChange={(event) => setCompanyEdit({ ...companyEdit, email: event.target.value })} /><Field label="Phone" type="tel" pattern="[+]?[0-9]{7,15}" title="Enter 7 to 15 digits, optionally starting with +" value={companyEdit.phone} onChange={(event) => setCompanyEdit({ ...companyEdit, phone: event.target.value })} /><Field label="GSTIN" minLength={15} maxLength={15} pattern="[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z][1-9A-Za-z]Z[0-9A-Za-z]" value={companyEdit.gstin} onChange={(event) => setCompanyEdit({ ...companyEdit, gstin: event.target.value.toUpperCase() })} /><label className="block text-xs font-semibold text-[var(--muted)]">Status<select required value={companyEdit.status} onChange={(event) => setCompanyEdit({ ...companyEdit, status: event.target.value })} className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 text-sm text-[var(--text)]"><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option></select></label></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setCompanyEdit(null)} className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-xs text-[var(--text)]">Cancel</button><button disabled={companyActionBusy} className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{companyActionBusy ? "Saving…" : "Save changes"}</button></div></form></div>}
        <footer className="mt-auto py-5 text-center text-[10px] text-[var(--faint)]">Management API · Company listing supports search and pagination · Forms validate before submission</footer>
      </div>
    </main>
  );
}
