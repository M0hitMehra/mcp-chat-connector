import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownIcon,
  ArrowPathIcon,
  Bars3Icon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  CpuChipIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import Navbar from "../components/Navbar";
import ChatMessage from "../components/ChatMessage";
import MessageInput from "../components/MessageInput";
import ThreadDefaultsModal from "../components/ThreadDefaultsModal";
import useChat from "../hooks/useChat";
import {
  createThread,
  getAuthToken,
  getSavedApiKey,
  getThreadMessages,
  listSessions,
  listThreads,
  saveThreadDefaults,
  updateThreadConfig,
} from "../api/chat";

const MODEL_OPTIONS = [
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
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

  const [sessionId, setSessionId] = useState(
    () => localStorage.getItem("mcp_session_id") || ""
  );
  const [threadId, setThreadId] = useState(
    () => localStorage.getItem("mcp_thread_id") || ""
  );
  const [threadName, setThreadName] = useState(
    () => localStorage.getItem("mcp_thread_name") || "Personalized Chat"
  );
  const [threads, setThreads] = useState([]);
  const [threadSearch, setThreadSearch] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [defaultsOpen, setDefaultsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(getSavedApiKey);
  const [model, setModel] = useState(
    () => localStorage.getItem("mcp_model") || MODEL_OPTIONS[0]
  );
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [pageError, setPageError] = useState("");

  const {
    messages,
    isStreaming,
    error: chatError,
    lastLatencyMs,
    sendMessage,
    replaceMessages,
    copyTranscript,
  } = useChat({
    sessionId,
    threadId,
    modelName: model,
    chatEndpoint: "/chat",
    storagePrefix: "mcp_personalized_messages",
  });

  // Verify auth on mount
  useEffect(() => {
    if (!getAuthToken()) {
      navigate("/");
    }
  }, [navigate]);

  // Sync threads and sessions
  const refreshThreads = useCallback(async () => {
    setLoadingThreads(true);
    setPageError("");
    try {
      // Check existing sessions if not present in localStorage
      if (!sessionId) {
        try {
          const sessionsRes = await listSessions();
          const list = sessionsRes.data?.data || sessionsRes.data || [];
          if (list.length > 0) {
            const resolvedId = list[0].session_id || list[0]._id;
            setSessionId(resolvedId);
            localStorage.setItem("mcp_session_id", resolvedId);
          }
        } catch {
          // ignore session listing error
        }
      }

      const res = await listThreads();
      const list = res.data?.threads || [];
      setThreads(list);

      if (list.length > 0 && !threadId) {
        const first = list[0];
        setThreadId(first.thread_id);
        setThreadName(first.thread_name || "New Chat");
        localStorage.setItem("mcp_thread_id", first.thread_id);
      }
    } catch (err) {
      console.error(err);
      setPageError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Unable to load thread history."
      );
    } finally {
      setLoadingThreads(false);
    }
  }, [sessionId, threadId]);

  useEffect(() => {
    refreshThreads();
  }, [refreshThreads]);

  // Load messages whenever threadId changes
  useEffect(() => {
    if (!threadId) {
      return;
    }
    getThreadMessages(threadId)
      .then((res) => {
        const msgs = res.data?.messages || [];
        if (msgs.length > 0) {
          replaceMessages(msgs);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }, [replaceMessages, threadId]);

  // Auto-scroll on new tokens
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectThread = (item) => {
    setThreadId(item.thread_id);
    setThreadName(item.thread_name || "New Chat");
    localStorage.setItem("mcp_thread_id", item.thread_id);
    localStorage.setItem("mcp_thread_name", item.thread_name || "New Chat");
    setSidebarOpen(false);
  };

  const handleCreateNewThread = async () => {
    const key = apiKey.trim();
    if (!key) {
      setDefaultsOpen(true);
      return;
    }

    setPageError("");
    try {
      const activeSessionId = sessionId || `session_${Date.now()}`;
      const res = await createThread({
        session_id: activeSessionId,
        model_name: model,
        apiKey: key,
        mcp_servers: [],
      });

      const nextId = res.data?.thread_id;
      if (!nextId) throw new Error("Backend did not return a thread ID.");

      const nextName = res.data?.thread_name || "New Chat";
      setThreadId(nextId);
      setThreadName(nextName);
      localStorage.setItem("mcp_thread_id", nextId);
      localStorage.setItem("mcp_thread_name", nextName);
      replaceMessages([]);
      setThreads((prev) => [
        { thread_id: nextId, thread_name: nextName, created_at: new Date().toISOString() },
        ...prev,
      ]);
      setSidebarOpen(false);
    } catch (err) {
      console.error(err);
      setPageError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          "Failed to create thread. (If session is required by backend, verify session ID)."
      );
    }
  };

  const handleCopyTranscript = async () => {
    await copyTranscript();
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  const filteredThreads = threads.filter((t) => {
    if (!threadSearch.trim()) return true;
    return (t.thread_name || "")
      .toLowerCase()
      .includes(threadSearch.trim().toLowerCase());
  });

  return (
    <div className="h-screen flex flex-col bg-slate-900/5 dark:bg-slate-950/40 text-slate-900 dark:text-white transition-colors duration-300 overflow-hidden">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex gap-4 min-h-0 overflow-hidden">
        {/* Sidebar: Threads & Model */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-72 glass-card p-4 flex flex-col transform transition-transform duration-200 lg:static lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10 lg:hidden">
            <span className="text-xs font-bold text-slate-800 dark:text-white">
              Personalized Threads
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleCreateNewThread}
            className="w-full mt-2 lg:mt-0 mb-3.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all"
          >
            <PlusIcon className="w-4 h-4" />
            <span>New Chat Thread</span>
          </button>

          {/* Search Threads */}
          <div className="relative mb-3">
            <MagnifyingGlassIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={threadSearch}
              onChange={(e) => setThreadSearch(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl glass-input text-xs"
            />
          </div>

          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Recent Threads ({filteredThreads.length})
            </span>
            <button
              onClick={refreshThreads}
              title="Refresh Threads"
              className="text-slate-400 hover:text-slate-200"
            >
              <ArrowPathIcon className={`w-3.5 h-3.5 ${loadingThreads ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Thread List */}
          <div className="flex-1 overflow-y-auto scroll-area space-y-1.5 pr-1">
            {loadingThreads ? (
              <p className="p-3 text-xs text-slate-400 text-center">Loading threads...</p>
            ) : filteredThreads.length === 0 ? (
              <p className="p-3 text-xs text-slate-400 text-center">
                {threadSearch ? "No matching chats." : "No saved chats yet."}
              </p>
            ) : (
              filteredThreads.map((item) => {
                const active = item.thread_id === threadId;
                return (
                  <button
                    key={item.thread_id}
                    onClick={() => selectThread(item)}
                    className={`w-full p-2.5 rounded-xl text-left transition-all text-xs font-medium ${
                      active
                        ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:bg-white/30 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="truncate font-semibold">
                      {item.thread_name || "New Chat"}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                      {item.thread_id.slice(0, 16)}...
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Main Chat Workspace */}
        <section className="flex-1 flex flex-col min-w-0 glass-card overflow-hidden">
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-xl glass-subtle lg:hidden text-slate-600 dark:text-slate-300"
              >
                <Bars3Icon className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0">
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  {threadName}
                </h1>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span>{model}</span>
                  {lastLatencyMs && (
                    <span className="text-emerald-500 flex items-center gap-0.5">
                      <BoltIcon className="w-3 h-3" />
                      {lastLatencyMs}ms
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDefaultsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-subtle text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                title="Configure API Key and Model"
              >
                <KeyIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Settings</span>
              </button>

              <button
                type="button"
                onClick={handleCopyTranscript}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-subtle text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white/40 transition-colors"
                title="Copy Chat Transcript"
              >
                {copiedTranscript ? (
                  <>
                    <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="hidden sm:inline text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Transcript</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {(pageError || chatError) && (
            <div className="p-3 bg-rose-500/10 border-b border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center justify-between">
              <span>{pageError || chatError}</span>
              <button
                onClick={() => setPageError("")}
                className="text-rose-400 hover:text-rose-600"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Messages Stream Area */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto scroll-area p-4 sm:p-6 space-y-4"
          >
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {isStreaming && (
              <div className="flex items-center gap-2 text-xs text-indigo-500 animate-fade">
                <span className="w-2 h-2 rounded-full bg-indigo-500 streaming-dot"></span>
                <span className="font-medium">Streaming agent response...</span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Message Input Bar */}
          <div className="shrink-0">
            <MessageInput onSend={sendMessage} disabled={isStreaming} />
          </div>
        </section>
      </div>

      {/* Settings Modal */}
      <ThreadDefaultsModal
        open={defaultsOpen}
        apiKey={apiKey}
        setApiKey={setApiKey}
        model={model}
        setModel={setModel}
        onSave={() => {
          saveThreadDefaults({ apiKey: apiKey.trim(), modelName: model });
          setApiKey(apiKey.trim());
          setDefaultsOpen(false);
        }}
        onClose={() => setDefaultsOpen(false)}
      />
    </div>
  );
}
