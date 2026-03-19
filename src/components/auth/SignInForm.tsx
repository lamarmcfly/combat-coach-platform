'use client';

import { FormEvent, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

function SignInFormInner() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/my/training";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const result = await signIn("credentials", { email, password, redirect: false, callbackUrl });
    setLoading(false);

    if (result?.error) {
      setError(result.error === "CredentialsSignin"
        ? "Invalid email or password. Please try again."
        : result.error);
      return;
    }

    if (result?.ok) {
      // Force a full page navigation to ensure session cookie is picked up
      window.location.href = callbackUrl;
      return;
    }

    setError("Sign in failed. Please try again.");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm">
        Email
        <input
          name="email"
          type="email"
          required
          className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        Password
        <input
          name="password"
          type="password"
          required
          className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
        />
      </label>
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-accent px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-accent-bright disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
      <p className="text-xs text-copy-muted">
        Need an account?{" "}
        <Link href="/auth/sign-up" className="text-accent underline">
          Join Corner
        </Link>
      </p>
    </form>
  );
}

export function SignInForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInFormInner />
    </Suspense>
  );
}
