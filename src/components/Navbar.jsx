import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bars3Icon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  DocumentChartBarIcon,
  HomeModernIcon,
  LockClosedIcon,
  MoonIcon,
  ShieldCheckIcon,
  SparklesIcon,
  SunIcon,
  UserCircleIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

import { clearAuthSession, getAuthUser } from "../api/chat";
import { clearManagementSession, getManagementToken } from "../api/management";
import useTheme from "../hooks/useTheme";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const authUser = getAuthUser();
  const hasManagementToken = Boolean(getManagementToken());

  const navLinks = [
    {
      name: "Hub",
      path: "/hub",
      icon: HomeModernIcon,
    },
    {
      name: "Personalized Chat",
      path: "/chat",
      icon: ChatBubbleLeftRightIcon,
    },
    {
      name: "Pitch Report Chat",
      path: "/pitch",
      icon: DocumentChartBarIcon,
    },
    {
      name: "EMS Portal",
      path: "/manage",
      icon: BuildingOffice2Icon,
      badge: hasManagementToken ? "Connected" : "Requires Login",
      badgeType: hasManagementToken ? "success" : "neutral",
    },
  ];

  const handleLogout = () => {
    clearAuthSession();
    clearManagementSession();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full glass border-b border-slate-200 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            onClick={() => navigate("/hub")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-md shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
              <div className="w-full h-full rounded-xl bg-slate-900/40 backdrop-blur-md flex items-center justify-center">
                <CpuChipIcon className="w-5 h-5 text-indigo-300 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-950 dark:text-white">
                  MCP Studio
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/25">
                  Agentic
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                Workspace Hub
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl glass-subtle">
            {navLinks.map((item) => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    active
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25 scale-[1.02]"
                      : "text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                        active
                          ? "bg-white/20 text-white"
                          : item.badgeType === "success"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Controls: User Info, Theme Toggle, Logout */}
          <div className="hidden md:flex items-center gap-3">
            {/* Active User Pill */}
            {authUser?.email && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-subtle text-xs text-slate-800 dark:text-slate-200 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="truncate max-w-[140px] font-mono text-[11px]">
                  {authUser.email}
                </span>
              </div>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-xl glass-subtle text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {isDark ? (
                <SunIcon className="w-4 h-4 text-amber-400" />
              ) : (
                <MoonIcon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 glass-subtle hover:bg-rose-500/10 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl glass-subtle text-slate-700 dark:text-slate-300"
            >
              {isDark ? (
                <SunIcon className="w-4 h-4 text-amber-400" />
              ) : (
                <MoonIcon className="w-4 h-4 text-indigo-600" />
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl glass-subtle text-slate-800 dark:text-slate-200"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="w-5 h-5" />
              ) : (
                <Bars3Icon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass border-t border-slate-200 dark:border-white/10 px-4 pt-3 pb-5 space-y-2 animate-fade">
          {navLinks.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  active
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-800 dark:text-slate-200 glass-subtle hover:bg-slate-200/50 dark:hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      active
                        ? "bg-white/20 text-white"
                        : item.badgeType === "success"
                        ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                        : "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
            <span className="text-xs text-slate-700 dark:text-slate-400 font-mono truncate max-w-[200px]">
              {authUser?.email || "Authenticated"}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 glass-subtle rounded-xl"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
