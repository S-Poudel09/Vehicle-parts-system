import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { login, resendVerification } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import AuthBrandPanel from "../components/auth/AuthBrandPanel";
import AuthFormShell from "../components/auth/AuthFormShell";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message as string | undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setNeedsEmailVerification(false);
    setLoading(true);

    try {
      const data = await login(email, password);
      localStorage.setItem("token", data.token);
      signIn(data);

      if (data.role === "Admin") navigate("/admin");
      else if (data.role === "Staff") navigate("/staff");
      else navigate("/customer");
    } catch (err: unknown) {
      const response = (
        err as {
          response?: {
            status?: number;
            data?: { code?: string; message?: string };
          };
        }
      ).response;
      if (
        response?.status === 403 &&
        response.data?.code === "EMAIL_NOT_VERIFIED"
      ) {
        setNeedsEmailVerification(true);
        setError(
          response.data.message ??
            "Please verify your email before signing in."
        );
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }
    setResending(true);
    setInfo("");
    try {
      const res = await resendVerification(email);
      setInfo(res.message);
      setError("");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Could not send verification email.";
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <AuthBrandPanel
        title="Your vehicle,"
        titleAccent="our expertise."
        description="Genuine parts, professional service, and complete transparency — all in one place."
      />

      <AuthFormShell>
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to access your account
          </p>
        </div>

        {successMessage && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
            {successMessage}
          </div>
        )}

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

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              className="input-field w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
              {error}
            </p>
          )}
          {info && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
              {info}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>

          {needsEmailVerification && (
            <button
              type="button"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              disabled={resending}
              onClick={handleResendVerification}
            >
              {resending ? "Sending…" : "Resend verification email"}
            </button>
          )}

          <p className="pt-2 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-slate-900 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </form>
      </AuthFormShell>
    </div>
  );
}

