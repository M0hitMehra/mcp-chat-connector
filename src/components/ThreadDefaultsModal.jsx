const MODELS = [
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
];

export default function ThreadDefaultsModal({
  open,
  apiKey,
  setApiKey,
  model,
  setModel,
  onSave,
  onClose,
  saving = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <form
        onSubmit={(event) => { event.preventDefault(); onSave(); }}
        className="glass-panel-strong w-full max-w-md rounded-2xl p-6 shadow-2xl"
      >
        <h2 className="text-lg font-bold text-[var(--text)]">Thread settings</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Set the API key and model for this new thread.</p>
        <label className="mt-5 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Gemini API key
          <input
            autoFocus
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="Enter Gemini API key"
            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-3 text-sm normal-case text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
        </label>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Model
          <select
            value={model}
            onChange={(event) => setModel(event.target.value)}
            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-3 text-sm normal-case text-[var(--text)] outline-none focus:border-[var(--accent)]"
          >
            {MODELS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
        </label>
        <div className="mt-6 flex justify-end gap-2">
          {onClose && <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-[var(--text)]">Cancel</button>}
          <button disabled={saving || !apiKey.trim()} className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save and continue"}</button>
        </div>
      </form>
    </div>
  );
}
