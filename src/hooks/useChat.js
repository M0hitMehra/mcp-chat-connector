import { useCallback, useEffect, useMemo, useState } from "react";
import { API_URL } from "../api/chat";

const createWelcomeMessage = () => ({
  id: crypto.randomUUID(),
  role: "assistant",
  content:
    "Connected. Ask anything, or let the agent use your MCP servers when a tool can help.",
  createdAt: new Date().toISOString(),
});

const createStorageKey = (sessionId) =>
  sessionId ? `mcp_chat_messages_${sessionId}` : "mcp_chat_messages_draft";

const createTranscript = (messages) =>
  messages
    .map((message) => {
      const label = message.role === "user" ? "You" : "Assistant";
      const time = message.createdAt
        ? new Date(message.createdAt).toLocaleString()
        : "";

      return `[${time}] ${label}\n${message.content}`;
    })
    .join("\n\n---\n\n");

export default function useChat(sessionId) {
  const storageKey = useMemo(() => createStorageKey(sessionId), [sessionId]);

  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem(storageKey);

    if (!savedMessages) {
      return [createWelcomeMessage()];
    }

    try {
      const parsedMessages = JSON.parse(savedMessages);

      return Array.isArray(parsedMessages) && parsedMessages.length > 0
        ? parsedMessages
        : [createWelcomeMessage()];
    } catch {
      return [createWelcomeMessage()];
    }
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  const appendToken = useCallback((assistantId, token) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === assistantId
          ? {
              ...message,
              content: message.content + token,
            }
          : message
      )
    );
  }, []);

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

      if (!sessionId) {
        setError("Session not found. Please connect again.");
        return;
      }

      setError("");

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

      setMessages((current) => [...current, userMessage, assistantMessage]);
      setIsStreaming(true);

      try {
        const response = await fetch(`${API_URL}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            session_id: sessionId,
            message: text,
          }),
        });

        if (!response.ok) {
          let errorMessage = "Chat request failed.";

          try {
            const data = await response.json();
            errorMessage = data.detail || errorMessage;
          } catch {
            errorMessage = response.statusText || errorMessage;
          }

          throw new Error(errorMessage);
        }

        if (!response.body) {
          throw new Error("Streaming response is not supported.");
        }

        await readStream(response, assistantId);
      } catch (requestError) {
        console.error(requestError);

        setError(requestError.message || "Something went wrong.");

        setMessages((current) =>
          current.map((currentMessage) =>
            currentMessage.id === assistantId
              ? {
                  ...currentMessage,
                  content: "Unable to get a response from the agent.",
                }
              : currentMessage
          )
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, readStream, sessionId]
  );

  const clearMessages = useCallback(() => {
    setMessages([createWelcomeMessage()]);
    setError("");
  }, []);

  const copyTranscript = useCallback(async () => {
    await navigator.clipboard.writeText(createTranscript(messages));
  }, [messages]);

  const downloadTranscript = useCallback(() => {
    const transcript = createTranscript(messages);
    const blob = new Blob([transcript], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    anchor.href = url;
    anchor.download = `mcp-chat-${timestamp}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [messages]);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
    copyTranscript,
    downloadTranscript,
  };
}
