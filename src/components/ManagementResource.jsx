import { useCallback, useEffect, useMemo, useState } from "react";
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
  if (Array.isArray(data?.errors)) return data.errors.map((item) => item.defaultMessage || item.message).filter(Boolean).join(" · ");
  return error?.message || "The request failed. Please review the fields and try again.";
};
const display = (value) => {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return value.code || value.name || value.employeeCode || value.email || JSON.stringify(value);
  return String(value);
};

function initialDraft(resource) {
  return Object.fromEntries(resource.fields.map((field) => [
    field.name,
    field.defaultValue ?? (field.type === "checkbox" ? false : ""),
  ]));
}

function rowDraft(resource, row) {
  const draft = initialDraft(resource);
  resource.fields.forEach((field) => {
    if (field.createOnly) return;
    const value = field.read ? field.read(row) : row[field.name];
    if (field.type === "list") draft[field.name] = Array.isArray(value) ? value.join(", ") : value || "";
    else if (field.type === "checkbox") draft[field.name] = Boolean(value);
    else if (value != null) draft[field.name] = String(value);
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
  const [filters, setFilters] = useState(() => Object.fromEntries((resource.filters || []).map((filter) => [filter.name, ""])));
  const columns = useMemo(() => resource.columns, [resource]);
  const visibleRows = useMemo(() => rows.filter((row) => {
    const search = (filters.$search || "").trim().toLowerCase();
    const matchesSearch = !search || columns.some((column) => display(column.value(row)).toLowerCase().includes(search));
    const matchesFilters = (resource.filters || []).every((filter) => {
      const selected = filters[filter.name] || "";
      if (!selected) return true;
      const value = String(filter.value(row) ?? "").toLowerCase();
      return value.includes(selected.toLowerCase());
    });
    return matchesSearch && matchesFilters;
  }), [rows, resource, filters, columns]);

  const reload = useCallback(async () => {
    setLoading(true); setError("");
    try { setRows(readRows(await listManagementResource(resource.path))); }
    catch (requestError) { setError(messageFrom(requestError)); }
    finally { setLoading(false); }
  }, [resource]);

  useEffect(() => {
    let active = true;
    listManagementResource(resource.path)
      .then((response) => { if (active) setRows(readRows(response)); })
      .catch((requestError) => { if (active) setError(messageFrom(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [resource]);

  const startCreate = () => {
    setEditing(null); setDraft(initialDraft(resource)); setFormOpen(true); setError(""); setSuccess("");
  };

  const startEdit = (row) => {
    setEditing(resource.getKey(row)); setDraft(rowDraft(resource, row)); setFormOpen(true); setError(""); setSuccess("");
  };

  const cancelForm = () => {
    setFormOpen(false); setEditing(null); setDraft(initialDraft(resource)); setError("");
  };

  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError(""); setSuccess("");
    try {
      const payload = {};
      resource.fields.forEach((field) => {
        if (editing && field.createOnly) return;
        const value = draft[field.name];
        if (field.type === "list") payload[field.name] = String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
        else if (field.type === "checkbox") payload[field.name] = Boolean(value);
        else payload[field.name] = typeof value === "string" ? value.trim() : value;
      });
      if (editing == null) await createManagementResource(resource.path, payload);
      else await updateManagementResource(resource.path, editing, payload);
      setSuccess(editing == null ? `${resource.singular} created.` : `${resource.singular} updated.`);
      setEditing(null); setDraft(initialDraft(resource)); setFormOpen(false);
      await reload();
    } catch (requestError) { setError(messageFrom(requestError)); }
    finally { setBusy(false); }
  };

  const remove = async (row) => {
    const code = resource.getKey(row);
    if (!window.confirm(`Delete ${resource.singular.toLowerCase()} “${code}”?`)) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      await deleteManagementResource(resource.path, code);
      setSuccess(`${resource.singular} deleted.`);
      if (editing === code) { setEditing(null); setDraft(initialDraft(resource)); setFormOpen(false); }
      await reload();
    } catch (requestError) { setError(messageFrom(requestError)); }
    finally { setBusy(false); }
  };

  return (
    <section className="glass-panel-strong rounded-2xl p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-bold text-[var(--text)]">{resource.plural}</h2><p className="text-xs text-[var(--muted)]">Create, edit, filter, and remove {resource.plural.toLowerCase()} using the management API.</p></div>
        <div className="flex gap-2"><button type="button" onClick={startCreate} className="rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-bold text-white">Add {resource.singular.toLowerCase()}</button><button type="button" onClick={reload} disabled={loading || busy} className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)] disabled:opacity-50">{loading ? "Refreshing…" : "Refresh"}</button></div>
      </div>

      {(error || success) && <p role={error ? "alert" : "status"} className={`mb-4 rounded-xl p-3 text-sm ${error ? "bg-[var(--danger-soft)] text-[var(--danger)]" : "bg-[var(--emerald-soft)] text-[var(--emerald)]"}`}>{error || success}</p>}

      {formOpen && <form onSubmit={submit} className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
        <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-bold text-[var(--text)]">{editing == null ? `Add ${resource.singular.toLowerCase()}` : `Edit ${resource.singular.toLowerCase()} · ${editing}`}</h3>{editing != null && <button type="button" onClick={startCreate} className="text-xs text-[var(--muted)] hover:text-[var(--text)]">Cancel edit</button>}</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {resource.fields.filter((field) => !(editing != null && field.createOnly)).map((field) => (
            field.type === "select" ? <label key={field.name} className="block text-xs font-semibold text-[var(--muted)]">{field.label}{field.required ? " *" : ""}<select required={field.required} value={draft[field.name] ?? ""} onChange={(event) => setDraft({ ...draft, [field.name]: event.target.value })} className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 text-sm text-[var(--text)]"><option value="">Select…</option>{field.options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
              : field.type === "checkbox" ? <label key={field.name} className="flex items-center gap-2 pt-6 text-xs font-semibold text-[var(--muted)]"><input type="checkbox" checked={Boolean(draft[field.name])} onChange={(event) => setDraft({ ...draft, [field.name]: event.target.checked })} className="accent-[var(--accent)]" />{field.label}</label>
                : field.type === "textarea" ? <label key={field.name} className="block text-xs font-semibold text-[var(--muted)] sm:col-span-2">{field.label}{field.required ? " *" : ""}<textarea required={field.required} maxLength={field.maxLength} value={draft[field.name] ?? ""} onChange={(event) => setDraft({ ...draft, [field.name]: event.target.value })} className="mt-1.5 min-h-20 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 text-sm text-[var(--text)]" /></label>
                  : <label key={field.name} className="block text-xs font-semibold text-[var(--muted)]">{field.label}{field.required ? " *" : ""}<input type={field.type === "list" ? "text" : field.type || "text"} required={field.required} maxLength={field.maxLength} pattern={field.pattern} title={field.title} value={draft[field.name] ?? ""} onChange={(event) => setDraft({ ...draft, [field.name]: event.target.value })} className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 text-sm text-[var(--text)]" /></label>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2"><button disabled={busy} className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{busy ? "Saving…" : editing == null ? `Create ${resource.singular.toLowerCase()}` : "Save changes"}</button><button type="button" disabled={busy} onClick={cancelForm} className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-xs text-[var(--text)] disabled:opacity-50">Cancel</button></div>
      </form>}

      {resource.filters?.length > 0 && <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="sm:col-span-2 lg:col-span-1"><label className="block text-xs font-semibold text-[var(--muted)]">Search all fields<input value={filters.$search || ""} onChange={(event) => setFilters({ ...filters, $search: event.target.value })} placeholder={`Search ${resource.plural.toLowerCase()}…`} className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 text-sm text-[var(--text)]" /></label></div>{resource.filters.map((filter) => <label key={filter.name} className="block text-xs font-semibold text-[var(--muted)]">{filter.label}<input value={filters[filter.name] || ""} onChange={(event) => setFilters({ ...filters, [filter.name]: event.target.value })} placeholder={`Filter by ${filter.label.toLowerCase()}`} className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 text-sm text-[var(--text)]" /></label>)}<p className="text-xs text-[var(--muted)] sm:col-span-2 lg:col-span-4">Showing {visibleRows.length} of {rows.length} loaded records.</p></div>}
      <div className="overflow-x-auto rounded-xl border border-[var(--border)]"><table className="w-full min-w-[700px] border-collapse text-left text-xs"><thead className="bg-[var(--panel-muted)] text-[var(--muted)]"><tr>{columns.map((column) => <th key={column.label} className="px-3 py-3 font-semibold">{column.label}</th>)}<th className="px-3 py-3 font-semibold">Actions</th></tr></thead><tbody className="divide-y divide-[var(--border)]">{loading ? <tr><td colSpan={columns.length + 1} className="p-6 text-center text-[var(--muted)]">Loading…</td></tr> : visibleRows.length ? visibleRows.map((row) => <tr key={resource.getKey(row)} className="text-[var(--text)]">{columns.map((column) => <td key={column.label} className="px-3 py-3">{display(column.value(row))}</td>)}<td className="px-3 py-3"><div className="flex gap-2"><button type="button" disabled={busy} onClick={() => startEdit(row)} className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 hover:border-[var(--accent)]">Edit</button><button type="button" disabled={busy} onClick={() => remove(row)} className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[var(--danger)]">Delete</button></div></td></tr>) : <tr><td colSpan={columns.length + 1} className="p-6 text-center text-[var(--muted)]">No matching {resource.plural.toLowerCase()}.</td></tr>}</tbody></table></div>
    </section>
  );
}
