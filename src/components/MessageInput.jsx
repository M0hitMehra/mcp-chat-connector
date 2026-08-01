import { useState } from "react";
import {
  PaperAirplaneIcon,
} from "@heroicons/react/24/solid";

export default function MessageInput({
  onSend,
  disabled,
}) {
  const [message, setMessage] =
    useState("");

  const submit = () => {
    const text = message.trim();

    if (!text || disabled) {
      return;
    }

    onSend(text);

    setMessage("");
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      submit();
    }
  };

  return (
    <div className="border-t border-zinc-800 bg-zinc-950 p-4">
      <div className="mx-auto flex max-w-4xl items-end gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 p-2">

        <textarea
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          placeholder={
            disabled
              ? "Waiting for response..."
              : "Message your MCP agent..."
          }
          className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed"
        />

        <button
          type="button"
          onClick={submit}
          disabled={
            disabled || !message.trim()
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>

      </div>

      <div className="mx-auto mt-2 max-w-4xl text-center text-xs text-zinc-600">
        Enter to send · Shift + Enter for
        new line
      </div>
    </div>
  );
}