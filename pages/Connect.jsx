import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BoltIcon,
  CheckBadgeIcon,
  CpuChipIcon,
  EyeIcon,
  EyeSlashIcon,
  GlobeAltIcon,
  KeyIcon,
  MoonIcon,
  PlusIcon,
  ServerStackIcon,
  SparklesIcon,
  SunIcon,
  TrashIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

import {
  clearAuthSession,
  connectAgent,
  createThread,
  getAuthToken,
  listSessions,
} from "../api/chat";
import useTheme from "../hooks/useTheme";

const PRESET_MCP_SERVERS = [
  {
    name: "Company Details MCP",
    url: "https://mcp-server-company-details.onrender.com/mcp",
    description: "Fetches company intelligence, market specs & metrics",
    tag: "Recommended",
  },
  {
    name: "Local/Custom MCP",
    url: "http://localhost:8080/mcp",
    description: "Connect to your local dev environment MCP endpoint",
    tag: "Developer",
  },
];

const MODEL_CARDS = [
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash Lite",
    badge: "Fastest",
    speed: "⚡ Ultra Fast",
    description: "Lightweight, optimized for high throughput & instant streaming responses.",
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    badge: "Balanced",
    speed: "🚀 Fast & Smart",
    description: "Balanced speed with enhanced function calling capability for complex tools.",
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    badge: "High Reasoning",
    speed: "🧠 Deep Reasoning",
    description: "Top-tier intelligence for high-complexity analytical and coding queries.",
  },
];

const loadSavedServers = () => {
  const savedServers = localStorage.getItem("mcp_server_presets");
  if (!savedServers) {
    return [
      {
        name: PRESET_MCP_SERVERS[0].name,
        url: PRESET_MCP_SERVERS[0].url,
      },
    ];
  }

  try {
    const parsed = JSON.parse(savedServers);
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : [{ name: PRESET_MCP_SERVERS[0].name, url: PRESET_MCP_SERVERS[0].url }];
  } catch {
    return [{ name: PRESET_MCP_SERVERS[0].name, url: PRESET_MCP_SERVERS[0].url }];
  }
};

