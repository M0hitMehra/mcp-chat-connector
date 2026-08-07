import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  MoonIcon,
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

  const validate = () => {
    if (mode === "register" && !form.username.trim()) {
      return "Username is required.";
    }

    if (!form.email.trim()) {
      return "Email is required.";
    }

    if (!form.password.trim()) {
      return "Password is required.";
    }

    if (form.password.length < 6) {
      return "Password must be at least 6 characters.";
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

      if (!response.data?.token) {
        throw new Error("Backend did not return an auth token.");
      }

      setAuthSession({
        token: response.data.token,
        user: response.data.data,
      });

      navigate("/connect");
    } catch (authError) {
      console.error(authError);

      setError(
        authError.response?.data?.message ||
          authError.response?.data?.detail ||
          authError.message ||
          "Authentication failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-surface min-h-screen overflow-y-auto px-4 py-5 text-[var(--text)] sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-5xl flex-col justify-center gap-8 py-6 lg:grid lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <section className="animate-rise">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--app-bg)]">
                <LockClosedIcon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--faint)]">
                  Secure MCP
                </p>
                <h1 className="text-2xl font-semibold tracking-normal text-[var(--text)] sm:text-3xl">
                  Sign in to your agent workspace
                </h1>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              title="Toggle theme"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--panel)] transition hover:-translate-y-0.5"
            >
              {isDark ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {["Bearer auth", "Thread history", "MCP config"].map((label) => (
              <div key={label} className="soft-panel rounded-lg p-4">
                <p className="text-sm font-semibold">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <form
          onSubmit={submit}
          className="glass-panel animate-rise rounded-lg p-4 sm:p-6"
        >
          <div className="mb-5 grid grid-cols-2 rounded-lg border border-[var(--border)] bg-[var(--panel-muted)] p-1">
            {["login", "register"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setMode(option);
                  setError("");
                }}
                className={`h-10 rounded-md text-sm font-semibold capitalize transition ${
                  mode === option
                    ? "bg-[var(--panel-strong)] text-[var(--text)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="grid gap-4">
            {mode === "register" && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Username</span>
                <input
                  value={form.username}
                  onChange={(event) => updateField("username", event.target.value)}
                  placeholder="Mohit"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 pr-12 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  title={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--panel-muted)] hover:text-[var(--text)]"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </label>

            {error && (
              <div className="animate-fade rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-[var(--danger)]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--app-bg)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] disabled:opacity-60"
            >
              {loading ? "Please wait..." : mode === "register" ? "Create account" : "Sign in"}
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
