import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon, ArrowRightIcon, BuildingOffice2Icon, PencilSquareIcon, PlusIcon, SparklesIcon } from "@heroicons/react/24/outline";
import {
  clearAuthSession,
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
import useTheme from "../hooks/useTheme";

const MODEL = "gemini-3.1-flash-lite";
const MODELS = ["gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.5-pro"];
const NAME_MAP_KEY = "mcp_pitch_company_names";

const readConfig = () => {
  try { return JSON.parse(localStorage.getItem("mcp_thread_config") || "{}"); }
  catch { return {}; }
};

const readNameMap = () => {
  try { return JSON.parse(localStorage.getItem(NAME_MAP_KEY) || "{}"); }
  catch { return {}; }
};

const threadLabel = (thread, names) => {
  const savedName = names[thread.thread_id];
  const apiName = thread.thread_name && thread.thread_name !== "New Chat" ? thread.thread_name : "";
  const date = thread.updated_at || thread.created_at;
  return savedName || apiName || (date ? `Pitch · ${new Date(date).toLocaleDateString()}` : `Pitch · ${thread.thread_id.slice(0, 8)}`);
};

function companyOptions(payload) {
  const result = payload?.data ?? payload?.companies ?? payload?.results ?? payload;
  const rows = Array.isArray(result) ? result : [result];
  return rows.filter((row) => row && typeof row === "object" && (row.cin || row.CIN || row.cin_number || row.id))
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
  const { isDark, toggleTheme } = useTheme();
  const config = readConfig();
  const sessionId = localStorage.getItem("mcp_session_id") || "";
  const [apiKey, setApiKey] = useState(getSavedApiKey);
  const [model, setModel] = useState(() => localStorage.getItem("mcp_model") || config.model_name || MODEL);
  const [pitchThreads, setPitchThreads] = useState([]);
  const [companyNames, setCompanyNames] = useState(readNameMap);
  const companyNamesRef = useRef(companyNames);
  const [threadId, setThreadId] = useState("");
  const [threadName, setThreadName] = useState("Choose a company for your pitch");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [defaultsOpen, setDefaultsOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [options, setOptions] = useState([]);
  const [selectedCin, setSelectedCin] = useState("");
  const [busy, setBusy] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState("");

  const { messages, isStreaming, error: chatError, sendMessage, replaceMessages } = useChat({
    sessionId,
    threadId,
    modelName: model,
    chatEndpoint: "/pitch/chat",
    storagePrefix: "mcp_pitch_messages",
  });

  useEffect(() => {
    if (!getAuthToken()) { navigate("/"); return; }
    listPitchThreads().then((response) => {
      const items = response.data?.threads || [];
      items.sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));
      setPitchThreads(items);
      if (items.length) {
        const latest = items[0];
        setThreadId(latest.thread_id);
        setThreadName(threadLabel(latest, companyNamesRef.current));
      }
    }).catch((loadError) => {
      setError(loadError.response?.data?.detail || "Unable to load pitch history.");
    }).finally(() => setLoadingHistory(false));
  }, [navigate]);

  useEffect(() => {
    if (!threadId) { replaceMessages([]); return; }
    getPitchThreadMessages(threadId)
      .then((response) => replaceMessages(response.data?.messages || []))
      .catch((loadError) => setError(loadError.response?.data?.detail || "Unable to load this pitch conversation."));
  }, [replaceMessages, threadId]);

  const selectPitch = (thread) => {
    setThreadId(thread.thread_id);
    setThreadName(threadLabel(thread, companyNames));
    setError("");
  };

  const startNewPitch = () => {
    setThreadId("");
    setThreadName("Choose a company for your pitch");
    setCompanyName("");
    setOptions([]);
    setSelectedCin("");
    setError("");
    replaceMessages([]);
  };

  const search = async (event) => {
    event.preventDefault(); setError(""); setOptions([]); setSelectedCin("");
    if (companyName.trim().length < 2) { setError("Enter at least two characters of a company name."); return; }
    setBusy(true);
    try {
      const response = await searchPitchCompanies(companyName.trim());
      const found = companyOptions(response.data);
      setOptions(found);
      if (!found.length) setError("No company CIN matches were returned. Try another company name.");
      else if (found.length === 1) setSelectedCin(String(found[0].cin));
    } catch (searchError) {
      setError(searchError.response?.data?.detail || searchError.response?.data?.message || "Company search failed.");
    } finally { setBusy(false); }
  };

  const createSelectedPitch = async () => {
    const company = options.find((item) => String(item.cin) === selectedCin);
    if (!company) return;
    if (!apiKey.trim()) { setDefaultsOpen(true); setError("Enter or save an API key before creating the pitch thread."); return; }
    setBusy(true); setError("");
    try {
      saveThreadDefaults({ apiKey: apiKey.trim(), modelName: model });
      const response = await createPitchThread({
        session_id: sessionId,
        model_name: model || MODEL,
        apiKey: apiKey.trim(),
        mcp_servers: config.mcp_servers || [],
        thread_type: "PITCH",
        pitch_info: { pitch_type: "COMPANY", cin: String(company.cin), companyName: company.companyName },
      });
      const nextId = response.data?.thread_id;
      if (!nextId) throw new Error("Backend did not return a pitch thread ID.");
      const nextNames = { ...companyNames, [nextId]: company.companyName };
      companyNamesRef.current = nextNames;
      setCompanyNames(nextNames);
      localStorage.setItem(NAME_MAP_KEY, JSON.stringify(nextNames));
      setThreadId(nextId); setThreadName(company.companyName); replaceMessages([]);
      setPitchThreads((current) => [{ thread_id: nextId, thread_name: company.companyName, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...current]);
      setOptions([]); setSelectedCin(""); setCompanyName("");
    } catch (createError) {
      setError(createError.response?.data?.detail || createError.response?.data?.message || createError.message || "Could not create pitch thread.");
    } finally { setBusy(false); }
  };

  const saveSettings = async () => {
    if (!apiKey.trim()) { setDefaultsOpen(true); return; }
    saveThreadDefaults({ apiKey: apiKey.trim(), modelName: model });
    if (!threadId) { setDefaultsOpen(false); return; }
    setSavingSettings(true); setError("");
    try {
      await updatePitchThreadConfig(threadId, { api_key: apiKey.trim(), model_name: model });
      setSettingsOpen(false);
    } catch (saveError) {
      setError(saveError.response?.data?.detail || saveError.response?.data?.message || "Unable to update this pitch thread.");
    } finally { setSavingSettings(false); }
  };

  const logout = () => { clearAuthSession(); navigate("/"); };

  return (
    <main className="app-surface h-screen overflow-hidden px-4 py-5 sm:px-7">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col">
        <header className="mb-5 flex shrink-0 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--app-bg)]"><BuildingOffice2Icon className="h-6 w-6" /></span>
            <div><div className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">Dedicated pitch workspace</div><h1 className="text-xl font-bold text-[var(--text)]">{threadName}</h1></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("/chat")} className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)]"><ArrowLeftIcon className="mr-1 inline h-4 w-4" />Normal chats</button>
            <button onClick={toggleTheme} className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)]">{isDark ? "Light" : "Dark"}</button>
            <button onClick={logout} className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)]">Sign out</button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,28vh)_minmax(0,1fr)] gap-4 overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)] lg:grid-rows-1">
          <aside className="glass-panel-strong flex min-h-0 flex-col overflow-hidden rounded-2xl p-3">
            <button onClick={startNewPitch} className="mb-3 flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-xs font-semibold text-white"><PlusIcon className="h-4 w-4" />New pitch</button>
            <h2 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Pitch history · {pitchThreads.length}</h2>
            <div className="scroll-area flex-1 space-y-1 overflow-y-auto">
              {loadingHistory ? <p className="p-3 text-xs text-[var(--muted)]">Loading history…</p> : pitchThreads.length ? pitchThreads.map((thread) => (
                <button key={thread.thread_id} onClick={() => selectPitch(thread)} className={`w-full rounded-xl px-3 py-2.5 text-left transition ${thread.thread_id === threadId ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--text)] hover:bg-[var(--panel-muted)]"}`}>
                  <span className="block truncate text-xs font-semibold">{threadLabel(thread, companyNames)}</span>
                  <span className="mt-1 block truncate font-mono text-[9px] opacity-60">{thread.thread_id}</span>
                </button>
              )) : <p className="p-3 text-xs text-[var(--muted)]">No pitch threads yet.</p>}
            </div>
          </aside>

          <section className="glass-panel-strong flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl">
            {loadingHistory ? <div className="m-auto p-8 text-sm text-[var(--muted)]">Loading pitch history…</div> : !threadId ? (
              <div className="m-auto w-full max-w-2xl p-5 sm:p-8">
                <div className="mb-5 flex items-start gap-3"><SparklesIcon className="mt-1 h-6 w-6 text-[var(--accent)]" /><div><h2 className="text-lg font-bold text-[var(--text)]">Choose a company for your pitch</h2><p className="mt-1 text-sm text-[var(--muted)]">Search by company name, review CIN matches, then create a dedicated pitch thread.</p></div></div>
                <form onSubmit={search} className="flex flex-col gap-3 sm:flex-row">
                  <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Company name" className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" />
                  <button disabled={busy} className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Searching…" : "Find companies"}</button>
                </form>
                {options.length > 0 && <div className="mt-5 space-y-2"><p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Select a company</p>{options.map((option) => <label key={option.cin} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${selectedCin === String(option.cin) ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)]"}`}><input type="radio" name="cin" value={option.cin} checked={selectedCin === String(option.cin)} onChange={(event) => setSelectedCin(event.target.value)} /><span className="min-w-0 flex-1"><span className="block font-semibold text-[var(--text)]">{option.companyName}</span><span className="block font-mono text-xs text-[var(--muted)]">CIN/LLPIN: {option.cin}</span>{(option.status || option.type || option.rocCode) && <span className="mt-1 block text-[10px] text-[var(--faint)]">{[option.type, option.status, option.rocCode].filter(Boolean).join(" · ")}</span>}</span></label>)}<button onClick={createSelectedPitch} disabled={!selectedCin || busy} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-white disabled:opacity-50">Create pitch thread <ArrowRightIcon className="h-4 w-4" /></button></div>}
                <div className="mt-5 grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] p-4 sm:grid-cols-[1fr_1fr_auto]">
                  <label className="text-xs font-semibold text-[var(--muted)]">API key<input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Gemini API key" className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2 text-sm text-[var(--text)]" /></label>
                  <label className="text-xs font-semibold text-[var(--muted)]">Model<select value={model} onChange={(event) => setModel(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2 text-sm text-[var(--text)]">{MODELS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                  <button type="button" onClick={saveSettings} className="self-end rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--accent)]">Save defaults</button>
                </div>
                {error && <p className="mt-4 rounded-xl bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">{error}</p>}
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] p-4">
                  <span className="text-xs text-[var(--muted)]">Selected pitch thread</span>
                  <div className="flex gap-2"><button onClick={() => setSettingsOpen((open) => !open)} className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)]"><PencilSquareIcon className="h-4 w-4" />Edit key/model</button><button onClick={startNewPitch} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--text)]">New pitch</button></div>
                </div>
                {settingsOpen && <div className="grid gap-3 border-b border-[var(--border)] bg-[var(--panel-muted)] p-4 sm:grid-cols-[1fr_1fr_auto]"><label className="text-xs font-semibold text-[var(--muted)]">API key<input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Gemini API key" className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2 text-sm text-[var(--text)]" /></label><label className="text-xs font-semibold text-[var(--muted)]">Model<select value={model} onChange={(event) => setModel(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2 text-sm text-[var(--text)]">{MODELS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><button onClick={saveSettings} disabled={savingSettings} className="self-end rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">{savingSettings ? "Saving…" : "Save settings"}</button></div>}
                <div className="scroll-area min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-6">{messages.map((message) => <ChatMessage key={message.id} message={message} />)}{messages.length <= 1 && <p className="py-10 text-center text-sm text-[var(--muted)]">Ask for a company pitch, positioning, or investor narrative.</p>}</div>
                {(chatError || error) && <p className="px-4 text-sm text-[var(--danger)]">{chatError || error}</p>}
                <div className="border-t border-[var(--border)] p-4"><MessageInput onSend={sendMessage} disabled={isStreaming} /></div>
              </>
            )}
          </section>
        </div>
      </div>
      <ThreadDefaultsModal open={defaultsOpen} apiKey={apiKey} setApiKey={setApiKey} model={model} setModel={setModel} onSave={() => { saveThreadDefaults({ apiKey: apiKey.trim(), modelName: model }); setApiKey(apiKey.trim()); setDefaultsOpen(false); }} onClose={() => setDefaultsOpen(false)} />
    </main>
  );
}
