import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeftIcon,
  ArrowPathIcon,
  SignalIcon,
} from "@heroicons/react/24/outline";

import {
  useNavigate,
} from "react-router-dom";

import ChatMessage from "../components/ChatMessage";
import MessageInput from "../components/MessageInput";

import useChat from "../hooks/useChat";

export default function Chat() {
  const navigate = useNavigate();

  const bottomRef = useRef(null);

  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
  } = useChat();

  const sessionId =
    localStorage.getItem(
      "mcp_session_id"
    );

  // -----------------------------------
  // Protect Chat Page
  // -----------------------------------

  useEffect(() => {
    if (!sessionId) {
      navigate("/");
    }
  }, [sessionId, navigate]);

  // -----------------------------------
  // Auto scroll
  // -----------------------------------

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // -----------------------------------
  // Disconnect
  // -----------------------------------

  const disconnect = async () => {
    const id = localStorage.getItem(
      "mcp_session_id"
    );

    if (id) {
      try {
        const apiUrl =
          import.meta.env.VITE_API_URL ||
          "http://localhost:8000";

        await fetch(
          `${apiUrl}/session/${id}`,
          {
            method: "DELETE",
          }
        );
      } catch (error) {
        console.error(
          "Unable to delete backend session:",
          error
        );
      }
    }

    localStorage.removeItem(
      "mcp_session_id"
    );

    navigate("/");
  };

  if (!sessionId) {
    return null;
  }

 const [totalSessions, setTotalSessions] = useState([]);
const [pageLoading, setPageLoading] = useState(true);

const fetchTotalSessions = async () => {
    try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
        
        const response = await fetch(`${apiUrl}/sessions`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        // Get stream reader
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let result = '';

        // Read all chunks (if streaming multiple chunks)
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            result += decoder.decode(value, { stream: true });
        }

        console.log('Raw response:', result); // String

        // ✅ Parse JSON
        const data = JSON.parse(result);
        console.log('Parsed data:', data);
        console.log('Sessions:', data?.sessions);
        
        // ✅ Update state with new array
        const sessions = data?.sessions || [];
        setTotalSessions([...sessions]); // Create new array reference
        
        console.log('Total sessions length:', sessions.length);

    } catch (error) {
        console.error("Unable to fetch total sessions:", error);
        setTotalSessions([]);
    } finally {
        setPageLoading(false);
    }
};

useEffect(() => {
    fetchTotalSessions();
}, []);

  return (
    pageLoading ? (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="text-lg font-medium">Loading...</div>
      </div>
    ) : (

  

    <div className="flex h-screen bg-zinc-950 text-zinc-100">

      {/* Sidebar */}

      <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900 md:flex">

        <div className="border-b border-zinc-800 p-4">
          <h1 className="font-semibold">
            MCP Playground
          </h1>

          <p className="mt-1 text-xs text-zinc-500">
            Personal MCP client
          </p>
        </div>

        <div className="flex-1 p-3">

          <button
            onClick={clearMessages}
            disabled={isStreaming}
            className="flex w-full items-center gap-2 rounded-xl border border-zinc-700 px-3 py-2.5 text-sm transition hover:bg-zinc-800 disabled:opacity-40"
          >
            <ArrowPathIcon className="h-4 w-4" />
 
Clear Screen          </button>

          <div className="mt-4 rounded-xl bg-zinc-950 p-3">

            <div className="flex items-center gap-2 text-sm">
              <SignalIcon className="h-4 w-4 text-green-400" />

              Connected
            </div>

            <div className="mt-2 truncate text-xs text-zinc-600">
             {sessionId}
            </div>


          </div>

          
            { 
              totalSessions.length > 0 && (
                <div className="mt-2 text-xs text-zinc-600">
                  Total Sessions: {totalSessions.length}
                </div>
                
              )
              
            
                }

                {
                  totalSessions.map((session, index) => (
                    <div key={index} className="mt-1 truncate text-xs text-zinc-600">
                      Session {index + 1}: {session}
                    </div>
                  ))
                }
             

        </div>

        <div className="border-t border-zinc-800 p-3">

          <button
            onClick={disconnect}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            <ArrowLeftIcon className="h-4 w-4" />

            Disconnect
          </button>

        </div>

      </aside>

      {/* Main */}

      <main className="flex min-w-0 flex-1 flex-col">

        {/* Header */}

        <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 px-5">

          <div>
            <h2 className="font-medium">
              MCP Chat
            </h2>

            <p className="text-xs text-zinc-500">
              Gemini + MCP
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400">

            <div className="h-2 w-2 rounded-full bg-green-500" />

            Connected

          </div>

        </header>

        {/* Messages */}

        <div className="flex-1 overflow-y-auto">

          <div className="mx-auto flex max-w-4xl flex-col gap-5 px-5 py-8">

            {messages.map(
              (message, index) => {

                const isLast =
                  index ===
                  messages.length - 1;

                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isStreaming={
                      isStreaming &&
                      isLast &&
                      message.role ===
                        "assistant"
                    }
                  />
                );
              }
            )}

            {error && (
              <div className="rounded-xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div ref={bottomRef} />

          </div>

        </div>

        {/* Input */}

        <MessageInput
          onSend={sendMessage}
          disabled={isStreaming}
        />

      </main>

    </div>

    )
  );
}