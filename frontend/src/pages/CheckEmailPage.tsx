import { useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  EnvelopeIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { resendVerification } from "../api/auth";
import AuthBrandPanel from "../components/auth/AuthBrandPanel";
import AuthFormShell from "../components/auth/AuthFormShell";

const steps = [
  "Check your inbox (and spam folder).",
  'Click "Verify my email" in the message.',
  "Return here and sign in to your account.",
];

export default function CheckEmailPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const emailFromQuery = searchParams.get("email") ?? "";
  const emailFromState =
    (location.state as { email?: string } | null)?.email ?? "";
  const initialEmail = emailFromState || emailFromQuery;

  const [email, setEmail] = useState(initialEmail);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await resendVerification(email);
      setMessage(res.message);
    } catch (err: unknown) {
      const apiMessage =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Could not send verification email.";
      setError(apiMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <AuthBrandPanel
        title="Almost there."
        titleAccent="Confirm your email."
        description="We use email verification to keep your account secure and make sure you can recover access when needed."
      />

      <AuthFormShell>
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 ring-1 ring-slate-200">
          <EnvelopeIcon className="h-7 w-7 text-slate-700" strokeWidth={1.5} />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Verify your email
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            We sent a verification link
            {initialEmail ? (
              <>
                {" "}
                to{" "}
                <span className="font-semibold text-slate-800">
                  {initialEmail}
                </span>
              </>
            ) : (
              " to your inbox"
            )}
            .
          </p>
        </div>

        <ul className="mt-8 space-y-3">
          {steps.map((text, index) => (
            <li key={text} className="flex gap-3 text-sm text-slate-600">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                {index + 1}
              </span>
              <span className="pt-0.5 leading-snug">{text}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 border-t border-slate-100 pt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Didn&apos;t get the email?
          </p>
          <form onSubmit={handleResend} className="space-y-3">
            <input
              type="email"
              className="input-field w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            {message && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
                <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
                {message}
              </div>
            )}
            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? "Sending…" : "Resend verification email"}
            </button>
          </form>
        </div>

        <Link
          to="/login"
          className="mt-6 flex w-full items-center justify-center gap-1.5 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
        >
          Back to sign in
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </AuthFormShell>
    </div>
  );
}
