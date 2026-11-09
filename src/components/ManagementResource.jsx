import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import {
  createManagementResource,
  deleteManagementResource,
  listManagementResource,
  updateManagementResource,
} from "../api/management";

const unwrap = (response) => response?.data?.data ?? response?.data ?? response;
const readRows = (response) => {
  const body = unwrap(response);
  return Array.isArray(body) ? body : body?.content || body?.items || body?.results || [];
};

const messageFrom = (error) => {
  const data = error?.response?.data;
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.detail === "string") return data.detail;
  if (Array.isArray(data?.errors)) {
    return data.errors.map((item) => item.defaultMessage || item.message).filter(Boolean).join(" · ");
  }
  return error?.message || "Operation failed. Please verify the input values.";
};

const display = (value) => {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return value.code || value.name || value.employeeCode || value.email || JSON.stringify(value);
  return String(value);
};

function initialDraft(resource) {
  return Object.fromEntries(
    resource.fields.map((field) => [
      field.name,
      field.defaultValue ?? (field.type === "checkbox" ? false : ""),
    ])
  );
}

function rowDraft(resource, row) {
  const draft = initialDraft(resource);
  resource.fields.forEach((field) => {
    if (field.createOnly) return;
    const value = field.read ? field.read(row) : row[field.name];
    if (field.type === "list") {
      draft[field.name] = Array.isArray(value) ? value.join(", ") : value || "";
    } else if (field.type === "checkbox") {
      draft[field.name] = Boolean(value);
    } else if (value != null) {
      draft[field.name] = String(value);
    }
  });
  return draft;
}

