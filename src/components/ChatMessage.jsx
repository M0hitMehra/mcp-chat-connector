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
        className={`mt-1 flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border ${
          isUser
            ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20"
            : "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-white/10 shadow-sm"
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
        className={`min-w-0 max-w-[94%] rounded-2xl px-4 py-3.5 sm:max-w-[85%] shadow-sm transition-all ${
          isUser
            ? "bg-indigo-600 text-white shadow-indigo-600/15"
            : "border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 backdrop-blur-md"
        }`}
      >
        {/* Header Metadata */}
        <div
          className={`mb-2 flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-wider ${
            isUser ? "text-white/80" : "text-slate-500 dark:text-slate-400"
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
          <div className="whitespace-pre-wrap break-words text-xs leading-relaxed sm:text-sm font-medium">
            {message.content}
          </div>
        ) : (
          <div className="markdown-content text-xs leading-relaxed sm:text-sm text-slate-800 dark:text-slate-100">
            {message.content ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1({ children }) {
                    return (
                      <h1 className="mb-2 mt-3 text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {children}
                      </h1>
                    );
                  },
                  h2({ children }) {
                    return (
                      <h2 className="mb-2 mt-3 text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                        {children}
                      </h2>
                    );
                  },
                  h3({ children }) {
                    return (
                      <h3 className="mb-1.5 mt-2.5 text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {children}
                      </h3>
                    );
                  },
                  p({ children }) {
                    return (
                      <p className="my-1.5 text-slate-800 dark:text-slate-200 leading-relaxed">
                        {children}
                      </p>
                    );
                  },
                  strong({ children }) {
                    return (
                      <strong className="font-bold text-slate-950 dark:text-white">
                        {children}
                      </strong>
                    );
                  },
                  ul({ children }) {
                    return (
                      <ul className="my-2 list-disc pl-5 space-y-1 text-slate-800 dark:text-slate-200">
                        {children}
                      </ul>
                    );
                  },
                  ol({ children }) {
                    return (
                      <ol className="my-2 list-decimal pl-5 space-y-1 text-slate-800 dark:text-slate-200">
                        {children}
                      </ol>
                    );
                  },
                  li({ children }) {
                    return <li className="pl-0.5">{children}</li>;
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="my-2 border-l-2 border-indigo-500 pl-3 italic text-slate-600 dark:text-slate-400">
                        {children}
                      </blockquote>
                    );
                  },
                  code({ inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const codeText = String(children).replace(/\n$/, "");

                    if (!inline && match) {
                      const snippetId = `code_${Math.random().toString(36).substring(2, 9)}`;
                      const isSnippetCopied = copiedCodeId === snippetId;

                      return (
                        <div className="my-3 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 text-slate-100 shadow-md">
                          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-3.5 py-1.5 text-[11px] font-mono text-slate-400">
                            <span>{match[1]}</span>
                            <button
                              type="button"
                              onClick={() => copyCodeSnippet(codeText, snippetId)}
                              className="flex items-center gap-1 hover:text-white transition-colors"
                            >
                              {isSnippetCopied ? (
                                <>
                                  <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="scroll-area overflow-x-auto p-3 text-xs leading-relaxed font-mono">
                            <code>{children}</code>
                          </pre>
                        </div>
                      );
                    }

                    return (
                      <code
                        className="rounded px-1.5 py-0.5 font-mono text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : isStreaming ? (
              <span className="inline-flex items-center gap-1.5 text-slate-400 italic">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                <span>Generating response...</span>
              </span>
            ) : null}
          </div>
        )}

        {/* Message Actions */}
        {!isUser && message.content && (
          <div className="mt-3 flex items-center gap-2 border-t border-slate-100 dark:border-white/5 pt-2 text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={copyMessage}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {onSpeak && (
              <button
                type="button"
                onClick={() => onSpeak(message)}
                className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                  isSpeaking ? "text-indigo-600 dark:text-indigo-400 font-bold" : ""
                }`}
              >
                <SpeakerWaveIcon className="h-3.5 w-3.5" />
                <span>{isSpeaking ? "Speaking..." : "Read Aloud"}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
