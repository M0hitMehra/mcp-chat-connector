import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  Bars3Icon,
  ClipboardDocumentIcon,
  CloudArrowDownIcon,
  Cog6ToothIcon,
  MoonIcon,
  PlusIcon,
  SignalIcon,
  SunIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import {
  clearAuthSession,
  createThread,
  deleteSession,
  getAuthToken,
  getThreadMessages,
  listSessions,
  listThreads,
  updateThreadConfig,
} from "../api/chat";
import ChatMessage from "../components/ChatMessage";
import MessageInput from "../components/MessageInput";
import useChat from "../hooks/useChat";
import useTheme from "../hooks/useTheme";

const MODEL_OPTIONS = [
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
];

const readJson = (key, fallback) => {
  const value = localStorage.getItem(key);

  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export default function Chat() {
  const navigate = useNavigate();
  const bottomRef = useRef(null);
  const { isDark, toggleTheme } = useTheme();

  const [sessionId] = useState(
    localStorage.getItem("mcp_session_id") || ""
  );
  const [threadId, setThreadId] = useState(
    localStorage.getItem("mcp_thread_id") || ""
  );
  const [threadName, setThreadName] = useState(
    localStorage.getItem("mcp_thread_name") || "New Chat"
  );
  const [threadConfig, setThreadConfig] = useState(() =>
    readJson("mcp_thread_config", {
      model_name: localStorage.getItem("mcp_model") || MODEL_OPTIONS[0],
      mcp_servers: readJson("mcp_server_presets", []),
    })
  );
  const [sessions, setSessions] = useState([]);
  const [threads, setThreads] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [transcriptCopied, setTranscriptCopied] = useState(false);
  const [configDraft, setConfigDraft] = useState(() => ({
    api_key: "",
    model_name: threadConfig.model_name || MODEL_OPTIONS[0],
    mcp_servers: threadConfig.mcp_servers || [],
  }));
  const [configSaving, setConfigSaving] = useState(false);
  const [pageError, setPageError] = useState("");

  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    copyTranscript,
    downloadTranscript,
    replaceMessages,
  } = useChat({
    sessionId,
    threadId,
    modelName: threadConfig.model_name || MODEL_OPTIONS[0],
  });

  const refreshMeta = useCallback(async () => {
    setLoadingMeta(true);
    setPageError("");

    try {
      const [sessionsResponse, threadsResponse] = await Promise.all([
        listSessions(),
        listThreads(),
      ]);

      setSessions(sessionsResponse.data?.data || []);
      setThreads(threadsResponse.data?.threads || []);
    } catch (metaError) {
      console.error(metaError);
      setPageError(
        metaError.response?.data?.message ||
          metaError.response?.data?.detail ||
          "Unable to load sessions or threads."
      );
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  const loadThreadMessages = useCallback(
    async (nextThreadId) => {
      if (!nextThreadId) {
        return;
      }

      try {
        const response = await getThreadMessages(nextThreadId);
        replaceMessages(response.data?.messages || []);
      } catch (messagesError) {
        console.error(messagesError);
      }
    },
    [replaceMessages]
  );

  useEffect(() => {
    if (!getAuthToken()) {
      navigate("/");
      return;
    }

    if (!sessionId || !threadId) {
      navigate("/connect");
    }
  }, [navigate, sessionId, threadId]);

  useEffect(() => {
    const timer = window.setTimeout(refreshMeta, 0);

    return () => window.clearTimeout(timer);
  }, [refreshMeta]);

  useEffect(() => {
    loadThreadMessages(threadId);
  }, [loadThreadMessages, threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  const selectThread = async (thread) => {
    setThreadId(thread.thread_id);
    setThreadName(thread.thread_name || "New Chat");
    localStorage.setItem("mcp_thread_id", thread.thread_id);
    localStorage.setItem("mcp_thread_name", thread.thread_name || "New Chat");
    setDrawerOpen(false);
  };

  const createNewThread = async () => {
    const apiKey = sessionStorage.getItem("mcp_api_key");

    if (!apiKey) {
      navigate("/connect");
      return;
    }

    try {
      const response = await createThread({
        session_id: sessionId,
        model_name: threadConfig.model_name || MODEL_OPTIONS[0],
        apiKey,
        mcp_servers: threadConfig.mcp_servers || [],
      });

      const nextThreadId = response.data?.thread_id;

      if (!nextThreadId) {
        throw new Error("Backend did not return a thread ID.");
      }

      const nextName = response.data?.thread_name || "New Chat";
      setThreadId(nextThreadId);
      setThreadName(nextName);
      localStorage.setItem("mcp_thread_id", nextThreadId);
      localStorage.setItem("mcp_thread_name", nextName);
      replaceMessages([]);
      refreshMeta();
      setDrawerOpen(false);
    } catch (threadError) {
      console.error(threadError);
      setPageError(
        threadError.response?.data?.message ||
          threadError.response?.data?.detail ||
          threadError.message ||
          "Unable to create a new thread."
      );
    }
  };

  const saveConfig = async () => {
    try {
      setConfigSaving(true);
      setPageError("");

      const payload = {
        model_name: configDraft.model_name,
        mcp_servers: configDraft.mcp_servers,
      };

      if (configDraft.api_key.trim()) {
        payload.api_key = configDraft.api_key.trim();
        sessionStorage.setItem("mcp_api_key", configDraft.api_key.trim());
      }

      await updateThreadConfig(threadId, payload);

      const nextConfig = {
        model_name: payload.model_name,
        mcp_servers: payload.mcp_servers,
      };

      setThreadConfig(nextConfig);
      localStorage.setItem("mcp_thread_config", JSON.stringify(nextConfig));
      localStorage.setItem("mcp_model", payload.model_name);
      localStorage.setItem("mcp_server_presets", JSON.stringify(payload.mcp_servers));
      setConfigOpen(false);
    } catch (configError) {
      console.error(configError);
      setPageError(
        configError.response?.data?.message ||
          configError.response?.data?.detail ||
          "Unable to update thread config."
      );
    } finally {
      setConfigSaving(false);
    }
  };

  const updateDraftServer = (index, field, value) => {
    setConfigDraft((current) => ({
      ...current,
      mcp_servers: current.mcp_servers.map((server, currentIndex) =>
        currentIndex === index
          ? {
              ...server,
              [field]: value,
            }
          : server
      ),
    }));
  };

  const addDraftServer = () => {
    setConfigDraft((current) => ({
      ...current,
      mcp_servers: [
        ...current.mcp_servers,
        {
          name: "",
          url: "",
        },
      ],
    }));
  };

  const removeDraftServer = (index) => {
    setConfigDraft((current) => ({
      ...current,
      mcp_servers: current.mcp_servers.filter(
        (_, currentIndex) => currentIndex !== index
      ),
    }));
  };

  const logout = async () => {
    if (sessionId) {
      try {
        await deleteSession(sessionId);
      } catch (sessionError) {
        console.error("Unable to delete backend session:", sessionError);
      }
    }

    clearAuthSession();
    navigate("/");
  };

  const handleCopyTranscript = async () => {
    await copyTranscript();
    setTranscriptCopied(true);
    setTimeout(() => setTranscriptCopied(false), 1400);
  };

  if (!sessionId || !threadId) {
    return null;
  }

  const userMessages = messages.filter((message) => message.role === "user");
  const assistantMessages = messages.filter(
    (message) => message.role === "assistant" && message.content
  );

  const sidebar = (
    <div className="flex h-full flex-col bg-[var(--panel-strong)] text-[var(--text)]">
      <div className="border-b border-[var(--border)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-normal">
              MCP Chat
            </h1>
            <p className="truncate text-xs text-[var(--muted)]">{threadName}</p>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            title="Close sidebar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--panel-muted)] md:hidden"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="scroll-area flex-1 overflow-y-auto p-3">
        <button
          type="button"
          onClick={createNewThread}
          disabled={isStreaming}
          className="mb-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 text-sm font-medium transition hover:border-[var(--accent)] disabled:opacity-45"
        >
          <PlusIcon className="h-4 w-4" />
          New thread
        </button>

        <div className="soft-panel rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <SignalIcon className="h-4 w-4 text-[var(--accent)]" />
            Connected
          </div>
          <div className="mt-2 break-all rounded-md bg-[var(--panel-strong)] p-2 font-mono text-xs text-[var(--muted)]">
            {sessionId}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="soft-panel rounded-lg p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--faint)]">
              Prompts
            </p>
            <p className="mt-2 text-lg font-semibold">{userMessages.length}</p>
          </div>
          <div className="soft-panel rounded-lg p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--faint)]">
              Replies
            </p>
            <p className="mt-2 text-lg font-semibold">
              {assistantMessages.length}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--faint)]">
              Threads
            </h2>
            <button
              type="button"
              onClick={refreshMeta}
              title="Refresh"
              className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-[var(--panel-muted)]"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            {loadingMeta ? (
              <div className="soft-panel rounded-lg p-3 text-sm text-[var(--muted)]">
                Loading threads...
              </div>
            ) : threads.length > 0 ? (
              threads.map((thread) => (
                <button
                  key={thread.thread_id}
                  type="button"
                  onClick={() => selectThread(thread)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${
                    thread.thread_id === threadId
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text)]"
                      : "border-[var(--border)] bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                >
                  <div className="truncate font-semibold">
                    {thread.thread_name || "New Chat"}
                  </div>
                  <div className="mt-1 truncate font-mono opacity-70">
                    {thread.thread_id}
                  </div>
                </button>
              ))
            ) : (
              <div className="soft-panel rounded-lg p-3 text-sm text-[var(--muted)]">
                No threads returned
              </div>
            )}
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--faint)]">
              Sessions
            </h2>
            <span className="text-xs text-[var(--muted)]">{sessions.length}</span>
          </div>
          <div className="space-y-2">
            {sessions.slice(0, 4).map((session) => (
              <div
                key={session.session_id || session._id}
                className={`rounded-lg border px-3 py-2 font-mono text-xs ${
                  session.session_id === sessionId
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text)]"
                    : "border-[var(--border)] bg-[var(--panel)] text-[var(--muted)]"
                }`}
              >
                <div className="truncate">{session.session_id}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-2 border-t border-[var(--border)] p-3">
        <button
          type="button"
          onClick={handleCopyTranscript}
          className="flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--panel-muted)] hover:text-[var(--text)]"
        >
          <ClipboardDocumentIcon className="h-4 w-4" />
          {transcriptCopied ? "Copied" : "Copy chat"}
        </button>
        <button
          type="button"
          onClick={downloadTranscript}
          className="flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--panel-muted)] hover:text-[var(--text)]"
        >
          <CloudArrowDownIcon className="h-4 w-4" />
          Download
        </button>
        <button
          type="button"
          onClick={logout}
          className="flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium text-[var(--danger)] transition hover:bg-red-500/10"
        >
          <TrashIcon className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="app-surface flex h-screen overflow-hidden text-[var(--text)]">
      <aside className="hidden w-72 shrink-0 border-r border-[var(--border)] md:block lg:w-80">
        {sidebar}
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close sidebar overlay"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 h-full w-full bg-black/45"
          />
          <aside className="absolute inset-y-0 left-0 w-[88vw] max-w-80 animate-rise border-r border-[var(--border)]">
            {sidebar}
          </aside>
        </div>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--panel)] px-3 backdrop-blur-xl sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              title="Open sidebar"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] md:hidden"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold tracking-normal">
                {threadName}
              </h2>
              <p className="truncate text-xs text-[var(--muted)]">
                {threadConfig.model_name || MODEL_OPTIONS[0]}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setConfigDraft({
                  api_key: "",
                  model_name: threadConfig.model_name || MODEL_OPTIONS[0],
                  mcp_servers: threadConfig.mcp_servers || [],
                });
                setConfigOpen(true);
              }}
              title="Thread config"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] transition hover:-translate-y-0.5"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              title="Toggle theme"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] transition hover:-translate-y-0.5"
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
              className="hidden h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-3 text-sm font-medium text-[var(--muted)] transition hover:-translate-y-0.5 hover:text-[var(--danger)] sm:flex"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Exit
            </button>
          </div>
        </header>

        <section className="scroll-area flex-1 overflow-y-auto px-3 py-5 sm:px-5">
          <div className="mx-auto flex max-w-4xl flex-col gap-4">
            {(pageError || error) && (
              <div className="animate-fade rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-[var(--danger)]">
                {pageError || error}
              </div>
            )}

            {messages.map((message, index) => {
              const isLast = index === messages.length - 1;

              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isStreaming={
                    isStreaming && isLast && message.role === "assistant"
                  }
                />
              );
            })}

            <div ref={bottomRef} />
          </div>
        </section>

        <MessageInput onSend={sendMessage} disabled={isStreaming} />
      </main>

      {configOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/45 p-3 sm:items-center sm:justify-center">
          <div className="glass-panel max-h-[92vh] w-full max-w-2xl animate-rise overflow-y-auto rounded-lg p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Thread config</h2>
                <p className="text-sm text-[var(--muted)]">
                  Updates /threads/{"{thread_id}"}/config
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfigOpen(false)}
                title="Close config"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--panel-muted)]"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Model</span>
                <select
                  value={configDraft.model_name}
                  onChange={(event) =>
                    setConfigDraft((current) => ({
                      ...current,
                      model_name: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                >
                  {MODEL_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  New Gemini API key
                </span>
                <input
                  type="password"
                  value={configDraft.api_key}
                  onChange={(event) =>
                    setConfigDraft((current) => ({
                      ...current,
                      api_key: event.target.value,
                    }))
                  }
                  placeholder="Leave blank to keep existing key"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                />
              </label>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">MCP Servers</h3>
                  <button
                    type="button"
                    onClick={addDraftServer}
                    className="flex h-9 items-center gap-2 rounded-lg border border-[var(--border)] px-3 text-sm transition hover:border-[var(--accent)]"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add
                  </button>
                </div>

                <div className="grid gap-3">
                  {configDraft.mcp_servers.map((server, index) => (
                    <div key={`${index}-${server.url}`} className="soft-panel rounded-lg p-3">
                      <div className="mb-3 flex justify-end">
                        {configDraft.mcp_servers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDraftServer(index)}
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
                            updateDraftServer(index, "name", event.target.value)
                          }
                          placeholder="Server name"
                          className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                        />
                        <input
                          value={server.url}
                          onChange={(event) =>
                            updateDraftServer(index, "url", event.target.value)
                          }
                          placeholder="https://your-server.com/mcp"
                          className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={saveConfig}
                disabled={configSaving}
                className="flex h-11 items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--app-bg)] transition hover:bg-[var(--accent-strong)] disabled:opacity-60"
              >
                {configSaving ? "Saving..." : "Save config"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
