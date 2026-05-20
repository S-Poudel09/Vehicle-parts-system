import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/auth";
import AuthBrandPanel from "../components/auth/AuthBrandPanel";
import AuthFormShell from "../components/auth/AuthFormShell";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid password reset link.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await resetPassword(token, newPassword, confirmPassword);
      navigate("/login", { state: { message: res.message } });
    } catch (err: unknown) {
      const apiMessage =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Could not reset password. The link may be invalid or expired.";
      setError(apiMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen bg-slate-50 font-sans">
        <AuthBrandPanel
          title="Invalid reset"
          titleAccent="link"
          description="This password reset link is missing or invalid."
        />
        <AuthFormShell>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">Link expired or invalid</h1>
            <p className="mt-3 text-sm text-slate-500">
              Request a new password reset link to continue.
            </p>
            <Link to="/forgot-password" className="btn-primary mt-6 inline-flex w-full">
              Request new link
            </Link>
          </div>
        </AuthFormShell>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <AuthBrandPanel
        title="Choose a new"
        titleAccent="password"
        description="Enter and confirm your new password to complete the reset."
      />

      <AuthFormShell>
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Set new password
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Verified via your email link
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              New password
            </label>
            <input
              type="password"
              className="input-field w-full"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Confirm password
            </label>
            <input
              type="password"
              className="input-field w-full"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Updating…" : "Update password"}
          </button>

          <p className="pt-2 text-center text-sm text-slate-500">
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
