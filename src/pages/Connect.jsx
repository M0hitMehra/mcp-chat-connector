import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusIcon,
  TrashIcon,
  ServerStackIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

import api from "../api/chat";

const DEFAULT_MCP_URL =
  "https://mcp-server-company-details.onrender.com/mcp";

export default function Connect() {

  const sessionId = localStorage.getItem("mcp_session_id");
  const navigate = useNavigate();

  const [apiKey, setApiKey] = useState("");

  const [model, setModel] = useState(
    "gemini-2.5-flash"
  );

  const [mcpServers, setMcpServers] = useState([
    {
      name: "Company Details",
      url: DEFAULT_MCP_URL,
    },
  ]);

  const [showApiKey, setShowApiKey] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // -----------------------------------------
  // Add MCP Server
  // -----------------------------------------

  const addMcpServer = () => {
    setMcpServers((current) => [
      ...current,
      {
        name: "",
        url: "",
      },
    ]);
  };

  // -----------------------------------------
  // Remove MCP Server
  // -----------------------------------------

  const removeMcpServer = (index) => {
    setMcpServers((current) =>
      current.filter((_, currentIndex) => {
        return currentIndex !== index;
      })
    );
  };

  // -----------------------------------------
  // Update MCP Server
  // -----------------------------------------

  const updateMcpServer = (
    index,
    field,
    value
  ) => {
    setMcpServers((current) =>
      current.map((server, currentIndex) => {
        if (currentIndex !== index) {
          return server;
        }

        return {
          ...server,
          [field]: value,
        };
      })
    );
  };

  // -----------------------------------------
  // Validate
  // -----------------------------------------

  const validate = () => {
    if (!apiKey.trim()) {
      return "Gemini API key is required.";
    }

    if (!model.trim()) {
      return "Gemini model is required.";
    }

    if (mcpServers.length === 0) {
      return "Add at least one MCP server.";
    }

    for (let i = 0; i < mcpServers.length; i++) {
      const server = mcpServers[i];

      if (!server.name.trim()) {
        return `MCP server ${i + 1} needs a name.`;
      }

      if (!server.url.trim()) {
        return `MCP server ${i + 1} needs a URL.`;
      }

      try {
        new URL(server.url);
      } catch {
        return `MCP server ${i + 1} has an invalid URL.`;
      }
    }

    return null;
  };

  // -----------------------------------------
  // Connect
  // -----------------------------------------

  const handleConnect = async (event) => {
    event.preventDefault();

    setError("");

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        api_key: apiKey.trim(),

        model,

        thread_id: crypto.randomUUID(),

        mcp_servers: mcpServers.map(
          (server) => ({
            name: server.name.trim(),
            url: server.url.trim(),
          })
        ),
      };

      const response = await api.post(
        "/connect",
        payload
      );

      const sessionId =
        response.data.session_id;

      if (!sessionId) {
        throw new Error(
          "Backend did not return a session ID."
        );
      }

      localStorage.setItem(
        "mcp_session_id",
        sessionId
      );

      navigate("/chat");
    } catch (err) {
      console.error(err);

      const message =
        err.response?.data?.detail ||
        err.message ||
        "Unable to connect.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };


  
    useEffect(() => {
      if (sessionId) {
        navigate("/chat");
        
      }
    }, [sessionId, navigate]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-5 py-12">

        <div className="w-full">

          {/* Header */}

          <div className="mb-8 text-center">

            <div className="mb-4 flex justify-center">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <ServerStackIcon className="h-8 w-8" />
              </div>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight">
              MCP Playground
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Connect Gemini to your MCP servers
              and start chatting.
            </p>

          </div>

          {/* Card */}

          <form
            onSubmit={handleConnect}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl"
          >

            {/* Gemini API Key */}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Gemini API Key
              </label>

              <div className="relative">

                <input
                  type={
                    showApiKey
                      ? "text"
                      : "password"
                  }
                  value={apiKey}
                  onChange={(event) =>
                    setApiKey(
                      event.target.value
                    )
                  }
                  placeholder="Enter Gemini API key"
                  autoComplete="off"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 pr-12 outline-none transition focus:border-zinc-500"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowApiKey(
                      (current) => !current
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-100"
                >

                  {showApiKey ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}

                </button>

              </div>

              <p className="mt-2 text-xs text-zinc-500">
                The key is sent to your backend
                to create the Gemini agent.
              </p>
            </div>

            {/* Model */}

            <div className="mt-6">

              <label className="mb-2 block text-sm font-medium">
                Gemini Model
              </label>

              <select
                value={model}
                onChange={(event) =>
                  setModel(event.target.value)
                }
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none focus:border-zinc-500"
              >
                <option value="gemini-2.5-flash">
                  gemini-2.5-flash
                </option>

                <option value="gemini-2.5-pro">
                  gemini-2.5-pro
                </option>

                <option value="gemini-3.1-flash-lite">
                  gemini-3.1-flash-lite
                </option>
              </select>

            </div>

            {/* MCP Servers */}

            <div className="mt-8">

              <div className="mb-4 flex items-center justify-between">

                <div>
                  <h2 className="font-medium">
                    MCP Servers
                  </h2>

                  <p className="text-xs text-zinc-500">
                    Add one or more Streamable
                    HTTP MCP endpoints.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addMcpServer}
                  className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm transition hover:bg-zinc-800"
                >
                  <PlusIcon className="h-4 w-4" />

                  Add MCP
                </button>

              </div>

              <div className="space-y-4">

                {mcpServers.map(
                  (server, index) => (

                    <div
                      key={index}
                      className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                    >

                      <div className="mb-3 flex items-center justify-between">

                        <span className="text-sm font-medium text-zinc-300">
                          Server {index + 1}
                        </span>

                        {mcpServers.length >
                          1 && (
                          <button
                            type="button"
                            onClick={() =>
                              removeMcpServer(
                                index
                              )
                            }
                            className="text-zinc-500 transition hover:text-red-400"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}

                      </div>

                      <input
                        value={server.name}
                        onChange={(event) =>
                          updateMcpServer(
                            index,
                            "name",
                            event.target.value
                          )
                        }
                        placeholder="Server name"
                        className="mb-3 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm outline-none focus:border-zinc-600"
                      />

                      <input
                        value={server.url}
                        onChange={(event) =>
                          updateMcpServer(
                            index,
                            "url",
                            event.target.value
                          )
                        }
                        placeholder="https://your-server.com/mcp"
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm outline-none focus:border-zinc-600"
                      />

                    </div>

                  )
                )}

              </div>

            </div>

            {/* Error */}

            {error && (
              <div className="mt-5 rounded-xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Connect */}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-white px-4 py-3 font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {loading
                ? "Connecting to MCP..."
                : "Connect"}

            </button>

          </form>

        </div>

      </div>
    </div>
  );
}