import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRightIcon,
  BoltIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  CommandLineIcon,
  CpuChipIcon,
  DocumentChartBarIcon,
  KeyIcon,
  LockClosedIcon,
  ServerStackIcon,
  SparklesIcon,
  UserGroupIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

import Navbar from "../components/Navbar";
import { getAuthToken, getAuthUser } from "../api/chat";
import { getManagementToken, MANAGEMENT_API_URL } from "../api/management";

export default function Hub() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [hasManagementSession, setHasManagementSession] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate("/");
      return;
    }
    setUser(getAuthUser());
    setHasManagementSession(Boolean(getManagementToken()));
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-900/5 dark:bg-slate-950/40 text-slate-900 dark:text-white transition-colors duration-300">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col justify-center">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-pill mb-4 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <SparklesIcon className="w-4 h-4 text-indigo-500" />
            <span>Agentic Orchestration Platform</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Select Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400">Workspace</span>
          </h1>

          <p className="mt-3.5 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Welcome{user?.email ? `, ${user.email}` : ""}. Choose from the three modules below to launch your intelligence workflows, corporate pitch analysis, or workforce administration.
          </p>
        </div>

        {/* 3 Main Glass Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {/* OPTION 1: Personalized Chat */}
          <div
            onClick={() => navigate("/chat")}
            className="group relative glass-card p-6 sm:p-7 flex flex-col justify-between cursor-pointer glass-card-hover border border-white/20 dark:border-white/10 hover:border-indigo-500/40"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-2xl group-hover:bg-indigo-500/25 transition-all pointer-events-none"></div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                <ChatBubbleLeftRightIcon className="w-6 h-6" />
              </div>

              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">
                  Option 1
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 font-medium border border-indigo-500/15">
                  FastAPI LLM Agent
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Personalized Chat
              </h2>

              <p className="mt-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Converse with Gemini powered by real-time Model Context Protocol (MCP) servers. Access company intelligence tools, saved threads, and live token streaming.
              </p>

              {/* Feature Tags */}
              <div className="mt-5 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Gemini 3.1 & 2.5 Multi-turn Agents</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Custom MCP Tools & Tool Calling</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Persistent Threads & SSE Streaming</span>
                </div>
              </div>
            </div>

            <div className="mt-7 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                Launch Chat Studio
              </span>
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <ArrowRightIcon className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* OPTION 2: Pitch Report Chat */}
          <div
            onClick={() => navigate("/pitch")}
            className="group relative glass-card p-6 sm:p-7 flex flex-col justify-between cursor-pointer glass-card-hover border border-white/20 dark:border-white/10 hover:border-cyan-500/40"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-2xl group-hover:bg-cyan-500/25 transition-all pointer-events-none"></div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-5 border border-cyan-500/20 group-hover:scale-105 transition-transform">
                <DocumentChartBarIcon className="w-6 h-6" />
              </div>

              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold text-cyan-500 dark:text-cyan-400 uppercase tracking-wider">
                  Option 2
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 font-medium border border-cyan-500/15">
                  MCA CorpVue Data
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                Pitch Report Chat
              </h2>

              <p className="mt-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Corporate intelligence and investment pitch briefings. Search company names on CorpVue, fetch official CIN numbers, and generate deep company pitch decks.
              </p>

              {/* Feature Tags */}
              <div className="mt-5 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Real-time CorpVue / MCA Search</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>CIN, ROC & Entity Status Verification</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Targeted Executive Pitch Generation</span>
                </div>
              </div>
            </div>

            <div className="mt-7 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                Open Pitch Studio
              </span>
              <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-all">
                <ArrowRightIcon className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* OPTION 3: EMS (Employee Management System) */}
          <div
            onClick={() => navigate("/manage")}
            className="group relative glass-card p-6 sm:p-7 flex flex-col justify-between cursor-pointer glass-card-hover border border-white/20 dark:border-white/10 hover:border-purple-500/40"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 dark:bg-purple-500/15 rounded-full blur-2xl group-hover:bg-purple-500/25 transition-all pointer-events-none"></div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-5 border border-purple-500/20 group-hover:scale-105 transition-transform">
                <BuildingOffice2Icon className="w-6 h-6" />
              </div>

              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold text-purple-500 dark:text-purple-400 uppercase tracking-wider">
                  Option 3
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                    hasManagementSession
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  }`}
                >
                  {hasManagementSession ? "✓ Spring Boot Active" : "🔒 Requires Login"}
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                EMS (Employee Management)
              </h2>

              <p className="mt-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Enterprise workforce and organizational management powered by the Spring Boot backend. Requires independent login with Railway API.
              </p>

              {/* Feature Tags */}
              <div className="mt-5 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Employee Records & Directory CRUD</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Companies, Branches, Departments & Teams</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Designations, Roles & Access Levels</span>
                </div>
              </div>
            </div>

            <div className="mt-7 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 group-hover:translate-x-0.5 transition-transform">
                {hasManagementSession ? "Access EMS Console" : "Authenticate & Access EMS"}
              </span>
              <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
                {hasManagementSession ? (
                  <ArrowRightIcon className="w-4 h-4" />
                ) : (
                  <LockClosedIcon className="w-4 h-4" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* System Endpoints Overview Pill */}
        <div className="mt-12 sm:mt-16 p-4 rounded-2xl glass-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <ServerStackIcon className="w-4 h-4 text-indigo-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Microservice Topology:</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              FastAPI Chat Backend (Local / VITE_API_URL)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              Spring Boot EMS ({MANAGEMENT_API_URL.replace("https://", "")})
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
