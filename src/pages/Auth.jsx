import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  CpuChipIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  MoonIcon,
  ShieldCheckIcon,
  SparklesIcon,
  SunIcon,
} from "@heroicons/react/24/outline";

import { getAuthToken, loginUser, registerUser, setAuthSession } from "../api/chat";
import useTheme from "../hooks/useTheme";

export default function Auth() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (getAuthToken()) {
      navigate("/hub");
    }
  }, [navigate]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleFillDemo = () => {
    setForm({
      username: "demo_user",
      email: "string@string.com",
      password: "string",
    });
    setError("");
  };

  const validate = () => {
    if (mode === "register" && !form.username.trim()) {
      return "Username is required to create an account.";
    }

    if (!form.email.trim()) {
      return "Email address is required.";
    }

    if (!/\S+@\S+\.\S+/.test(form.email.trim())) {
      return "Please enter a valid email address.";
    }

    if (!form.password.trim()) {
      return "Password is required.";
    }

    return null;
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const payload =
        mode === "register"
          ? {
              username: form.username.trim(),
              email: form.email.trim(),
              password: form.password,
            }
          : {
              email: form.email.trim(),
              password: form.password,
            };

      const response =
        mode === "register"
          ? await registerUser(payload)
          : await loginUser(payload);

      const token =
        response.data?.token ||
        response.data?.data?.token ||
        (typeof response.data === "string" ? response.data : null);

      if (!token) {
        throw new Error("Backend did not return an authentication token.");
      }

      setAuthSession({
        token,
        user:
          response.data?.user ||
          response.data?.data ||
          { email: form.email.trim() },
      });

      navigate("/hub");
    } catch (authError) {
      console.error(authError);
      setError(
        authError.response?.data?.detail ||
          authError.response?.data?.message ||
          authError.message ||
          "Authentication failed. Please check credentials or ensure backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Background Glass Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-500/15 dark:bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-cyan-500/15 dark:bg-cyan-600/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top right Theme Switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2.5 rounded-2xl glass hover:scale-105 transition-all text-slate-700 dark:text-slate-300 shadow-md"
        >
          {isDark ? (
            <SunIcon className="w-5 h-5 text-amber-400" />
          ) : (
            <MoonIcon className="w-5 h-5 text-indigo-600" />
          )}
        </button>
      </div>

      {/* Main Glass Auth Card */}
      <div className="w-full max-w-md relative z-10 glass-card p-6 sm:p-9 border border-slate-300 dark:border-white/10 shadow-2xl animate-rise">
        {/* Header / Logo */}
        <div className="text-center mb-7">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-500/25 mb-3.5">
            <div className="w-full h-full rounded-2xl bg-slate-900/40 backdrop-blur-md flex items-center justify-center">
              <CpuChipIcon className="w-7 h-7 text-indigo-300" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            MCP Agent Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-semibold">
            FastAPI Intelligence & Enterprise Hub
          </p>
        </div>

        {/* Demo Credentials Quick Pill */}
        <div className="mb-6 p-3 rounded-2xl glass-subtle flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <SparklesIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div className="font-mono text-[11px] leading-tight">
              <span className="text-slate-500 dark:text-slate-400 font-sans">Demo:</span> string@string.com / string
            </div>
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            className="px-2.5 py-1 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-400 font-bold text-[11px] transition-colors border border-indigo-500/30"
          >
            Auto-fill
          </button>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="grid grid-cols-2 p-1 rounded-2xl glass-subtle mb-6 gap-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              mode === "login"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              mode === "register"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold animate-fade">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                value={form.username}
                onChange={(e) => updateField("username", e.target.value)}
                placeholder="Choose a username"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="e.g. string@string.com"
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder="Enter password"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl glass-input text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Authenticating...</span>
              </span>
            ) : (
              <>
                <span>{mode === "login" ? "Sign In to Studio" : "Create Account"}</span>
                <ArrowRightIcon className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-white/10 text-center text-xs text-slate-600 dark:text-slate-400 font-semibold">
          FastAPI Backend · Port 8000
        </div>
      </div>
    </div>
  );
}
