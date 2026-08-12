import { useCallback, useMemo, useState, useRef } from "react";
import { API_URL, getAuthHeaders } from "../api/chat";

const createWelcomeMessage = () => ({
  id: crypto.randomUUID(),
  role: "assistant",
  content:
    "### Agent Ready\nAsk anything or prompt the model to leverage your configured **MCP Tools** (database lookups, company details, external APIs).",
  createdAt: new Date().toISOString(),
});

const normalizeMessage = (message) => ({
  id: message.id || message._id || crypto.randomUUID(),
  role: message.role,
  content: message.content || "",
  createdAt: message.createdAt || message.created_at || new Date().toISOString(),
});

const createStorageKey = (sessionId, threadId) =>
  sessionId && threadId
    ? `mcp_chat_messages_${sessionId}_${threadId}`
    : "mcp_chat_messages_draft";

const loadStoredMessages = (storageKey) => {
  const savedMessages = localStorage.getItem(storageKey);

  if (!savedMessages) {
    return [createWelcomeMessage()];
  }

  try {
    const parsedMessages = JSON.parse(savedMessages);
    return Array.isArray(parsedMessages) && parsedMessages.length > 0
      ? parsedMessages.map(normalizeMessage)
      : [createWelcomeMessage()];
  } catch {
    return [createWelcomeMessage()];
  }
};

const createMarkdownTranscript = (messages) =>
  messages
    .map((message) => {
      const label = message.role === "user" ? "### User" : "### Assistant";
      const time = message.createdAt
        ? new Date(message.createdAt).toLocaleString()
        : "";

      return `${label} (${time})\n${message.content}`;
    })
    .join("\n\n---\n\n");

export default function useChat({ sessionId, threadId, modelName }) {
  const storageKey = useMemo(
    () => createStorageKey(sessionId, threadId),
    [sessionId, threadId]
  );

  const [messages, setMessages] = useState(() => loadStoredMessages(storageKey));
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const [lastLatencyMs, setLastLatencyMs] = useState(null);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);

  const startTimeRef = useRef(null);

  const persistMessages = useCallback(
    (nextMessages) => {
      localStorage.setItem(storageKey, JSON.stringify(nextMessages));
    },
    [storageKey]
  );

  const replaceMessages = useCallback(
    (nextMessages) => {
      const normalizedMessages =
        nextMessages && nextMessages.length > 0
          ? nextMessages.map(normalizeMessage)
          : [createWelcomeMessage()];

      setMessages(normalizedMessages);
      persistMessages(normalizedMessages);
      setError("");
    },
    [persistMessages]
  );

  const appendToken = useCallback(
    (assistantId, token) => {
      setMessages((current) => {
        const nextMessages = current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: message.content + token,
              }
            : message
        );

        persistMessages(nextMessages);
        return nextMessages;
      });
    },
    [persistMessages]
  );

  const readStream = useCallback(
    async (response, assistantId) => {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          const lines = event.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data:")) {
              continue;
            }

            const data = line.slice(5).trim();

            if (!data || data === "[DONE]") {
              continue;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.error) {
                setError(parsed.error);
                continue;
              }

              const token =
                parsed.token || parsed.content || parsed.delta || "";

              if (token) {
                appendToken(assistantId, token);
              }
            } catch {
              appendToken(assistantId, data);
            }
          }
        }
      }
    },
    [appendToken]
  );

  const sendMessage = useCallback(
    async (message) => {
      const text = message.trim();

      if (!text || isStreaming) {
        return;
      }

      if (!sessionId || !threadId) {
        setError("Active session or thread missing. Please connect again.");
        return;
      }

      setError("");
      startTimeRef.current = performance.now();

      const userMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      };

      const assistantId = crypto.randomUUID();
      const assistantMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      };

      setMessages((current) => {
        const nextMessages = [...current, userMessage, assistantMessage];
        persistMessages(nextMessages);
        return nextMessages;
      });
      setIsStreaming(true);

      try {
        const response = await fetch(`${API_URL}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            session_id: sessionId,
            thread_id: threadId,
            model_name: modelName,
            message: text,
          }),
        });

        if (!response.ok) {
          let errorMessage = "Chat API request failed.";

          try {
            const data = await response.json();
            errorMessage = data.detail || data.message || errorMessage;
          } catch {
            errorMessage = response.statusText || errorMessage;
          }

          throw new Error(errorMessage);
        }

        if (!response.body) {
          throw new Error("Streaming response is not supported by standard fetch.");
        }

        await readStream(response, assistantId);

        if (startTimeRef.current) {
          const duration = Math.round(performance.now() - startTimeRef.current);
          setLastLatencyMs(duration);
        }
      } catch (requestError) {
        console.error(requestError);

        setError(requestError.message || "Unable to reach assistant agent.");

        setMessages((current) => {
          const nextMessages = current.map((currentMessage) =>
            currentMessage.id === assistantId
              ? {
                  ...currentMessage,
                  content: "⚠️ Unable to complete request. Please verify backend connection and API key configuration.",
                }
              : currentMessage
          );

          persistMessages(nextMessages);
          return nextMessages;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, modelName, persistMessages, readStream, sessionId, threadId]
  );

  const clearMessages = useCallback(() => {
    replaceMessages([]);
  }, [replaceMessages]);

  const copyTranscript = useCallback(async () => {
    await navigator.clipboard.writeText(createMarkdownTranscript(messages));
  }, [messages]);

  const downloadMarkdown = useCallback(() => {
    const transcript = createMarkdownTranscript(messages);
    const blob = new Blob([transcript], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    anchor.href = url;
    anchor.download = `mcp-thread-${threadId || "export"}-${timestamp}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [messages, threadId]);

  const downloadJson = useCallback(() => {
    const jsonStr = JSON.stringify(messages, null, 2);
    const blob = new Blob([jsonStr], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    anchor.href = url;
    anchor.download = `mcp-thread-${threadId || "export"}-${timestamp}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [messages, threadId]);

  const speakMessage = useCallback((messageId, text) => {
    if (!("speechSynthesis" in window)) {
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      if (speakingMessageId === messageId) {
        setSpeakingMessageId(null);
        return;
      }
    }

    const cleanText = text.replace(/[*_#`~[\]()]/g, "").trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(messageId);
    window.speechSynthesis.speak(utterance);
  }, [speakingMessageId]);

  return {
    messages,
    isStreaming,
    error,
    lastLatencyMs,
    speakingMessageId,
    sendMessage,
    clearMessages,
    copyTranscript,
    downloadMarkdown,
    downloadJson,
    speakMessage,
    replaceMessages,
  };
}
