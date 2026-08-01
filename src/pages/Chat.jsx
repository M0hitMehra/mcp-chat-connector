import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  Bars3Icon,
  ClipboardDocumentIcon,
  CloudArrowDownIcon,
  MoonIcon,
  SignalIcon,
  SunIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import { deleteSession, listSessions } from "../api/chat";
import ChatMessage from "../components/ChatMessage";
import MessageInput from "../components/MessageInput";
import useChat from "../hooks/useChat";
import useTheme from "../hooks/useTheme";

export default function Chat() {
  const navigate = useNavigate();
  const bottomRef = useRef(null);
  const sessionId = localStorage.getItem("mcp_session_id");
  const { isDark, toggleTheme } = useTheme();

  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
    copyTranscript,
    downloadTranscript,
  } = useChat(sessionId);

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [transcriptCopied, setTranscriptCopied] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      navigate("/");
    }
  }, [sessionId, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  useEffect(() => {
    let active = true;

    const fetchSessions = async () => {
      try {
        const response = await listSessions();

        if (!active) {
          return;
        }

        setSessions(response.data?.sessions || []);
      } catch (sessionError) {
        console.error("Unable to fetch sessions:", sessionError);
        setSessions([]);
      } finally {
        if (active) {
          setSessionsLoading(false);
        }
      }
    };

    fetchSessions();

    return () => {
      active = false;
    };
  }, []);

  const disconnect = async () => {
    if (sessionId) {
      try {
        await deleteSession(sessionId);
      } catch (sessionError) {
        console.error("Unable to delete backend session:", sessionError);
      }
    }

    localStorage.removeItem("mcp_session_id");
    navigate("/");
  };

  const handleCopyTranscript = async () => {
    await copyTranscript();
    setTranscriptCopied(true);
    setTimeout(() => setTranscriptCopied(false), 1400);
  };

  if (!sessionId) {
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
          <div>
            <h1 className="text-lg font-semibold tracking-normal">MCP Chat</h1>
            <p className="text-xs text-[var(--muted)]">Gemini + MCP</p>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            title="Close sidebar"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--panel-muted)] md:hidden"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="scroll-area flex-1 overflow-y-auto p-3">
        <button
          type="button"
          onClick={clearMessages}
          disabled={isStreaming}
          className="mb-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 text-sm font-medium transition hover:border-[var(--accent)] disabled:opacity-45"
        >
          <ArrowPathIcon className="h-4 w-4" />
          New chat
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
              Active sessions
            </h2>
            <span className="text-xs text-[var(--muted)]">
              {sessionsLoading ? "..." : sessions.length}
            </span>
          </div>

          <div className="space-y-2">
            {sessionsLoading ? (
              <div className="soft-panel rounded-lg p-3 text-sm text-[var(--muted)]">
                Loading sessions...
              </div>
            ) : sessions.length > 0 ? (
              sessions.slice(0, 8).map((session) => (
                <div
                  key={session}
                  className={`rounded-lg border px-3 py-2 font-mono text-xs ${
                    session === sessionId
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text)]"
                      : "border-[var(--border)] bg-[var(--panel)] text-[var(--muted)]"
                  }`}
                >
                  <div className="truncate">{session}</div>
                </div>
              ))
            ) : (
              <div className="soft-panel rounded-lg p-3 text-sm text-[var(--muted)]">
                No sessions returned
              </div>
            )}
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
          onClick={disconnect}
          className="flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium text-[var(--danger)] transition hover:bg-red-500/10"
        >
          <TrashIcon className="h-4 w-4" />
          Disconnect
        </button>
      </div>
    </div>
  );

  return (
    <div className="app-surface flex h-screen overflow-hidden text-[var(--text)]">
      <aside className="hidden w-72 shrink-0 border-r border-[var(--border)] md:block">
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
          <aside className="absolute inset-y-0 left-0 w-[86vw] max-w-80 animate-rise border-r border-[var(--border)]">
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
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] text-[var(--text)] md:hidden"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold tracking-normal">
                MCP Agent
              </h2>
              <p className="truncate text-xs text-[var(--muted)]">
                Streaming response session
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
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
              onClick={disconnect}
              title="Disconnect"
              className="hidden h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-3 text-sm font-medium text-[var(--muted)] transition hover:-translate-y-0.5 hover:text-[var(--danger)] sm:flex"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Exit
            </button>
          </div>
        </header>

        <section className="scroll-area flex-1 overflow-y-auto px-3 py-5 sm:px-5">
          <div className="mx-auto flex max-w-4xl flex-col gap-4">
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

            {error && (
              <div className="animate-fade rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-[var(--danger)]">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </section>

        <MessageInput onSend={sendMessage} disabled={isStreaming} />
      </main>
    </div>
  );
}
