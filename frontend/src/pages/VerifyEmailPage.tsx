import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { verifyEmail } from "../api/auth";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    verifyEmail(token)
      .then((res) => {
        setStatus("success");
        setMessage(res.message);
      })
      .catch((err: unknown) => {
        setStatus("error");
        setMessage(
          (err as { response?: { data?: { message?: string } } }).response?.data
            ?.message ??
            "Verification failed. The link may be invalid or expired."
        );
      });
  }, [searchParams]);

  const isLoading = status === "loading";
  const isSuccess = status === "success";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 font-sans">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <img src="/logo.png" alt="GadiParts" className="h-10 w-auto" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
          <div
            className={`h-1 ${isSuccess ? "bg-emerald-600" : status === "error" ? "bg-red-500" : "bg-slate-900"}`}
          />

          <div className="p-8 text-center">
            <div
              className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ring-1 ${
                isLoading
                  ? "bg-slate-100 ring-slate-200"
                  : isSuccess
                    ? "bg-emerald-50 ring-emerald-200"
                    : "bg-red-50 ring-red-200"
              }`}
            >
              {isLoading && (
                <ArrowPathIcon className="h-8 w-8 animate-spin text-slate-600" />
              )}
              {isSuccess && (
                <CheckCircleIcon className="h-9 w-9 text-emerald-600" strokeWidth={1.5} />
              )}
              {status === "error" && (
                <XCircleIcon className="h-9 w-9 text-red-500" strokeWidth={1.5} />
              )}
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {isLoading
                ? "Verifying email…"
                : isSuccess
                  ? "Email verified"
                  : "Verification failed"}
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              {isLoading
                ? "Please wait while we confirm your account."
                : message}
            </p>

            {!isLoading && (
              <Link
                to={isSuccess ? "/login" : "/check-email"}
                className="btn-primary mt-8 inline-flex w-full gap-2"
              >
                {isSuccess ? "Continue to sign in" : "Request a new link"}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            )}

            {status === "error" && (
              <Link
                to="/login"
                className="mt-4 inline-block text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Back to sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

