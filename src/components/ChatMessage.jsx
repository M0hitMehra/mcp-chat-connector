import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  CheckIcon,
  ClipboardDocumentIcon,
  CpuChipIcon,
  SpeakerWaveIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

export default function ChatMessage({
  message,
  isStreaming = false,
  isSpeaking = false,
  onSpeak,
}) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const copyCodeSnippet = async (codeText, id) => {
    await navigator.clipboard.writeText(codeText);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 1400);
  };

  return (
    <article
      className={`animate-rise flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Role Avatar */}
      <div
        className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] ${
          isUser
            ? "bg-[var(--accent)] text-[var(--app-bg)] shadow-md"
            : "bg-[var(--panel-strong)] text-[var(--accent)] shadow-sm"
        }`}
      >
        {isUser ? (
          <UserCircleIcon className="h-5 w-5" />
        ) : (
          <CpuChipIcon className="h-5 w-5" />
        )}
      </div>

      {/* Message Bubble Card */}
      <div
        className={`min-w-0 max-w-[94%] rounded-2xl px-4 py-3.5 sm:max-w-[85%] shadow-sm ${
          isUser
            ? "bg-[var(--accent)] text-[var(--app-bg)]"
            : "border border-[var(--border)] bg-[var(--panel-strong)] text-[var(--text)]"
        }`}
      >
        {/* Header Metadata */}
        <div
          className={`mb-2 flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-wider ${
            isUser ? "text-[var(--app-bg)]/80" : "text-[var(--faint)]"
          }`}
        >
          <span>{isUser ? "You" : "MCP Assistant"}</span>
          {message.createdAt && (
            <time className="shrink-0 font-normal tracking-normal opacity-75">
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          )}
        </div>

        {/* Content Body */}
        {isUser ? (
          <div className="whitespace-pre-wrap break-words text-xs leading-relaxed sm:text-sm">
            {message.content}
          </div>
        ) : (
          <div className="markdown-content text-xs leading-relaxed sm:text-sm">
            {message.content ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1({ children }) {
                    return (
                      <h1 className="mb-2 mt-3 text-xl font-bold tracking-tight text-[var(--text)]">
                        {children}
                      </h1>
                    );
                  },
                  h2({ children }) {
                    return (
                      <h2 className="mb-2 mt-3 text-lg font-bold tracking-tight text-[var(--text)]">
                        {children}
                      </h2>
                    );
                  },
                  h3({ children }) {
                    return (
                      <h3 className="mb-1.5 mt-2.5 text-sm font-bold text-[var(--text)]">
                        {children}
                      </h3>
                    );
                  },
                  p({ children }) {
                    return <p className="text-[var(--text)]">{children}</p>;
                  },
                  strong({ children }) {
                    return (
                      <strong className="font-semibold text-[var(--text)]">
                        {children}
                      </strong>
                    );
                  },
                  ul({ children }) {
                    return (
                      <ul className="my-2 list-disc space-y-1 pl-5">
                        {children}
                      </ul>
                    );
                  },
                  ol({ children }) {
                    return (
                      <ol className="my-2 list-decimal space-y-1 pl-5">
                        {children}
                      </ol>
                    );
                  },
                  li({ children }) {
                    return <li className="text-[var(--text)]">{children}</li>;
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="my-3 border-l-2 border-[var(--accent)] pl-3 text-[var(--muted)] italic">
                        {children}
                      </blockquote>
                    );
                  },
                  a({ href, children }) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[var(--accent)] underline underline-offset-4"
                      >
                        {children}
                      </a>
                    );
                  },
                  code({ inline, children, ...props }) {
                    if (inline) {
                      return (
                        <code
                          className="rounded-md border border-[var(--border)] bg-[var(--panel-muted)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--text)]"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }

                    const codeString = String(children).replace(/\n$/, "");
                    const snippetId = String(Math.random());

                    return (
                      <div className="relative my-3 overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[#0d1117] text-slate-100">
                        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-3 py-1.5 font-mono text-[10px] text-slate-400">
                          <span>Code Snippet</span>
                          <button
                            type="button"
                            onClick={() => copyCodeSnippet(codeString, snippetId)}
                            className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-white"
                          >
                            {copiedCodeId === snippetId ? (
                              <CheckIcon className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <ClipboardDocumentIcon className="h-3 w-3" />
                            )}
                            <span>{copiedCodeId === snippetId ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                        <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed text-slate-200">
                          <code>{codeString}</code>
                        </pre>
                      </div>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="my-3 overflow-x-auto rounded-xl border border-[var(--border)]">
                        <table className="w-full border-collapse text-left text-xs">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  th({ children }) {
                    return (
                      <th className="border-b border-[var(--border)] bg-[var(--panel-muted)] px-3 py-2 font-semibold">
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return (
                      <td className="border-b border-[var(--border)] px-3 py-2">
                        {children}
                      </td>
                    );
                  },
                  hr() {
                    return <hr className="my-4 border-[var(--border)]" />;
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              <div className="flex items-center gap-1.5 py-2">
                <span className="streaming-dot h-2 w-2 rounded-full bg-[var(--accent)]" />
                <span className="streaming-dot h-2 w-2 rounded-full bg-[var(--accent)] [animation-delay:150ms]" />
                <span className="streaming-dot h-2 w-2 rounded-full bg-[var(--accent)] [animation-delay:300ms]" />
              </div>
            )}

            {/* Actions Bar */}
            {!isStreaming && message.content && (
              <div className="mt-3 flex items-center gap-2 border-t border-[var(--border)] pt-2">
                <button
                  type="button"
                  onClick={copyMessage}
                  title="Copy response text"
                  className="flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-medium text-[var(--muted)] hover:bg-[var(--panel-muted)] hover:text-[var(--text)] transition"
                >
                  {copied ? (
                    <CheckIcon className="h-3.5 w-3.5 text-[var(--emerald)]" />
                  ) : (
                    <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                  )}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>

                {onSpeak && (
                  <button
                    type="button"
                    onClick={onSpeak}
                    title="Text-to-speech audio reader"
                    className={`flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-medium transition ${
                      isSpeaking
                        ? "bg-[var(--accent-soft)] text-[var(--accent)] font-semibold animate-pulse"
                        : "text-[var(--muted)] hover:bg-[var(--panel-muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    <SpeakerWaveIcon className="h-3.5 w-3.5" />
                    <span>{isSpeaking ? "Speaking..." : "Read Aloud"}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
