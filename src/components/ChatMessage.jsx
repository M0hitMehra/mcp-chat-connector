import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  CheckIcon,
  ClipboardDocumentIcon,
  CpuChipIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

export default function ChatMessage({ message, isStreaming = false }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <article
      className={`animate-rise flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`mt-1 hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] sm:flex ${
          isUser
            ? "bg-[var(--accent)] text-[var(--app-bg)]"
            : "bg-[var(--panel-strong)] text-[var(--accent)]"
        }`}
      >
        {isUser ? (
          <UserCircleIcon className="h-5 w-5" />
        ) : (
          <CpuChipIcon className="h-5 w-5" />
        )}
      </div>

      <div
        className={`min-w-0 max-w-[94%] rounded-lg border px-4 py-3 sm:max-w-[82%] ${
          isUser
            ? "border-transparent bg-[var(--accent)] text-[var(--app-bg)]"
            : "border-[var(--border)] bg-[var(--panel-strong)] text-[var(--text)]"
        }`}
      >
        <div
          className={`mb-2 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.12em] ${
            isUser ? "text-[var(--app-bg)]/75" : "text-[var(--faint)]"
          }`}
        >
          <span>{isUser ? "You" : "Assistant"}</span>
          {message.createdAt && (
            <time className="shrink-0 normal-case tracking-normal opacity-70">
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          )}
        </div>

        {isUser ? (
          <div className="whitespace-pre-wrap break-words text-sm leading-6">
            {message.content}
          </div>
        ) : (
          <div className="markdown-content text-sm leading-7">
            {message.content ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1({ children }) {
                    return (
                      <h1 className="mb-3 mt-4 text-2xl font-semibold text-[var(--text)]">
                        {children}
                      </h1>
                    );
                  },
                  h2({ children }) {
                    return (
                      <h2 className="mb-3 mt-4 text-xl font-semibold text-[var(--text)]">
                        {children}
                      </h2>
                    );
                  },
                  h3({ children }) {
                    return (
                      <h3 className="mb-2 mt-4 text-base font-semibold text-[var(--text)]">
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
                      <ul className="my-3 list-disc space-y-1 pl-5">
                        {children}
                      </ul>
                    );
                  },
                  ol({ children }) {
                    return (
                      <ol className="my-3 list-decimal space-y-1 pl-5">
                        {children}
                      </ol>
                    );
                  },
                  li({ children }) {
                    return <li className="text-[var(--text)]">{children}</li>;
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="my-4 border-l-2 border-[var(--accent)] pl-4 text-[var(--muted)]">
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
                        className="font-medium text-[var(--accent)] underline underline-offset-4"
                      >
                        {children}
                      </a>
                    );
                  },
                  code({ inline, children, ...props }) {
                    if (inline) {
                      return (
                        <code
                          className="rounded-md bg-[var(--panel-muted)] px-1.5 py-0.5 font-mono text-xs text-[var(--text)]"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }

                    return (
                      <code
                        className="block overflow-x-auto font-mono text-sm"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  pre({ children }) {
                    return (
                      <pre className="my-4 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--panel-muted)] p-4 text-sm">
                        {children}
                      </pre>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="my-4 overflow-x-auto rounded-lg border border-[var(--border)]">
                        <table className="w-full border-collapse text-left text-sm">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  th({ children }) {
                    return (
                      <th className="border-b border-[var(--border)] bg-[var(--panel-muted)] px-3 py-2 font-medium">
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
                    return <hr className="my-5 border-[var(--border)]" />;
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              <div className="flex items-center gap-1 py-2">
                <span className="streaming-dot h-2 w-2 rounded-full bg-[var(--accent)]" />
                <span className="streaming-dot h-2 w-2 rounded-full bg-[var(--accent)] [animation-delay:120ms]" />
                <span className="streaming-dot h-2 w-2 rounded-full bg-[var(--accent)] [animation-delay:240ms]" />
              </div>
            )}

            {!isStreaming && message.content && (
              <button
                type="button"
                onClick={copyMessage}
                title="Copy message"
                className="mt-3 flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-[var(--muted)] transition hover:bg-[var(--panel-muted)] hover:text-[var(--text)]"
              >
                {copied ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <ClipboardDocumentIcon className="h-4 w-4" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
