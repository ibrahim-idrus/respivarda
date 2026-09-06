"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@cloudflare/kumo";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  CloudSun,
  Eye,
  EyeSlash,
  LockKey,
  ShieldCheck,
  WarningCircle,
} from "@phosphor-icons/react";
import {
  validateAdminLogin,
  type AdminLoginErrors,
} from "./admin-login-validation";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<AdminLoginErrors>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    const nextErrors = validateAdminLogin({ email, password });
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setServerError(data?.error || "Gagal masuk. Periksa email dan kata sandi Anda.");
        setLoading(false);
        return;
      }

      setSuccessMessage("Autentikasi berhasil. Mengalihkan ke konsol admin...");
      let nextUrl = "/admin/feedback";
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        nextUrl = params.get("next") || "/admin/feedback";
        window.location.href = nextUrl;
      }
    } catch {
      setServerError("Terjadi gangguan koneksi. Silakan coba sesaat lagi.");
      setLoading(false);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setErrors((current) => ({ ...current, email: undefined }));
    setServerError(null);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setErrors((current) => ({ ...current, password: undefined }));
    setServerError(null);
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
            <CloudSun size={23} weight="fill" />
          </div>
          <div className="leading-tight">
            <p className="text-lg font-extrabold tracking-tight text-on-surface">Respivarda</p>
            <p className="text-xs font-medium text-on-surface-variant">Operations workspace</p>
          </div>
        </div>

        <div className="mx-auto max-w-xl">
          <section className="rounded-3xl border border-surface-container bg-surface-container-lowest p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-2 text-sm font-bold text-secondary">
              <LockKey size={18} weight="fill" />
              Admin access
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
              Sign in to Operations
            </h1>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">
              This workspace is for Telegram user activity and alert delivery.
            </p>

            {serverError && (
              <div
                role="alert"
                className="mt-6 flex items-start gap-3 rounded-2xl border border-error/20 bg-error/10 p-4 text-sm font-medium text-error"
              >
                <WarningCircle size={20} weight="fill" className="mt-0.5 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {successMessage && (
              <div
                role="status"
                className="mt-6 flex items-start gap-3 rounded-2xl border border-secondary/20 bg-secondary/10 p-4 text-sm font-medium text-secondary"
              >
                <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
              <div>
                <label className="mb-2 block text-sm font-bold text-on-surface" htmlFor="admin-email">
                  Work email
                </label>
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  disabled={loading}
                  onChange={(event) => handleEmailChange(event.target.value)}
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? "admin-email-error" : undefined}
                  className="h-12 w-full rounded-xl border border-surface-container bg-surface-container-lowest px-4 text-on-surface outline-none transition focus:border-secondary focus:ring-4 focus:ring-secondary/30 disabled:opacity-50"
                  placeholder="operator@respivarda.id"
                />
                {errors.email && (
                  <p id="admin-email-error" role="alert" className="mt-2 text-sm font-medium text-error">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-on-surface" htmlFor="admin-password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    disabled={loading}
                    onChange={(event) => handlePasswordChange(event.target.value)}
                    aria-invalid={errors.password ? true : undefined}
                    aria-describedby={errors.password ? "admin-password-error" : undefined}
                    className="h-12 w-full rounded-xl border border-surface-container bg-surface-container-lowest px-4 pr-14 text-on-surface outline-none transition focus:border-secondary focus:ring-4 focus:ring-secondary/30 disabled:opacity-50"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((current) => !current)}
                    disabled={loading}
                    className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant transition hover:bg-surface-container focus:outline-none focus:ring-4 focus:ring-secondary/30 disabled:opacity-50"
                  >
                    {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p id="admin-password-error" role="alert" className="mt-2 text-sm font-medium text-error">
                    {errors.password}
                  </p>
                )}
              </div>

              <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-on-surface-variant" htmlFor="remember-admin">
                <input
                  id="remember-admin"
                  type="checkbox"
                  checked={remember}
                  disabled={loading}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="h-4 w-4 rounded border-secondary text-secondary focus:ring-secondary/30"
                />
                Keep me signed in on this device
              </label>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full"
                icon={<ArrowRight weight="bold" />}
              >
                Sign in to admin console
              </Button>
            </form>

            <div className="mt-6 border-t border-surface-container pt-5">
              <p className="flex gap-2 text-sm leading-6 text-on-surface-variant">
                <ShieldCheck className="mt-0.5 shrink-0 text-secondary" size={20} weight="fill" />
                Public dashboard access remains available without an admin account.
              </p>
              <Link href="/" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-secondary transition hover:text-on-secondary-container">
                <ArrowLeft size={18} weight="bold" />
                Return to public dashboard
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
