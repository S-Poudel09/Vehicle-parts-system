import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/auth";
import AuthBrandPanel from "../components/auth/AuthBrandPanel";
import AuthFormShell from "../components/auth/AuthFormShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await forgotPassword(email);
      setMessage(res.message);
    } catch (err: unknown) {
      const apiMessage =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Could not send password reset email.";
      setError(apiMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <AuthBrandPanel
        title="Forgot your"
        titleAccent="password?"
        description="Enter your email and we'll send you a secure link to reset your password."
      />

      <AuthFormShell>
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Reset password
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            We&apos;ll email you a verification link
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              className="input-field w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
              {error}
            </p>
          )}
          {message && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
              {message}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </button>

          <p className="pt-2 text-center text-sm text-slate-500">
            Remember your password?{" "}
            <Link
              to="/login"
              className="font-semibold text-slate-900 hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </form>
      </AuthFormShell>
    </div>
  );
}
