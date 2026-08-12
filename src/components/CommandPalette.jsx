import { useEffect, useState } from "react";
import {
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  CloudArrowDownIcon,
  Cog6ToothIcon,
  CommandLineIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  PlusIcon,
  SunIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function CommandPalette({
  isOpen,
  onClose,
  threads = [],
  activeThreadId,
  onSelectThread,
  onCreateThread,
  onToggleTheme,
  isDark,
  onExportMarkdown,
  onExportJson,
  onOpenConfig,
  onCheckHealth,
  onLogout,
}) {
  const [query, setQuery] = useState("");
  const [healthStatus, setHealthStatus] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open
          onClose(true); // Call open trigger
        }
      }

      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredThreads = threads.filter((t) =>
    (t.thread_name || "New Chat").toLowerCase().includes(query.toLowerCase()) ||
    t.thread_id.toLowerCase().includes(query.toLowerCase())
  );

  const runHealthCheck = async () => {
    setCheckingHealth(true);
    setHealthStatus(null);
    try {
      const res = await onCheckHealth();
      setHealthStatus({ success: true, message: res.data?.message || "Backend Connected OK" });
    } catch (err) {
      setHealthStatus({ success: false, message: err.message || "Backend offline" });
    } finally {
      setCheckingHealth(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-16 backdrop-blur-sm sm:pt-24">
      <div className="glass-panel animate-scale w-full max-w-xl overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--panel-strong)] shadow-2xl">
        <div className="flex items-center border-b border-[var(--border)] px-4 py-3">
          <MagnifyingGlassIcon className="h-5 w-5 shrink-0 text-[var(--muted)]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search threads... (Esc to close)"
            className="w-full bg-transparent px-3 py-1 text-sm outline-none placeholder:text-[var(--faint)]"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--panel-muted)] hover:text-[var(--text)]"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="scroll-area max-h-[60vh] overflow-y-auto p-2">
          {/* Quick Actions */}
          <div className="p-2 text-[10px] font-bold uppercase tracking-wider text-[var(--faint)]">
            Quick Actions
          </div>

          <button
            type="button"
            onClick={() => {
              onCreateThread();
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-[var(--text)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)]">
              <PlusIcon className="h-4 w-4" />
            </div>
            <div className="flex-1 font-medium">Create New Thread</div>
            <kbd className="rounded border border-[var(--border)] bg-[var(--panel-muted)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--muted)]">
              New
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => {
              onToggleTheme();
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-[var(--text)] transition hover:bg-[var(--accent-soft)]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--panel-muted)] text-[var(--muted)]">
              {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
            </div>
            <div className="flex-1 font-medium">Switch to {isDark ? "Light Mode" : "Dark Mode"}</div>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenConfig();
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-[var(--text)] transition hover:bg-[var(--accent-soft)]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--panel-muted)] text-[var(--muted)]">
              <Cog6ToothIcon className="h-4 w-4" />
            </div>
            <div className="flex-1 font-medium">Thread Settings & MCP Config</div>
          </button>

          <button
            type="button"
            onClick={runHealthCheck}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-[var(--text)] transition hover:bg-[var(--accent-soft)]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--emerald-soft)] text-[var(--emerald)]">
              <HeartIcon className="h-4 w-4" />
            </div>
            <div className="flex-1 font-medium">Run Backend Health Diagnostic</div>
            {checkingHealth ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin text-[var(--muted)]" />
            ) : healthStatus ? (
              <span className={`text-xs font-semibold ${healthStatus.success ? 'text-[var(--emerald)]' : 'text-[var(--danger)]'}`}>
                {healthStatus.message}
              </span>
            ) : null}
          </button>

          <div className="my-2 border-t border-[var(--border)]" />

          {/* Export Actions */}
          <div className="p-2 text-[10px] font-bold uppercase tracking-wider text-[var(--faint)]">
            Export Options
          </div>
          <button
            type="button"
            onClick={() => {
              onExportMarkdown();
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-[var(--text)] transition hover:bg-[var(--accent-soft)]"
          >
            <CloudArrowDownIcon className="h-4 w-4 text-[var(--muted)]" />
            <span>Export Chat as Markdown (.md)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onExportJson();
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-[var(--text)] transition hover:bg-[var(--accent-soft)]"
          >
            <CloudArrowDownIcon className="h-4 w-4 text-[var(--muted)]" />
            <span>Export Chat as JSON (.json)</span>
          </button>

          <div className="my-2 border-t border-[var(--border)]" />

          {/* Thread List */}
          <div className="p-2 text-[10px] font-bold uppercase tracking-wider text-[var(--faint)]">
            Threads ({filteredThreads.length})
          </div>

          {filteredThreads.map((t) => (
            <button
              key={t.thread_id}
              type="button"
              onClick={() => {
                onSelectThread(t);
                onClose();
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                t.thread_id === activeThreadId
                  ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                  : "text-[var(--muted)] hover:bg-[var(--panel-muted)] hover:text-[var(--text)]"
              }`}
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1 truncate">
                <span className="truncate">{t.thread_name || "New Chat"}</span>
                <span className="ml-2 font-mono text-[10px] opacity-60">({t.thread_id.slice(0, 8)}...)</span>
              </div>
            </button>
          ))}

          <div className="my-2 border-t border-[var(--border)]" />

          <button
            type="button"
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-[var(--danger)] transition hover:bg-red-500/10"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--panel-muted)] px-4 py-2 text-[11px] text-[var(--muted)]">
          <div className="flex items-center gap-1.5">
            <CommandLineIcon className="h-3.5 w-3.5" />
            <span>Command Palette</span>
          </div>
          <div>Press <kbd className="rounded border border-[var(--border)] bg-[var(--panel-strong)] px-1 py-0.5 font-mono text-[10px]">Esc</kbd> to exit</div>
        </div>
      </div>
    </div>
  );
}
