import { KeyIcon, SparklesIcon, XMarkIcon } from "@heroicons/react/24/outline";

const MODELS = [
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite (Fastest)" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Balanced)" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro (Complex Reasoning)" },
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-fade">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
        className="glass-card w-full max-w-md p-6 sm:p-7 border border-white/20 dark:border-white/10 shadow-2xl animate-rise relative"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <KeyIcon className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Agent Configuration
            </h2>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Configure the Gemini API key and model parameters for this agent thread.
        </p>

        <div className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Gemini API Key *
            </label>
            <input
              autoFocus
              type="password"
              required
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Model
            </label>
            <select
              value={model}
              onChange={(event) => setModel(event.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
            >
              {MODELS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-white/10 flex justify-end gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl glass-subtle text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white/40"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={saving || !apiKey.trim()}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/30 disabled:opacity-50 transition-all"
          >
            {saving ? "Saving..." : "Save & Continue"}
          </button>
        </div>
      </form>
    </div>
  );
}