export default function ManagementResource({ resource }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState(() => initialDraft(resource));
  const [filters, setFilters] = useState(() =>
    Object.fromEntries((resource.filters || []).map((filter) => [filter.name, ""]))
  );

  const columns = useMemo(() => resource.columns, [resource]);

  const visibleRows = useMemo(() => {
    return rows.filter((row) => {
      const search = (filters.$search || "").trim().toLowerCase();
      const matchesSearch =
        !search ||
        columns.some((column) => display(column.value(row)).toLowerCase().includes(search));

      const matchesFilters = (resource.filters || []).every((filter) => {
        const selected = filters[filter.name] || "";
        if (!selected) return true;
        const value = String(filter.value(row) ?? "").toLowerCase();
        return value.includes(selected.toLowerCase());
      });

      return matchesSearch && matchesFilters;
    });
  }, [rows, resource, filters, columns]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await listManagementResource(resource.path);
      setRows(readRows(response));
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setLoading(false);
    }
  }, [resource]);

  useEffect(() => {
    let active = true;
    listManagementResource(resource.path)
      .then((response) => {
        if (active) setRows(readRows(response));
      })
      .catch((requestError) => {
        if (active) setError(messageFrom(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [resource]);

  const startCreate = () => {
    setEditing(null);
    setDraft(initialDraft(resource));
    setFormOpen(true);
    setError("");
    setSuccess("");
  };

  const startEdit = (row) => {
    setEditing(resource.getKey(row));
    setDraft(rowDraft(resource, row));
    setFormOpen(true);
    setError("");
    setSuccess("");
  };

  const cancelForm = () => {
    setFormOpen(false);
    setEditing(null);
    setDraft(initialDraft(resource));
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const payload = {};
      resource.fields.forEach((field) => {
        if (editing && field.createOnly) return;
        const value = draft[field.name];
        if (field.type === "list") {
          payload[field.name] = String(value || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        } else if (field.type === "checkbox") {
          payload[field.name] = Boolean(value);
        } else if (field.type === "number") {
          payload[field.name] = value === "" ? null : Number(value);
        } else {
          payload[field.name] = typeof value === "string" ? value.trim() : value;
        }
      });

      if (editing == null) {
        await createManagementResource(resource.path, payload);
      } else {
        await updateManagementResource(resource.path, editing, payload);
      }

      setSuccess(editing == null ? `${resource.singular} created successfully.` : `${resource.singular} updated.`);
      setEditing(null);
      setDraft(initialDraft(resource));
      setFormOpen(false);
      await reload();
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row) => {
    const code = resource.getKey(row);
    if (!window.confirm(`Are you sure you want to delete ${resource.singular.toLowerCase()} "${code}"?`)) {
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await deleteManagementResource(resource.path, code);
      setSuccess(`${resource.singular} deleted.`);
      if (editing === code) {
        setEditing(null);
        setDraft(initialDraft(resource));
        setFormOpen(false);
      }
      await reload();
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl glass-card border border-slate-300 dark:border-white/10 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">
              {resource.plural}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-500/25">
              {visibleRows.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Enterprise administration via Spring Boot Railway API
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reload}
            disabled={loading || busy}
            className="p-2.5 rounded-xl glass-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 disabled:opacity-50 transition-colors"
            title="Refresh List"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={startCreate}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add {resource.singular}</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center gap-2 animate-fade">
          <ExclamationCircleIcon className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade">
          <CheckCircleIcon className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Form Drawer / Modal */}
      {formOpen && (
        <form onSubmit={submit} className="p-6 rounded-2xl glass-card border border-indigo-500/40 animate-rise space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
            <h3 className="text-sm font-bold text-slate-950 dark:text-white">
              {editing == null
                ? `Create New ${resource.singular}`
                : `Edit ${resource.singular} · ${editing}`}
            </h3>
            <button
              type="button"
              onClick={cancelForm}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {resource.fields
              .filter((field) => !(editing != null && field.createOnly))
              .map((field) => {
                if (field.type === "select") {
                  return (
                    <div key={field.name}>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        {field.label} {field.required && "*"}
                      </label>
                      <select
                        required={field.required}
                        value={draft[field.name] ?? ""}
                        onChange={(e) => setDraft({ ...draft, [field.name]: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                      >
                        <option value="">Select...</option>
                        {field.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (field.type === "checkbox") {
                  return (
                    <div key={field.name} className="flex items-center gap-2 sm:pt-6">
                      <input
                        type="checkbox"
                        id={field.name}
                        checked={Boolean(draft[field.name])}
                        onChange={(e) => setDraft({ ...draft, [field.name]: e.target.checked })}
                        className="rounded accent-indigo-600 w-4 h-4"
                      />
                      <label htmlFor={field.name} className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {field.label}
                      </label>
                    </div>
                  );
                }

                if (field.type === "textarea") {
                  return (
                    <div key={field.name} className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                        {field.label} {field.required && "*"}
                      </label>
                      <textarea
                        required={field.required}
                        value={draft[field.name] ?? ""}
                        onChange={(e) => setDraft({ ...draft, [field.name]: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                      />
                    </div>
                  );
                }

                return (
                  <div key={field.name}>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      {field.label} {field.required && "*"}
                    </label>
                    <input
                      type={field.type === "list" ? "text" : field.type || "text"}
                      required={field.required}
                      value={draft[field.name] ?? ""}
                      onChange={(e) => setDraft({ ...draft, [field.name]: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                    />
                  </div>
                );
              })}
          </div>

          <div className="pt-3 flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={cancelForm}
              className="px-4 py-2 rounded-xl glass-subtle text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/25 disabled:opacity-50"
            >
              {busy ? "Saving..." : editing == null ? "Create Record" : "Save Changes"}
            </button>
          </div>
        </form>
      )}

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl glass-card border border-slate-300 dark:border-white/10 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.$search || ""}
            onChange={(e) => setFilters({ ...filters, $search: e.target.value })}
            placeholder={`Search across ${resource.plural.toLowerCase()}...`}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl glass-input text-xs"
          />
        </div>

        {resource.filters?.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {resource.filters.slice(0, 2).map((filter) => (
              <input
                key={filter.name}
                type="text"
                value={filters[filter.name] || ""}
                onChange={(e) => setFilters({ ...filters, [filter.name]: e.target.value })}
                placeholder={`Filter by ${filter.label}`}
                className="px-3 py-2 rounded-xl glass-input text-xs flex-1 md:w-36"
              />
            ))}
          </div>
        )}
      </div>

      {/* Records Table / Cards */}
      <div className="rounded-2xl glass-card border border-slate-300 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto scroll-area">
          <table className="w-full min-w-[650px] text-left text-xs border-collapse">
            <thead className="bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-400">
              <tr>
                {columns.map((column) => (
                  <th key={column.label} className="px-4 py-3 font-bold">
                    {column.label}
                  </th>
                ))}
                <th className="px-4 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-12 text-center text-slate-500">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                      <span>Loading {resource.plural}...</span>
                    </span>
                  </td>
                </tr>
              ) : visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-12 text-center text-slate-500 font-medium">
                    No matching {resource.plural.toLowerCase()} found.
                  </td>
                </tr>
              ) : (
                visibleRows.map((row) => {
                  const key = resource.getKey(row);
                  return (
                    <tr
                      key={key}
                      className="hover:bg-slate-100/70 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {columns.map((column) => (
                        <td key={column.label} className="px-4 py-3 text-slate-900 dark:text-slate-200 font-medium">
                          {display(column.value(row))}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEdit(row)}
                            className="p-1.5 rounded-lg glass-subtle hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-slate-700 dark:text-slate-300"
                            title="Edit"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(row)}
                            className="p-1.5 rounded-lg glass-subtle hover:text-rose-600 text-rose-500 transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
