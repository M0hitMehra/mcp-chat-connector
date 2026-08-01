import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  ClipboardDocumentIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

export default function ChatMessage({
  message,
  isStreaming = false,
}) {
  const isUser = message.role === "user";

  const [copied, setCopied] = useState(false);

const copyMessage = async () => {
  await navigator.clipboard.writeText(
    message.content
  );

  setCopied(true);

  setTimeout(() => {
    setCopied(false);
  }, 1500);
};  

  return (
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[90%] ${
          isUser
            ? "rounded-2xl bg-white px-4 py-3 text-black"
            : "w-full text-zinc-100"
        }`}
      >
        {/* Role */}

        <div
          className={`mb-2 text-xs font-medium ${
            isUser
              ? "text-zinc-600"
              : "text-zinc-500"
          }`}
        >
          {isUser ? "You" : "Assistant"}
        </div>

        {/* User */}

        {isUser ? (
          <div className="whitespace-pre-wrap break-words text-sm leading-6">
            {message.content}
          </div>
        ) : (
          <div className="markdown-content text-sm leading-7 text-wrap break-words ">

            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1({ children }) {
                  return (
                    <h1 className="mb-4 mt-6 text-2xl font-semibold">
                      {children}
                    </h1>
                  );
                },

                h2({ children }) {
                  return (
                    <h2 className="mb-3 mt-6 text-xl font-semibold">
                      {children}
                    </h2>
                  );
                },

                h3({ children }) {
                  return (
                    <h3 className="mb-2 mt-5 text-lg font-semibold">
                      {children}
                    </h3>
                  );
                },

                p({ children }) {
                  return (
                    <p className="my-3 leading-7 text-zinc-200">
                      {children}
                    </p>
                  );
                },

                strong({ children }) {
                  return (
                    <strong className="font-semibold text-white">
                      {children}
                    </strong>
                  );
                },

                ul({ children }) {
                  return (
                    <ul className="my-3 list-disc space-y-1 pl-6">
                      {children}
                    </ul>
                  );
                },

                ol({ children }) {
                  return (
                    <ol className="my-3 list-decimal space-y-1 pl-6">
                      {children}
                    </ol>
                  );
                },

                li({ children }) {
                  return (
                    <li className="text-zinc-200">
                      {children}
                    </li>
                  );
                },

                blockquote({ children }) {
                  return (
                    <blockquote className="my-4 border-l-4 border-zinc-700 pl-4 text-zinc-400">
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
                      className="text-blue-400 underline hover:text-blue-300"
                    >
                      {children}
                    </a>
                  );
                },

                code({
                  inline,
                  children,
                  ...props
                }) {
                  if (inline) {
                    return (
                      <code
                        className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-200"
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
                    <pre className="my-4 overflow-x-auto rounded-xl border border-zinc-800 bg-black p-4 text-sm">
                      {children}
                    </pre>
                  );
                },

                table({ children }) {
                  return (
                    <div className="my-5 overflow-x-auto">
                      <table className="w-full border-collapse text-left text-sm">
                        {children}
                      </table>
                    </div>
                  );
                },

                thead({ children }) {
                  return (
                    <thead className="bg-zinc-800">
                      {children}
                    </thead>
                  );
                },

                th({ children }) {
                  return (
                    <th className="border border-zinc-700 px-4 py-2 font-medium">
                      {children}
                    </th>
                  );
                },

                td({ children }) {
                  return (
                    <td className="border border-zinc-800 px-4 py-2 text-zinc-300">
                      {children}
                    </td>
                  );
                },

                hr() {
                  return (
                    <hr className="my-6 border-zinc-800" />
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>

            {/* Streaming cursor */}

           {!isStreaming && message.content && (
  <div className="mt-3">
    <button
      type="button"
      onClick={copyMessage}
      className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-300"
    >
      {copied ? (
        <>
          <CheckIcon className="h-4 w-4" />
          Copied
        </>
      ) : (
        <>
          <ClipboardDocumentIcon className="h-4 w-4" />
          Copy
        </>
      )}
    </button>
  </div>
)}

          </div>
        )}
      </div>
    </div>
  );
}