import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api/auth";
import AuthBrandPanel from "../components/auth/AuthBrandPanel";
import AuthFormShell from "../components/auth/AuthFormShell";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(name, email, password);
      navigate(`/check-email?email=${encodeURIComponent(email.trim())}`, {
        state: { email: email.trim() },
      });
    } catch (err: unknown) {
      const data = (
        err as {
          response?: { status?: number; data?: { message?: string } | string };
        }
      ).response?.data;
      if ((err as { response?: { status?: number } }).response?.status === 400) {
        setError(
          typeof data === "string"
            ? data
            : (data?.message ?? "Registration failed.")
        );
      } else {
        setError("An error occurred during registration. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <AuthBrandPanel
        title="Drive with"
        titleAccent="confidence."
        description="Join thousands of vehicle owners who trust GadiParts for genuine parts and expert service."
      />

      <AuthFormShell>
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create account
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Join us and manage your vehicles online. You will verify your email
            before signing in.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              type="text"
              className="input-field w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

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
              minLength={6}
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </button>

          <p className="pt-2 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-slate-900 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </AuthFormShell>
    </div>
  );
}
