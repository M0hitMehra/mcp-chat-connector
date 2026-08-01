import { useState } from "react";
import { API_URL } from "../api/chat";

export default function useChat() {
  const [messages, setMessages] = useState([
    {
      id: crypto.randomUUID(),
      role: "assistant",
        content:
          "Hi! I'm connected to your MCP agent. What would you like to test?",
    },
  ]);

  const [isStreaming, setIsStreaming] =
    useState(false);

  const [error, setError] = useState("");

  const sendMessage = async (message) => {
    const text = message.trim();

    if (!text || isStreaming) {
      return;
    }

    const sessionId = localStorage.getItem(
      "mcp_session_id"
    );

    if (!sessionId) {
      setError(
        "Session not found. Please connect again."
      );
      return;
    }

    setError("");

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    const assistantId = crypto.randomUUID();

    const assistantMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    setMessages((current) => [
      ...current,
      userMessage,
      assistantMessage,
    ]);

    setIsStreaming(true);

    try {
      const response = await fetch(
        `${API_URL}/chat`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            session_id: sessionId,
            message: text,
          }),
        }
      );

      if (!response.ok) {
        let errorMessage = "Chat request failed.";

        try {
          const data = await response.json();

          errorMessage =
            data.detail || errorMessage;
        } catch {
          // Response wasn't JSON.
        }

        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error(
          "Streaming response is not supported."
        );
      }

      const reader =
        response.body.getReader();

      const decoder = new TextDecoder();

      let buffer = "";

      while (true) {
        const { value, done } =
          await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, {
          stream: true,
        });

        /*
         * SSE events look like:
         *
         * data: {"token":"Hello"}
         *
         * data: {"token":" there"}
         *
         */

        const events = buffer.split("\n\n");

        // Last item might only be part of
        // the next SSE event.
        buffer = events.pop() || "";

        for (const event of events) {
          const lines = event.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data:")) {
              continue;
            }

            const data = line
              .slice(5)
              .trim();

            if (!data) {
              continue;
            }

            if (data === "[DONE]") {
              continue;
            }

            try {
              const parsed = JSON.parse(data);

              const token =
                parsed.token || "";

              if (!token) {
                continue;
              }

              setMessages((current) =>
                current.map((msg) =>
                  msg.id === assistantId
                    ? {
                        ...msg,
                        content:
                          msg.content + token,
                      }
                    : msg
                )
              );
            } catch (error) {
              console.error(
                "Unable to parse SSE event:",
                data,
                error
              );
            }
          }
        }
      }
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "Something went wrong."
      );

      setMessages((current) =>
        current.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content:
                  "Unable to get a response from the agent.",
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const clearMessages = () => {
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "New chat started. What would you like to test?",
      },
    ]);

    setError("");
  };

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
  };
}