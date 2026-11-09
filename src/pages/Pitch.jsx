import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  Bars3Icon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  CommandLineIcon,
  DocumentChartBarIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import Navbar from "../components/Navbar";
import {
  createPitchThread,
  getAuthToken,
  getPitchThreadMessages,
  getSavedApiKey,
  listPitchThreads,
  saveThreadDefaults,
  searchPitchCompanies,
  updatePitchThreadConfig,
} from "../api/chat";
import ChatMessage from "../components/ChatMessage";
import MessageInput from "../components/MessageInput";
import ThreadDefaultsModal from "../components/ThreadDefaultsModal";
import useChat from "../hooks/useChat";

const MODEL = "gemini-3.1-flash-lite";
const MODELS = ["gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.5-pro"];
const NAME_MAP_KEY = "mcp_pitch_company_names";

const readConfig = () => {
  try {
    return JSON.parse(localStorage.getItem("mcp_thread_config") || "{}");
  } catch {
    return {};
  }
};

const readNameMap = () => {
  try {
    return JSON.parse(localStorage.getItem(NAME_MAP_KEY) || "{}");
  } catch {
    return {};
  }
};

const threadLabel = (thread, names) => {
  const savedName = names[thread.thread_id];
  const apiName =
    thread.thread_name && thread.thread_name !== "New Chat"
      ? thread.thread_name
      : "";
  const date = thread.updated_at || thread.created_at;
  return (
    savedName ||
    apiName ||
    (date
      ? `Pitch · ${new Date(date).toLocaleDateString()}`
      : `Pitch · ${thread.thread_id.slice(0, 8)}`)
  );
};

function companyOptions(payload) {
  const result =
    payload?.data ?? payload?.companies ?? payload?.results ?? payload;
  const rows = Array.isArray(result) ? result : [result];
  return rows
    .filter(
      (row) =>
        row &&
        typeof row === "object" &&
        (row.cin || row.CIN || row.cin_number || row.id),
    )
    .map((row) => ({
      cin: row.cin || row.CIN || row.cin_number || row.id,
      companyName: row.companyName || row.company_name || row.name || "Company",
      status: row.status || "",
      type: row.type || "",
      rocCode: row.rocCode || row.roc_code || "",
    }));
}