export default function Connect() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [apiKey, setApiKey] = useState(sessionStorage.getItem("mcp_api_key") || "");
  const [model, setModel] = useState(
    localStorage.getItem("mcp_model") || MODEL_CARDS[0].id
  );
  const [mcpServers, setMcpServers] = useState(loadSavedServers);
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [existingSessions, setExistingSessions] = useState([]);
  const [selectedExistingSession, setSelectedExistingSession] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    if (!getAuthToken()) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem("mcp_model", model);
  }, [model]);

  useEffect(() => {
    localStorage.setItem("mcp_server_presets", JSON.stringify(mcpServers));
  }, [mcpServers]);

  const fetchUserSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await listSessions();
      setExistingSessions(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load existing sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchUserSessions();
  }, []);

  const addMcpServer = () => {
    setMcpServers((current) => [
      ...current,
      { name: "", url: "" },
    ]);
  };

  const addPresetServer = (preset) => {
    const exists = mcpServers.some((s) => s.url.trim() === preset.url);
    if (exists) return;
    setMcpServers((current) => [
      ...current,
      { name: preset.name, url: preset.url },
    ]);
  };

  const removeMcpServer = (index) => {
    setMcpServers((current) => current.filter((_, i) => i !== index));
  };

  const updateMcpServer = (index, field, value) => {
    setMcpServers((current) =>
      current.map((server, i) =>
        i === index ? { ...server, [field]: value } : server
      )
    );
  };

  const validate = () => {
    if (!apiKey.trim()) {
      return "Gemini API key is required to initiate thread.";
    }

    if (!model.trim()) {
      return "Please select a Gemini model.";
    }

    const activeServers = mcpServers.filter(
      (server) => server.name.trim() || server.url.trim()
    );

    if (activeServers.length === 0) {
      return "Please configure at least one MCP server.";
    }

    for (let i = 0; i < activeServers.length; i += 1) {
      const s = activeServers[i];
      if (!s.name.trim()) return `MCP server ${i + 1} requires a descriptive name.`;
      if (!s.url.trim()) return `MCP server ${i + 1} requires a valid URL.`;
      try {
        new URL(s.url.trim());
      } catch {
        return `MCP server ${i + 1} has an invalid URL format.`;
      }
    }

    return null;
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate("/");
  };

  const handleConnect = async (event) => {
    event.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const activeServers = mcpServers
        .filter((server) => server.name.trim() || server.url.trim())
        .map((server) => ({
          name: server.name.trim(),
          url: server.url.trim(),
        }));

      let sessionId = selectedExistingSession;

      // If no existing session chosen, spawn a new one via backend POST /connect
      if (!sessionId) {
        const sessionResponse = await connectAgent();
        sessionId = sessionResponse.data?.session_id;

        if (!sessionId) {
          throw new Error("Backend did not return a session ID.");
        }
      }

      // Create thread via backend POST /threads
      const threadResponse = await createThread({
        session_id: sessionId,
        model_name: model,
        apiKey: apiKey.trim(),
        mcp_servers: activeServers,
      });

      const threadId = threadResponse.data?.thread_id;
      if (!threadId) {
        throw new Error("Backend did not return a thread ID.");
      }

      localStorage.setItem("mcp_session_id", sessionId);
      localStorage.setItem("mcp_thread_id", threadId);
      localStorage.setItem(
        "mcp_thread_name",
        threadResponse.data?.thread_name || "New Chat"
      );
      localStorage.setItem(
        "mcp_thread_config",
        JSON.stringify({
          model_name: model,
          mcp_servers: activeServers,
        })
      );
      sessionStorage.setItem("mcp_api_key", apiKey.trim());

      navigate("/chat");
    } catch (connectError) {
      console.error(connectError);
      setError(
        connectError.response?.data?.message ||
          connectError.response?.data?.detail ||
          connectError.message ||
          "Failed to establish MCP thread configuration."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-surface flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-6 lg:grid lg:grid-cols-[0.88fr_1.12fr] lg:items-start lg:gap-10">
        
        {/* Left Side: Overview & Active Sessions */}
        <section className="animate-rise space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--app-bg)] shadow-md">
                <ServerStackIcon className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">
                  Step 2 • Configuration
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">
                  Workspace Setup
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                title="Toggle theme"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--text)]"
              >
                {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                title="Sign out"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] text-[var(--danger)] transition hover:bg-red-500/10"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Preset Library Card */}
          <div className="glass-panel rounded-2xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                <SparklesIcon className="h-4 w-4 text-[var(--accent)]" />
                MCP Server Presets
              </h2>
              <span className="text-[11px] text-[var(--faint)]">1-Click Add</span>
            </div>

            <div className="space-y-2.5">
              {PRESET_MCP_SERVERS.map((preset) => (
                <div
                  key={preset.url}
                  className="soft-panel flex items-center justify-between gap-3 rounded-xl p-3 transition hover:border-[var(--accent-border)]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs font-semibold text-[var(--text)]">{preset.name}</span>
                      <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[9px] font-bold text-[var(--accent)]">
                        {preset.tag}
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-[var(--muted)]">{preset.description}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => addPresetServer(preset)}
                    className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-[var(--accent-soft)] px-3 text-xs font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-[var(--app-bg)]"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Active Sessions Quick Picker */}
          <div className="glass-panel rounded-2xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                <GlobeAltIcon className="h-4 w-4 text-[var(--emerald)]" />
                Backend Sessions
              </h2>
              <button
                type="button"
                onClick={fetchUserSessions}
                className="text-[11px] text-[var(--accent)] hover:underline"
              >
                {loadingSessions ? <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" /> : "Refresh"}
              </button>
            </div>

            {existingSessions.length > 0 ? (
              <div className="space-y-2">
                <label className="block text-[11px] text-[var(--muted)]">
                  Pick an existing backend session or spawn a new one:
                </label>
                <select
                  value={selectedExistingSession}
                  onChange={(e) => setSelectedExistingSession(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 text-xs text-[var(--text)] outline-none font-mono"
                >
                  <option value="">✨ Generate fresh high-performance session</option>
                  {existingSessions.map((s) => (
                    <option key={s.session_id || s._id} value={s.session_id}>
                      Reuse Session: {s.session_id}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-xs text-[var(--muted)]">
                No prior session documents found. A new session will automatically be instantiated on submission.
              </p>
            )}
          </div>
        </section>

        {/* Right Side: Setup Form */}
        <form
          onSubmit={handleConnect}
          className="glass-panel-strong animate-scale rounded-2xl p-6 sm:p-8"
        >
          <h2 className="mb-5 text-lg font-bold tracking-tight text-[var(--text)]">
            Configure Gemini & MCP Servers
          </h2>

          <div className="space-y-5">
            {/* Gemini API Key */}
            <div>
              <label className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                <span className="flex items-center gap-1.5">
                  <KeyIcon className="h-4 w-4 text-[var(--accent)]" />
                  Gemini API Key
                </span>
                <span className="text-[10px] text-[var(--faint)]">Stored locally</span>
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 pr-12 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)]"
                >
                  {showApiKey ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Model Selection Cards */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Select Gemini Model
              </label>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {MODEL_CARDS.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setModel(card.id)}
                    className={`flex flex-col justify-between rounded-xl border p-3 text-left transition ${
                      model === card.id
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-2 ring-[var(--accent-soft)]"
                        : "border-[var(--border)] bg-[var(--panel-strong)] hover:border-[var(--accent-border)]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-[var(--text)]">{card.badge}</span>
                        {model === card.id && <CheckBadgeIcon className="h-4 w-4 text-[var(--accent)]" />}
                      </div>
                      <p className="mt-1 text-[11px] font-semibold text-[var(--muted)]">{card.speed}</p>
                    </div>
                    <p className="mt-2 text-[10px] leading-snug text-[var(--faint)]">{card.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* MCP Servers Manager */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Target MCP Servers
                  </h3>
                  <p className="text-[11px] text-[var(--faint)]">Tools available to agent during execution</p>
                </div>
                <button
                  type="button"
                  onClick={addMcpServer}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add Server
                </button>
              </div>

              <div className="scroll-area max-h-48 space-y-3 overflow-y-auto pr-1">
                {mcpServers.map((server, index) => (
                  <div
                    key={index}
                    className="soft-panel rounded-xl p-3 space-y-2 animate-fade"
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--muted)]">
                      <span className="flex items-center gap-1">
                        <BoltIcon className="h-3.5 w-3.5 text-[var(--accent)]" />
                        Server #{index + 1}
                      </span>
                      {mcpServers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMcpServer(index)}
                          className="text-[var(--muted)] hover:text-[var(--danger)]"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-[0.4fr_0.6fr]">
                      <input
                        type="text"
                        value={server.name}
                        onChange={(e) => updateMcpServer(index, "name", e.target.value)}
                        placeholder="Server Name"
                        className="rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
                      />
                      <input
                        type="text"
                        value={server.url}
                        onChange={(e) => updateMcpServer(index, "url", e.target.value)}
                        placeholder="https://.../mcp"
                        className="rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)] font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="animate-fade rounded-xl border border-[var(--danger-soft)] bg-[var(--danger-soft)] p-3 text-xs font-medium text-[var(--danger)]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-sm font-semibold text-[var(--app-bg)] shadow-md shadow-[var(--accent-soft)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] active:translate-y-0 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--app-bg)] border-t-transparent" />
                  Creating Thread...
                </span>
              ) : (
                <>
                  <span>Initialize Agent Workspace</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
