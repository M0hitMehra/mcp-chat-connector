import { useEffect, useRef, useState } from "react";
import {
  MicrophoneIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/solid";

export default function MessageInput({ onSend, disabled }) {
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [message]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const submit = () => {
    const text = message.trim();
    if (!text || disabled) return;
    onSend(text);
    setMessage("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const charCount = message.length;

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--panel)] px-4 py-3.5 backdrop-blur-xl sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="glow-border flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-2.5 shadow-sm transition">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
            placeholder={
              disabled
                ? "Agent is streaming response..."
                : isListening
                ? "Listening... Speak into microphone..."
                : "Ask anything or invoke MCP tools..."
            }
            className="max-h-44 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2 text-xs leading-relaxed text-[var(--text)] outline-none placeholder:text-[var(--faint)] disabled:opacity-60 sm:text-sm"
          />

          {/* Voice Input Trigger (if browser supported) */}
          {recognitionRef.current && (
            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={disabled}
              title={isListening ? "Stop listening" : "Voice dictation"}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "text-[var(--muted)] hover:bg-[var(--panel-muted)] hover:text-[var(--text)]"
              }`}
            >
              <MicrophoneIcon className="h-5 w-5" />
            </button>
          )}

          {/* Send Action */}
          <button
            type="button"
            onClick={submit}
            disabled={disabled || !message.trim()}
            title="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--app-bg)] shadow-md shadow-[var(--accent-soft)] transition hover:bg-[var(--accent-hover)] active:scale-95 disabled:opacity-40"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--faint)] px-1">
          <span>Enter to send • Shift + Enter for line break</span>
          {charCount > 0 && <span>{charCount} chars</span>}
        </div>
      </div>
    </footer>
  );
}
