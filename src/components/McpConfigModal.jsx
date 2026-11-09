import { useState, useEffect } from "react";
import {
  BoltIcon,
  CheckIcon,
  CpuChipIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  PlusIcon,
  ServerStackIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const PRESET_MCP_SERVERS = [
  {
    name: "Company Details MCP",
    url: "https://mcp-server-company-details.onrender.com/mcp",
    token: "",
  },
  {
    name: "Local Dev MCP",
    url: "http://localhost:8080/mcp",
    token: "",
  },
];

const MODEL_OPTIONS = [
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite (Fastest)" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Balanced)" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro (Complex Reasoning)" },
];

export default function McpConfigModal({
  isOpen,
  onClose,
  initialConfig = {},
  threadName = "Personalized Chat",
  apiKey = "",
  onSave,
  saving = false,
}) {
  const [draftThreadName, setDraftThreadName] = useState(threadName);
  const [draftApiKey, setDraftApiKey] = useState(apiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [draftModel, setDraftModel] = useState(
    initialConfig.model_name || MODEL_OPTIONS[0].id
  );
  const [mcpServers, setMcpServers] = useState(
    initialConfig.mcp_servers || []
  );

  useEffect(() => {
    if (isOpen) {
      setDraftThreadName(threadName || "Personalized Chat");
      setDraftApiKey(apiKey || "");
      setDraftModel(initialConfig.model_name || MODEL_OPTIONS[0].id);
      setMcpServers(initialConfig.mcp_servers || []);
    }
  }, [isOpen, initialConfig, threadName, apiKey]);

  if (!isOpen) return null;

  const handleAddServer = () => {
    setMcpServers((prev) => [
      ...prev,
      { name: "", url: "", token: "" },
    ]);
  };

  const handleAddPreset = (preset) => {
    if (mcpServers.some((s) => s.url === preset.url)) return;
    setMcpServers((prev) => [...prev, { ...preset }]);
  };

  const handleUpdateServer = (index, field, value) => {
    setMcpServers((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, [field]: value } : s))
    );
  };

  const handleRemoveServer = (index) => {
    setMcpServers((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      thread_name: draftThreadName.trim(),
      api_key: draftApiKey.trim(),
      model_name: draftModel,
      mcp_servers: mcpServers.filter((s) => s.name.trim() || s.url.trim()),
    });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-3 sm:p-5 backdrop-blur-md animate-fade">
      <div className="glass-card w-full max-w-2xl max-h-[92vh] flex flex-col border border-slate-300 dark:border-white/10 shadow-2xl animate-rise overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <ServerStackIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                MCP & Agent Configuration
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure tools, custom MCP servers, manual tokens & Gemini model
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto scroll-area p-4 sm:p-6 space-y-6">
          {/* General Thread Settings */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              General Agent Settings
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">
                  Chat Name
                </label>
                <input
                  type="text"
                  value={draftThreadName}
                  onChange={(e) => setDraftThreadName(e.target.value)}
                  placeholder="e.g. Market Research Chat"
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">
                  Gemini Model
                </label>
                <select
                  value={draftModel}
                  onChange={(e) => setDraftModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-medium"
                >
                  {MODEL_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">
                Gemini API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={draftApiKey}
                  onChange={(e) => setDraftApiKey(e.target.value)}
                  placeholder="AIzaSy... (saved in session)"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl glass-input text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showApiKey ? (
                    <EyeSlashIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* MCP Servers Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Custom MCP Servers ({mcpServers.length})
                  </h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    Tool Execution
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Connect MCP endpoints and pass custom authorization tokens manually.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddServer}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all shrink-0"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  <span>Add Server</span>
                </button>
              </div>
            </div>

            {/* Quick Presets Pill Bar */}
            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl glass-subtle text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-400 text-[11px]">
                Quick Presets:
              </span>
              {PRESET_MCP_SERVERS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleAddPreset(preset)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium text-[11px] hover:border-indigo-500 hover:text-indigo-600 transition-colors"
                >
                  + {preset.name}
                </button>
              ))}
            </div>

            {/* List of MCP Server rows */}
            {mcpServers.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                <BoltIcon className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  No MCP Servers Configured
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Click <strong>Add Server</strong> to manually enter an MCP server URL and token, or pick a Quick Preset above.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {mcpServers.map((server, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm space-y-2.5 animate-rise"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        Server #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveServer(index)}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Remove Server"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-300 mb-1">
                          Server Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={server.name}
                          onChange={(e) =>
                            handleUpdateServer(index, "name", e.target.value)
                          }
                          placeholder="e.g. Company Details MCP"
                          className="w-full px-3 py-2 rounded-xl glass-input text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-300 mb-1">
                          Server Endpoint URL *
                        </label>
                        <input
                          type="text"
                          required
                          value={server.url}
                          onChange={(e) =>
                            handleUpdateServer(index, "url", e.target.value)
                          }
                          placeholder="https://.../mcp or http://localhost:8080/mcp"
                          className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Manual Token / Auth Key Field */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-300 mb-1">
                        Manual Authorization Token / API Key (optional)
                      </label>
                      <input
                        type="password"
                        value={server.token || server.auth?.token || ""}
                        onChange={(e) =>
                          handleUpdateServer(index, "token", e.target.value)
                        }
                        placeholder="Bearer token or custom API key"
                        className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl glass-subtle text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/30 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
