import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BoltIcon,
  EyeIcon,
  EyeSlashIcon,
  MoonIcon,
  PlusIcon,
  ServerStackIcon,
  SunIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

import {
  clearAuthSession,
  connectAgent,
  createThread,
  getAuthToken,
} from "../api/chat";
import useTheme from "../hooks/useTheme";

const DEFAULT_MCP_URL =
  "https://mcp-server-company-details.onrender.com/mcp";

const DEFAULT_SERVERS = [
  {
    name: "Company Details",
    url: DEFAULT_MCP_URL,
  },
];

const MODEL_OPTIONS = [
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
];

const loadSavedServers = () => {
  const savedServers = localStorage.getItem("mcp_server_presets");

  if (!savedServers) {
    return DEFAULT_SERVERS;
  }

  try {
    const parsedServers = JSON.parse(savedServers);

    return Array.isArray(parsedServers) && parsedServers.length > 0
      ? parsedServers
      : DEFAULT_SERVERS;
  } catch {
    return DEFAULT_SERVERS;
  }
};

export default function Connect() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [apiKey, setApiKey] = useState(sessionStorage.getItem("mcp_api_key") || "");
  const [model, setModel] = useState(
    localStorage.getItem("mcp_model") || MODEL_OPTIONS[0]
  );
  const [mcpServers, setMcpServers] = useState(loadSavedServers);
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const addMcpServer = () => {
    setMcpServers((current) => [
      ...current,
      {
        name: "",
        url: "",
      },
    ]);
  };

  const removeMcpServer = (index) => {
    setMcpServers((current) =>
      current.filter((_, currentIndex) => currentIndex !== index)
    );
  };

  const updateMcpServer = (index, field, value) => {
    setMcpServers((current) =>
      current.map((server, currentIndex) =>
        currentIndex === index
          ? {
              ...server,
              [field]: value,
            }
          : server
      )
    );
  };

  const validate = () => {
    if (!apiKey.trim()) {
      return "Gemini API key is required.";
    }

    if (!model.trim()) {
      return "Gemini model is required.";
    }

    const activeServers = mcpServers.filter(
      (server) => server.name.trim() || server.url.trim()
    );

    if (activeServers.length === 0) {
      return "Add at least one MCP server.";
    }

    for (let index = 0; index < activeServers.length; index += 1) {
      const server = activeServers[index];

      if (!server.name.trim()) {
        return `MCP server ${index + 1} needs a name.`;
      }

      if (!server.url.trim()) {
        return `MCP server ${index + 1} needs a URL.`;
      }

      try {
        new URL(server.url);
      } catch {
        return `MCP server ${index + 1} has an invalid URL.`;
      }
    }

    return null;
  };

  const logout = () => {
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

      const sessionResponse = await connectAgent();
      const sessionId = sessionResponse.data?.session_id;

      if (!sessionId) {
        throw new Error("Backend did not return a session ID.");
      }

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
          "Unable to create chat thread."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-surface min-h-screen overflow-y-auto px-4 py-5 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-6xl flex-col justify-center gap-8 py-6 lg:grid lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
        <section className="animate-rise">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--app-bg)]">
                <ServerStackIcon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--faint)]">
                  Thread setup
                </p>
                <h1 className="text-2xl font-semibold tracking-normal text-[var(--text)] sm:text-3xl">
                  Configure Gemini and MCP
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                title="Toggle theme"
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--panel)] transition hover:-translate-y-0.5"
              >
                {isDark ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </button>
              <button
                type="button"
                onClick={logout}
                title="Sign out"
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--panel)] text-[var(--danger)] transition hover:-translate-y-0.5"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="soft-panel rounded-lg p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--faint)]">
                Step 1
              </p>
              <p className="mt-2 text-sm font-semibold">Create secure session</p>
            </div>
            <div className="soft-panel rounded-lg p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--faint)]">
                Step 2
              </p>
              <p className="mt-2 text-sm font-semibold">Save thread config</p>
            </div>
            <div className="soft-panel rounded-lg p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--faint)]">
                Step 3
              </p>
              <p className="mt-2 text-sm font-semibold">Stream responses</p>
            </div>
          </div>
        </section>

        <form
          onSubmit={handleConnect}
          className="glass-panel animate-rise rounded-lg p-4 sm:p-6"
        >
          <div className="grid gap-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Gemini API Key</span>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="Enter Gemini API key"
                  autoComplete="off"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 pr-12 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((current) => !current)}
                  title={showApiKey ? "Hide API key" : "Show API key"}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--panel-muted)] hover:text-[var(--text)]"
                >
                  {showApiKey ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Gemini Model</span>
              <select
                value={model}
                onChange={(event) => setModel(event.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
              >
                {MODEL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">MCP Servers</h2>
                  <p className="text-xs text-[var(--muted)]">
                    Used when creating the backend thread
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addMcpServer}
                  title="Add MCP server"
                  className="flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-3 text-sm font-medium transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add
                </button>
              </div>

              <div className="grid max-h-[36vh] gap-3 overflow-y-auto pr-1 scroll-area sm:max-h-[42vh]">
                {mcpServers.map((server, index) => (
                  <div
                    key={`${index}-${server.url}`}
                    className="soft-panel animate-fade rounded-lg p-3"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--faint)]">
                        <BoltIcon className="h-4 w-4" />
                        Server {index + 1}
                      </span>

                      {mcpServers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMcpServer(index)}
                          title="Remove MCP server"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-red-500/10 hover:text-[var(--danger)]"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[0.42fr_0.58fr]">
                      <input
                        value={server.name}
                        onChange={(event) =>
                          updateMcpServer(index, "name", event.target.value)
                        }
                        placeholder="Server name"
                        className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                      />
                      <input
                        value={server.url}
                        onChange={(event) =>
                          updateMcpServer(index, "url", event.target.value)
                        }
                        placeholder="https://your-server.com/mcp"
                        className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="animate-fade rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-[var(--danger)]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--app-bg)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] disabled:opacity-60"
            >
              {loading ? "Creating thread..." : "Start chat"}
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