export default function Pitch() {
  const navigate = useNavigate();
  const config = readConfig();
  const sessionId = localStorage.getItem("mcp_session_id") || "pitch_session";
  const [apiKey, setApiKey] = useState(getSavedApiKey);
  const [model, setModel] = useState(
    () => localStorage.getItem("mcp_model") || config.model_name || MODEL,
  );
  const [pitchThreads, setPitchThreads] = useState([]);
  const [companyNames, setCompanyNames] = useState(readNameMap);
  const companyNamesRef = useRef(companyNames);
  const [threadId, setThreadId] = useState("");
  const [threadName, setThreadName] = useState(
    "Choose a company for your pitch",
  );
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [defaultsOpen, setDefaultsOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [options, setOptions] = useState([]);
  const [selectedCin, setSelectedCin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const {
    messages,
    isStreaming,
    error: chatError,
    sendMessage,
    replaceMessages,
  } = useChat({
    sessionId,
    threadId,
    modelName: model,
    chatEndpoint: "/pitch/chat",
    storagePrefix: "mcp_pitch_messages",
  });

  useEffect(() => {
    if (!getAuthToken()) {
      navigate("/");
      return;
    }
    listPitchThreads()
      .then((response) => {
        const items = response.data?.threads || [];
        items.sort(
          (a, b) =>
            new Date(b.updated_at || b.created_at || 0) -
            new Date(a.updated_at || a.created_at || 0),
        );
        setPitchThreads(items);
        if (items.length) {
          const latest = items[0];
          setThreadId(latest.thread_id);
          setThreadName(threadLabel(latest, companyNamesRef.current));
        }
      })
      .catch((loadError) => {
        setError(
          loadError.response?.data?.detail || "Unable to load pitch history.",
        );
      })
      .finally(() => setLoadingHistory(false));
  }, [navigate]);

  useEffect(() => {
    if (!threadId) {
      replaceMessages([]);
      return;
    }
    getPitchThreadMessages(threadId)
      .then((response) => replaceMessages(response.data?.messages || []))
      .catch((loadError) =>
        setError(
          loadError.response?.data?.detail ||
            "Unable to load this pitch conversation.",
        ),
      );
  }, [replaceMessages, threadId]);

  const selectPitch = (thread) => {
    setThreadId(thread.thread_id);
    setThreadName(threadLabel(thread, companyNames));
    setError("");
    setSidebarOpen(false);
  };

  const startNewPitch = () => {
    setThreadId("");
    setThreadName("Choose a company for your pitch");
    setCompanyName("");
    setOptions([]);
    setSelectedCin("");
    setError("");
    replaceMessages([]);
    setSidebarOpen(false);
  };

  const search = async (event) => {
    event.preventDefault();
    setError("");
    setOptions([]);
    setSelectedCin("");
    if (companyName.trim().length < 2) {
      setError("Enter at least two characters of a company name.");
      return;
    }
    setBusy(true);
    try {
      const response = await searchPitchCompanies(companyName.trim());
      const found = companyOptions(response.data);
      setOptions(found);
      if (!found.length) {
        setError("No company CIN matches were returned. Try another company name.");
      } else if (found.length === 1) {
        setSelectedCin(String(found[0].cin));
      }
    } catch (searchError) {
      setError(
        searchError.response?.data?.detail ||
          searchError.response?.data?.message ||
          "Company search failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const createSelectedPitch = async () => {
    const company = options.find((item) => String(item.cin) === selectedCin);
    if (!company) return;

    if (!apiKey.trim()) {
      setDefaultsOpen(true);
      setError("Please set a Gemini API key before creating a pitch thread.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      saveThreadDefaults({ apiKey: apiKey.trim(), modelName: model });
      const response = await createPitchThread({
        session_id: sessionId || "default",
        model_name: model || MODEL,
        apiKey: apiKey.trim(),
        mcp_servers: config.mcp_servers || [],
        thread_type: "PITCH",
        pitch_info: {
          pitch_type: "COMPANY",
          cin: String(company.cin),
          companyName: company.companyName,
        },
      });

      const nextId = response.data?.thread_id;
      if (!nextId) throw new Error("Backend did not return a pitch thread ID.");

      const nextNames = { ...companyNames, [nextId]: company.companyName };
      companyNamesRef.current = nextNames;
      setCompanyNames(nextNames);
      localStorage.setItem(NAME_MAP_KEY, JSON.stringify(nextNames));

      setThreadId(nextId);
      setThreadName(company.companyName);
      replaceMessages([]);
      setPitchThreads((current) => [
        {
          thread_id: nextId,
          thread_name: company.companyName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        ...current,
      ]);
      setOptions([]);
      setSelectedCin("");
      setCompanyName("");
    } catch (createError) {
      setError(
        createError.response?.data?.detail ||
          createError.response?.data?.message ||
          createError.message ||
          "Could not create pitch thread.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900/5 dark:bg-slate-950/40 text-slate-900 dark:text-white transition-colors duration-300 overflow-hidden">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex gap-4 min-h-0 overflow-hidden">
        {/* Sidebar: Pitch History */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-72 glass-card p-4 flex flex-col transform transition-transform duration-200 lg:static lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10 lg:hidden">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Pitch History
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={startNewPitch}
            className="w-full mt-2 lg:mt-0 mb-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-cyan-600/25 flex items-center justify-center gap-2 transition-all"
          >
            <PlusIcon className="w-4 h-4" />
            <span>New Pitch Brief</span>
          </button>

          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Saved Pitches ({pitchThreads.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto scroll-area space-y-1.5 pr-1">
            {loadingHistory ? (
              <p className="p-3 text-xs text-slate-400 text-center">Loading history...</p>
            ) : pitchThreads.length === 0 ? (
              <p className="p-3 text-xs text-slate-400 text-center">No pitch threads yet.</p>
            ) : (
              pitchThreads.map((item) => {
                const active = item.thread_id === threadId;
                return (
                  <button
                    key={item.thread_id}
                    onClick={() => selectPitch(item)}
                    className={`w-full p-2.5 rounded-xl text-left transition-all text-xs font-medium ${
                      active
                        ? "bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border border-cyan-500/30 shadow-sm"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="truncate font-semibold">
                      {threadLabel(item, companyNames)}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {item.thread_id.slice(0, 16)}...
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Main Work Area */}
        <section className="flex-1 flex flex-col min-w-0 glass-card overflow-hidden">
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-xl glass-subtle lg:hidden text-slate-700 dark:text-slate-300"
              >
                <Bars3Icon className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/20 shrink-0">
                <DocumentChartBarIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white truncate">
                  {threadName}
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-medium">
                  CorpVue MCA Intelligence Agent
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDefaultsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-subtle text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <KeyIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Agent Key</span>
              </button>
              {threadId && (
                <button
                  type="button"
                  onClick={startNewPitch}
                  className="px-3 py-1.5 rounded-xl glass-subtle text-xs font-bold text-cyan-700 dark:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                >
                  Change Company
                </button>
              )}
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {!threadId ? (
              /* Search & Setup View */
              <div className="flex-1 overflow-y-auto scroll-area p-4 sm:p-8 flex flex-col items-center justify-center">
                <div className="w-full max-w-xl space-y-5 animate-rise">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto mb-3 border border-cyan-500/20">
                      <SparklesIcon className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white">
                      Corporate Pitch Studio
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
                      Search companies verified under the Ministry of Corporate Affairs (MCA) to generate customized investor briefings.
                    </p>
                  </div>

                  {/* Search Bar */}
                  <form onSubmit={search} className="flex gap-2">
                    <div className="relative flex-1">
                      <MagnifyingGlassIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Reliance, Infosys, Tata..."
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl glass-input text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={busy}
                      className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/25 disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0"
                    >
                      {busy ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          <span>Searching...</span>
                        </>
                      ) : (
                        <span>Lookup</span>
                      )}
                    </button>
                  </form>

                  {/* Error Alert */}
                  {error && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold animate-fade">
                      {error}
                    </div>
                  )}

                  {/* Search Results */}
                  {options.length > 0 && (
                    <div className="space-y-2.5 animate-fade pt-2">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Matched Companies ({options.length})
                      </span>
                      <div className="space-y-2 max-h-60 overflow-y-auto scroll-area pr-1">
                        {options.map((option) => {
                          const isSelected = selectedCin === String(option.cin);
                          return (
                            <label
                              key={option.cin}
                              className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-cyan-500/15 border-cyan-500/60 shadow-sm"
                                  : "glass-subtle border-slate-200 dark:border-white/10 hover:border-slate-300"
                              }`}
                            >
                              <input
                                type="radio"
                                name="selectedCompany"
                                checked={isSelected}
                                onChange={() => setSelectedCin(String(option.cin))}
                                className="w-4 h-4 accent-cyan-600"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-slate-950 dark:text-white truncate">
                                  {option.companyName}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium">
                                  <span>CIN: {option.cin}</span>
                                  {option.rocCode && <span>• ROC: {option.rocCode}</span>}
                                  {option.status && (
                                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold">
                                      {option.status}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={createSelectedPitch}
                        disabled={!selectedCin || busy}
                        className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/30 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                      >
                        <span>Start Pitch Conversation</span>
                        <ArrowRightIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Chat Conversation View */
              <>
                <div className="flex-1 overflow-y-auto scroll-area p-4 sm:p-6 space-y-4">
                  {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                  ))}
                  {messages.length <= 1 && (
                    <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                      Pitch agent ready for <span className="font-bold text-slate-800 dark:text-slate-200">{threadName}</span>. Ask for company diagnostics, market competitors, positioning, or investment narratives.
                    </div>
                  )}
                </div>

                {(chatError || error) && (
                  <div className="px-4 py-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                    {chatError || error}
                  </div>
                )}

                <div className="shrink-0">
                  <MessageInput onSend={sendMessage} disabled={isStreaming} />
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <ThreadDefaultsModal
        open={defaultsOpen}
        apiKey={apiKey}
        setApiKey={setApiKey}
        model={model}
        setModel={setModel}
        onSave={() => {
          saveThreadDefaults({ apiKey: apiKey.trim(), modelName: model });
          setApiKey(apiKey.trim());
          setDefaultsOpen(false);
        }}
        onClose={() => setDefaultsOpen(false)}
      />
    </div>
  );
}
