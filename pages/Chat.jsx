import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  Bars3Icon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  CloudArrowDownIcon,
  Cog6ToothIcon,
  CommandLineIcon,
  ChevronDownIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  PlusIcon,
  SignalIcon,
  SparklesIcon,
  SunIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import {
  checkHealth,
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
import CommandPalette from "../components/CommandPalette";
import useChat from "../hooks/useChat";
import useTheme from "../hooks/useTheme";

const MODEL_OPTIONS = [
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
];

const PROMPT_STARTERS = [
  {
    title: "Company Intelligence",
    prompt: "Fetch and summarize company details using the MCP tool.",
    icon: "💼",
  },
  {
    title: "Technical Overview",
    prompt: "What capabilities and endpoints do the connected MCP servers expose?",
    icon: "🚀",
  },
  {
    title: "Executive Synthesis",
    prompt: "Provide a structured executive briefing on market competitors.",
    icon: "📊",
  },
  {
    title: "Code Architecture",
    prompt: "Draft an architecture plan for integrating MCP tools into a React app.",
    icon: "💡",
  },
];

const readJson = (key, fallback) => {
  const value = localStorage.getItem(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export default function Chat() {
  const navigate = useNavigate();
  const bottomRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const { isDark, toggleTheme } = useTheme();

  const [sessionId] = useState(localStorage.getItem("mcp_session_id") || "");
  const [threadId, setThreadId] = useState(localStorage.getItem("mcp_thread_id") || "");
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
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [threadSearch, setThreadSearch] = useState("");
  const [transcriptCopied, setTranscriptCopied] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const [configDraft, setConfigDraft] = useState(() => ({
    api_key: "",
    model_name: threadConfig.model_name || MODEL_OPTIONS[0],
    mcp_servers: threadConfig.mcp_servers || [],
    thread_name: threadName || "New Chat",
  }));
  const [configSaving, setConfigSaving] = useState(false);
  const [pageError, setPageError] = useState("");

  const openConfigModal = () => {
    setConfigDraft({
      api_key: "",
      model_name: threadConfig.model_name || MODEL_OPTIONS[0],
      mcp_servers: threadConfig.mcp_servers || [],
      thread_name: threadName || "New Chat",
    });
    setConfigOpen(true);
  };

  const {
    messages,
    isStreaming,
    error,
    lastLatencyMs,
    speakingMessageId,
    sendMessage,
    copyTranscript,
    downloadMarkdown,
    downloadJson,
    speakMessage,
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
          "Unable to sync sessions or threads with backend."
      );
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  const loadThreadMessages = useCallback(
    async (nextThreadId) => {
      if (!nextThreadId) return;
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
    refreshMeta();
  }, [refreshMeta]);

  useEffect(() => {
    loadThreadMessages(threadId);
  }, [loadThreadMessages, threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 180;
    setShowScrollBottom(isUp);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
          "Failed to create new thread."
      );
    }
  };

  const handleSaveConfig = async () => {
    try {
      setConfigSaving(true);
      setPageError("");

      const payload = {
        model_name: configDraft.model_name,
        mcp_servers: configDraft.mcp_servers,
      };

      if (configDraft.thread_name && configDraft.thread_name.trim()) {
        payload.thread_name = configDraft.thread_name.trim();
      }

      if (configDraft.api_key.trim()) {
        payload.api_key = configDraft.api_key.trim();
        sessionStorage.setItem("mcp_api_key", configDraft.api_key.trim());
      }

      await updateThreadConfig(threadId, payload);

      if (payload.thread_name) {
        setThreadName(payload.thread_name);
        localStorage.setItem("mcp_thread_name", payload.thread_name);
      }

      const nextConfig = {
        model_name: payload.model_name,
        mcp_servers: payload.mcp_servers,
      };

      setThreadConfig(nextConfig);
      localStorage.setItem("mcp_thread_config", JSON.stringify(nextConfig));
      localStorage.setItem("mcp_model", payload.model_name);
      localStorage.setItem("mcp_server_presets", JSON.stringify(payload.mcp_servers));
      await refreshMeta();
      setConfigOpen(false);
    } catch (configError) {
      console.error(configError);
      setPageError(
        configError.response?.data?.message ||
          configError.response?.data?.detail ||
          "Unable to update thread configuration."
      );
    } finally {
      setConfigSaving(false);
    }
  };

  const handleDeleteSession = async (targetSessionId) => {
    try {
      await deleteSession(targetSessionId);
      refreshMeta();
      if (targetSessionId === sessionId) {
        clearAuthSession();
        navigate("/");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    if (sessionId) {
      try {
        await deleteSession(sessionId);
      } catch (sessionError) {
        console.error("Backend session deletion bypass:", sessionError);
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

  const filteredThreads = threads.filter((t) =>
    (t.thread_name || "New Chat").toLowerCase().includes(threadSearch.toLowerCase()) ||
    t.thread_id.toLowerCase().includes(threadSearch.toLowerCase())
  );

  const mcpServerCount = (threadConfig.mcp_servers || []).length;

  const sidebar = (
    <div className="flex h-full flex-col bg-[var(--panel-strong)] text-[var(--text)] border-r border-[var(--border)]">
      {/* Sidebar Header */}
      <div className="border-b border-[var(--border)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--app-bg)] shadow-md">
              <SparklesIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold tracking-tight text-[var(--text)]">
                MCP Studio
              </h1>
              <p className="truncate text-[10px] text-[var(--muted)]">Active Workspace</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--panel-muted)] md:hidden"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Sidebar Scroll Container */}
      <div className="scroll-area flex-1 overflow-y-auto p-3 space-y-4">
        {/* Create Thread CTA */}
        <button
          type="button"
          onClick={createNewThread}
          disabled={isStreaming}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-xs font-semibold text-[var(--app-bg)] shadow-sm transition hover:bg-[var(--accent-hover)] active:scale-95 disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4" />
          New Chat Thread
        </button>

        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="flex h-9 w-full items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--panel-muted)] px-3 text-xs text-[var(--muted)] hover:border-[var(--accent-border)] hover:text-[var(--text)]"
        >
          <span className="flex items-center gap-2">
            <CommandLineIcon className="h-4 w-4" />
            Quick Command
          </span>
          <kbd className="rounded border border-[var(--border)] bg-[var(--panel-strong)] px-1.5 py-0.5 font-mono text-[10px]">
            Cmd K
          </kbd>
        </button>

        {/* Connected Session Status */}
        <div className="soft-panel rounded-xl p-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text)]">
              <span className="h-2 w-2 rounded-full bg-[var(--emerald)] pulse-active" />
              Connected Session
            </span>
            <button
              type="button"
              onClick={() => handleDeleteSession(sessionId)}
              title="Delete session"
              className="text-[var(--muted)] hover:text-[var(--danger)]"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-2 truncate font-mono text-[11px] text-[var(--muted)]">
            {sessionId}
          </div>
        </div>

        {/* Threads List */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-[var(--faint)]">
              Threads ({threads.length})
            </h2>
            <button
              type="button"
              onClick={refreshMeta}
              className="text-[var(--muted)] hover:text-[var(--accent)]"
            >
              <ArrowPathIcon className={`h-3.5 w-3.5 ${loadingMeta ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="mb-2 relative">
            <input
              type="text"
              value={threadSearch}
              onChange={(e) => setThreadSearch(e.target.value)}
              placeholder="Search threads..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--panel-muted)] px-3 py-1.5 pl-8 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
            <MagnifyingGlassIcon className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[var(--faint)]" />
          </div>

          <div className="space-y-1.5">
            {loadingMeta ? (
              <div className="p-3 text-center text-xs text-[var(--muted)]">Loading threads...</div>
            ) : filteredThreads.length > 0 ? (
              filteredThreads.map((t) => (
                <button
                  key={t.thread_id}
                  type="button"
                  onClick={() => selectThread(t)}
                  className={`group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs transition ${
                    t.thread_id === threadId
                      ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                      : "text-[var(--muted)] hover:bg-[var(--panel-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1 truncate">
                    <div className="truncate">{t.thread_name || "New Chat"}</div>
                    <div className="truncate font-mono text-[9px] opacity-60">
                      {t.thread_id.slice(0, 10)}...
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-3 text-center text-xs text-[var(--muted)]">No matching threads</div>
            )}
          </div>
        </div>

        {/* Sessions Summary */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--faint)]">
            <span>Sessions History</span>
            <span>{sessions.length}</span>
          </div>
          <div className="space-y-1">
            {sessions.slice(0, 3).map((s) => (
              <div
                key={s.session_id || s._id}
                className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 font-mono text-[10px] ${
                  s.session_id === sessionId
                    ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--muted)]"
                }`}
              >
                <span className="truncate">{s.session_id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar Footer Actions */}
      <div className="border-t border-[var(--border)] p-3 space-y-1">
        <button
          type="button"
          onClick={handleCopyTranscript}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-lg text-xs font-medium text-[var(--muted)] hover:bg-[var(--panel-muted)] hover:text-[var(--text)]"
        >
          {transcriptCopied ? <CheckIcon className="h-4 w-4 text-[var(--emerald)]" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
          <span>{transcriptCopied ? "Copied Transcript" : "Copy Transcript"}</span>
        </button>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={downloadMarkdown}
            className="flex h-8 items-center justify-center gap-1 rounded-lg border border-[var(--border)] text-[11px] text-[var(--muted)] hover:bg-[var(--panel-muted)] hover:text-[var(--text)]"
          >
            <CloudArrowDownIcon className="h-3.5 w-3.5" />
            .MD
          </button>
          <button
            type="button"
            onClick={downloadJson}
            className="flex h-8 items-center justify-center gap-1 rounded-lg border border-[var(--border)] text-[11px] text-[var(--muted)] hover:bg-[var(--panel-muted)] hover:text-[var(--text)]"
          >
            <CloudArrowDownIcon className="h-3.5 w-3.5" />
            .JSON
          </button>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-lg text-xs font-medium text-[var(--danger)] hover:bg-red-500/10"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="app-surface flex h-screen overflow-hidden text-[var(--text)]">
      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={(trigger) => setCommandPaletteOpen(typeof trigger === 'boolean' ? trigger : false)}
        threads={threads}
        activeThreadId={threadId}
        onSelectThread={selectThread}
        onCreateThread={createNewThread}
        onToggleTheme={toggleTheme}
        isDark={isDark}
        onExportMarkdown={downloadMarkdown}
        onExportJson={downloadJson}
        onOpenConfig={openConfigModal}
        onCheckHealth={checkHealth}
        onLogout={handleLogout}
      />

      {/* Desktop Sidebar */}
      <aside className="hidden w-72 shrink-0 md:block lg:w-80">
        {sidebar}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 left-0 w-[85vw] max-w-80 animate-rise shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main Studio Canvas */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Workspace Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--panel)] px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] md:hidden"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-sm font-bold tracking-tight text-[var(--text)]">
                  {threadName}
                </h2>
                <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent)]">
                  {threadConfig.model_name || MODEL_OPTIONS[0]}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[var(--muted)]">
                <span className="flex items-center gap-1">
                  <BoltIcon className="h-3 w-3 text-[var(--accent)]" />
                  {mcpServerCount} MCP Server{mcpServerCount === 1 ? '' : 's'}
                </span>
                {lastLatencyMs && (
                  <span className="font-mono text-[10px] opacity-80">
                    ⏱️ {lastLatencyMs}ms
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 text-xs font-semibold text-[var(--muted)] hover:border-[var(--accent-border)] hover:text-[var(--text)]"
            >
              <CommandLineIcon className="h-4 w-4" />
              Cmd K
            </button>

            <button
              type="button"
              onClick={openConfigModal}
              title="Thread MCP Config"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--text)]"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              title="Toggle theme"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--text)]"
            >
              {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
          </div>
        </header>

        {/* Scrollable Message Body */}
        <section
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="scroll-area relative flex-1 overflow-y-auto px-4 py-6 sm:px-6"
        >
          <div className="mx-auto flex max-w-4xl flex-col gap-4">
            {(pageError || error) && (
              <div className="animate-fade rounded-xl border border-[var(--danger-soft)] bg-[var(--danger-soft)] p-4 text-xs font-medium text-[var(--danger)]">
                {pageError || error}
              </div>
            )}

            {/* Smart Prompt Starters when chat has only welcome message */}
            {messages.length <= 1 && (
              <div className="my-6 animate-rise text-center space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <SparklesIcon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold tracking-tight text-[var(--text)]">
                  How can the agent assist you today?
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 text-left">
                  {PROMPT_STARTERS.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => sendMessage(s.prompt)}
                      className="glass-panel flex items-start gap-3 rounded-xl p-4 transition hover:-translate-y-0.5 hover:border-[var(--accent-border)]"
                    >
                      <span className="text-xl">{s.icon}</span>
                      <div>
                        <div className="text-xs font-bold text-[var(--text)]">{s.title}</div>
                        <div className="mt-1 text-[11px] text-[var(--muted)]">{s.prompt}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Message List */}
            {messages.map((message, index) => {
              const isLast = index === messages.length - 1;
              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isStreaming={isStreaming && isLast && message.role === "assistant"}
                  isSpeaking={speakingMessageId === message.id}
                  onSpeak={() => speakMessage(message.id, message.content)}
                />
              );
            })}

            <div ref={bottomRef} />
          </div>

          {/* Floating Scroll-to-Bottom Button */}
          {showScrollBottom && (
            <button
              type="button"
              onClick={scrollToBottom}
              className="fixed bottom-24 right-8 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--app-bg)] shadow-xl transition hover:scale-105"
            >
              <ChevronDownIcon className="h-5 w-5" />
            </button>
          )}
        </section>

        {/* Input Bar */}
        <MessageInput onSend={sendMessage} disabled={isStreaming} />
      </main>

      {/* Thread Configuration Modal */}
      {configOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="glass-panel-strong max-h-[90vh] w-full max-w-xl animate-scale overflow-y-auto rounded-2xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text)]">Thread Config & MCP Tools</h3>
                <p className="text-xs text-[var(--muted)]">Updates PATCH /threads/{"{thread_id}"}/config</p>
              </div>
              <button
                type="button"
                onClick={() => setConfigOpen(false)}
                className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--panel-muted)]"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--muted)]">Thread Name</label>
                <input
                  type="text"
                  value={configDraft.thread_name || ""}
                  onChange={(e) => setConfigDraft((prev) => ({ ...prev, thread_name: e.target.value }))}
                  placeholder="e.g. Research Session"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--muted)]">Model</label>
                <select
                  value={configDraft.model_name}
                  onChange={(e) => setConfigDraft((prev) => ({ ...prev, model_name: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 text-xs text-[var(--text)] outline-none"
                >
                  {MODEL_OPTIONS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[var(--muted)]">New Gemini API Key (Optional)</label>
                <input
                  type="password"
                  value={configDraft.api_key}
                  onChange={(e) => setConfigDraft((prev) => ({ ...prev, api_key: e.target.value }))}
                  placeholder="Leave blank to retain existing key"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 text-xs text-[var(--text)] outline-none"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[var(--muted)]">
                  <span>MCP Servers Configuration</span>
                  <button
                    type="button"
                    onClick={() =>
                      setConfigDraft((prev) => ({
                        ...prev,
                        mcp_servers: [...prev.mcp_servers, { name: "", url: "", token:""}],
                      }))
                    }
                    className="text-[var(--accent)] hover:underline"
                  >
                    + Add Server
                  </button>
                </div>

                <div className="space-y-2">
                  {configDraft.mcp_servers.map((s, i) => (
                    <div key={i} className="soft-panel flex items-center gap-2 rounded-xl p-2.5">
                      <input
                        type="text"
                        value={s.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setConfigDraft((prev) => ({
                            ...prev,
                            mcp_servers: prev.mcp_servers.map((item, idx) =>
                              idx === i ? { ...item, name: val } : item
                            ),
                          }));
                        }}
                        placeholder="Server Name"
                        className="w-1/3 rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-2.5 py-1.5 text-xs text-[var(--text)]"
                      />
                      <input
                        type="text"
                        value={s.url}
                        onChange={(e) => {
                          const val = e.target.value;
                          setConfigDraft((prev) => ({
                            ...prev,
                            mcp_servers: prev.mcp_servers.map((item, idx) =>
                              idx === i ? { ...item, url: val } : item
                            ),
                          }));
                        }}
                        placeholder="https://.../mcp"
                        className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-2.5 py-1.5 text-xs text-[var(--text)] font-mono"
                      />

                      <input
                        type="text"
                        value={s.token}
                        onChange={(e) => {
                          const val = e.target.value;
                          setConfigDraft((prev) => ({
                            ...prev,
                            mcp_servers: prev.mcp_servers.map((item, idx) =>
                              idx === i ? { ...item, token: val } : item
                            ),
                          }));
                        }}
                        placeholder="api key(optional)"
                        className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-2.5 py-1.5 text-xs text-[var(--text)] font-mono"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setConfigDraft((prev) => ({
                            ...prev,
                            mcp_servers: prev.mcp_servers.filter((_, idx) => idx !== i),
                          }))
                        }
                        className="text-[var(--muted)] hover:text-[var(--danger)]"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={configSaving}
                className="h-11 w-full rounded-xl bg-[var(--accent)] text-xs font-semibold text-[var(--app-bg)] shadow-md hover:bg-[var(--accent-hover)] disabled:opacity-60"
              >
                {configSaving ? "Saving Config..." : "Save Thread Configuration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
