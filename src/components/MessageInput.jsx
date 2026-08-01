import { useEffect, useRef, useState } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";

export default function MessageInput({ onSend, disabled }) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 176)}px`;
  }, [message]);

  const submit = () => {
    const text = message.trim();

    if (!text || disabled) {
      return;
    }

    onSend(text);
    setMessage("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--panel)] px-3 py-3 backdrop-blur-xl sm:px-5">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-end gap-2 rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] p-2 shadow-sm transition focus-within:border-[var(--accent)] focus-within:ring-4 focus-within:ring-[var(--accent-soft)] sm:gap-3">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
            placeholder={disabled ? "Waiting for response..." : "Message MCP agent..."}
            className="max-h-44 min-h-11 flex-1 resize-none bg-transparent px-3 py-2 text-sm leading-6 text-[var(--text)] outline-none placeholder:text-[var(--faint)] disabled:opacity-60"
          />

          <button
            type="button"
            onClick={submit}
            disabled={disabled || !message.trim()}
            title="Send message"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--app-bg)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] disabled:opacity-40"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-2 text-center text-xs text-[var(--faint)]">
          Enter to send, Shift + Enter for a new line
        </p>
      </div>
    </footer>
  );
}
