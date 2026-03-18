"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

type VerifyState = "loading" | "success" | "error" | "expired";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("No verification token provided.");
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setState("success");
          setMessage(data.message);
        } else if (res.status === 410) {
          setState("expired");
          setMessage(data.error || "Verification token has expired.");
        } else {
          setState("error");
          setMessage(data.error || "Verification failed.");
        }
      } catch {
        setState("error");
        setMessage("Something went wrong. Please try again later.");
      }
    }

    verify();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0b0c] px-4">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-[#2a2b30] bg-[#121216] p-8 text-center">
        <p className="mb-1 text-xs uppercase tracking-[0.4em] text-copy-muted">
          Corner Access
        </p>
        <h1 className="font-display mb-6 text-3xl uppercase text-copy">
          Email Verification
        </h1>

        {state === "loading" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2a2b30] border-t-[#f0473a]" />
            <p className="text-sm text-copy-muted">
              Verifying your email address...
            </p>
          </div>
        )}

        {state === "success" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-900/30">
              <svg
                className="h-8 w-8 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-sm text-copy">{message}</p>
            <Link
              href="/auth/sign-in"
              className="mt-4 inline-block rounded-lg bg-[#f0473a] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Sign In
            </Link>
          </div>
        )}

        {state === "error" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-900/30">
              <svg
                className="h-8 w-8 text-[#f0473a]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <p className="text-sm text-copy">{message}</p>
            <Link
              href="/auth/sign-up"
              className="mt-4 inline-block rounded-lg border border-[#2a2b30] px-6 py-3 text-sm font-semibold text-copy-muted transition-colors hover:border-[#f0473a] hover:text-copy"
            >
              Back to Sign Up
            </Link>
          </div>
        )}

        {state === "expired" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-900/30">
              <svg
                className="h-8 w-8 text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm text-copy">{message}</p>
            <p className="text-xs text-copy-muted">
              Please sign up again to receive a new verification link.
            </p>
            <Link
              href="/auth/sign-up"
              className="mt-4 inline-block rounded-lg border border-[#2a2b30] px-6 py-3 text-sm font-semibold text-copy-muted transition-colors hover:border-[#f0473a] hover:text-copy"
            >
              Back to Sign Up
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0b0b0c]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2a2b30] border-t-[#f0473a]" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
