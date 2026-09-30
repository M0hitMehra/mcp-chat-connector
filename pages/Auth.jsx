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
      navigate("/connect");
    }
  }, [navigate]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const getPasswordStrength = () => {
    const pass = form.password;
    if (!pass) return { score: 0, label: "", color: "" };
    if (pass.length < 6) return { score: 1, label: "Weak", color: "bg-red-500" };
    if (pass.length < 10 || !/\d/.test(pass))
      return { score: 2, label: "Medium", color: "bg-amber-500" };
    return { score: 3, label: "Strong", color: "bg-emerald-500" };
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

    if (form.password.length < 6) {
      return "Password must be at least 6 characters long.";
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

      const token = response.data?.token;

      if (!token) {
        throw new Error("Backend did not return an authentication token.");
      }

      setAuthSession({
        token,
        user: response.data?.data || { email: form.email.trim() },
      });

      navigate("/connect");
    } catch (authError) {
      console.error(authError);

      setError(
        authError.response?.data?.message ||
          authError.response?.data?.detail ||
          authError.message ||
          "Authentication failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength();

  return (
    <main className="app-surface flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-8 lg:grid lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-12">
        {/* Left Hero Column */}
        <section className="animate-rise flex flex-col justify-between">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--app-bg)] shadow-lg shadow-[var(--accent-soft)]">
                  <CpuChipIcon className="h-6 w-6" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">
                    MCP Client Studio
                  </span>
                  <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text)] sm:text-3xl">
                    Intelligent Agent Studio
                  </h1>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                title="Toggle Theme"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--text)]"
              >
                {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              </button>
            </div>

            <p className="mb-8 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
              Connect model context protocol (MCP) servers directly to Gemini models. Stream real-time agent reasoning, manage sessions, and run custom tool pipelines seamlessly.
            </p>

            {/* Feature Highlights Grid */}
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="glass-panel flex items-start gap-3 rounded-xl p-3.5 transition hover:-translate-y-0.5">
                <ShieldCheckIcon className="h-5 w-5 shrink-0 text-[var(--accent)]" />
                <div>
                  <div className="text-xs font-semibold text-[var(--text)]">JWT Bearer Security</div>
                  <div className="text-[11px] text-[var(--muted)]">Encrypted MongoDB session auth</div>
                </div>
              </div>

              <div className="glass-panel flex items-start gap-3 rounded-xl p-3.5 transition hover:-translate-y-0.5">
                <SparklesIcon className="h-5 w-5 shrink-0 text-[var(--emerald)]" />
                <div>
                  <div className="text-xs font-semibold text-[var(--text)]">MCP Tool Servers</div>
                  <div className="text-[11px] text-[var(--muted)]">Dynamically expand agent capabilities</div>
                </div>
              </div>

              <div className="glass-panel flex items-start gap-3 rounded-xl p-3.5 transition hover:-translate-y-0.5">
                <CheckCircleIcon className="h-5 w-5 shrink-0 text-[var(--accent)]" />
                <div>
                  <div className="text-xs font-semibold text-[var(--text)]">Persistent Threads</div>
                  <div className="text-[11px] text-[var(--muted)]">Full chat history & memory summaries</div>
                </div>
              </div>

              <div className="glass-panel flex items-start gap-3 rounded-xl p-3.5 transition hover:-translate-y-0.5">
                <LockClosedIcon className="h-5 w-5 shrink-0 text-[var(--emerald)]" />
                <div>
                  <div className="text-xs font-semibold text-[var(--text)]">Streaming SSE</div>
                  <div className="text-[11px] text-[var(--muted)]">Low-latency token-by-token response</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Form Card */}
        <form
          onSubmit={submit}
          className="glass-panel-strong animate-scale rounded-2xl p-6 sm:p-8"
        >
          {/* Mode Switcher Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[var(--text)]">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-xs text-[var(--muted)]">
                {mode === "login" ? "Sign in to access your agent workspace" : "Register to start configuring MCP servers"}
              </p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-xl bg-[var(--panel-muted)] p-1 border border-[var(--border)]">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`rounded-lg py-2 text-xs font-semibold transition ${
                mode === "login"
                  ? "bg-[var(--panel-strong)] text-[var(--accent)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
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
              className={`rounded-lg py-2 text-xs font-semibold transition ${
                mode === "register"
                  ? "bg-[var(--panel-strong)] text-[var(--accent)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Username
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => updateField("username", e.target.value)}
                  placeholder="e.g. Mohit"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 pr-12 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)]"
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>

              {mode === "register" && form.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--panel-muted)]">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${(strength.score / 3) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-[var(--muted)]">
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {error && (
              <div className="animate-fade rounded-xl border border-[var(--danger-soft)] bg-[var(--danger-soft)] p-3 text-xs font-medium text-[var(--danger)]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-sm font-semibold text-[var(--app-bg)] shadow-md shadow-[var(--accent-soft)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] active:translate-y-0 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--app-bg)] border-t-transparent" />
                  Processing...
                </span>
              ) : (
                <>
                  <span>{mode === "register" ? "Create Account & Continue" : "Sign In to Workspace"}</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-[var(--muted)]">
            By continuing, you connect with the Secure MCP Backend API.
          </div>
        </form>
      </div>
    </main>
  );
}
