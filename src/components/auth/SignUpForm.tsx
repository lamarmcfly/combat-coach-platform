'use client';

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function SignUpForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
    };

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json();
        setError(body.error ?? "Unable to create account");
        setLoading(false);
        return;
      }
      const signInResult = await signIn("credentials", {
        email: payload.email,
        password: payload.password,
        redirect: false,
        callbackUrl: "/my/training",
      });
      if (signInResult?.error) {
        setError(signInResult.error);
        setLoading(false);
        return;
      }
      router.push("/my/training");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Unexpected error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          First Name
          <input
            name="firstName"
            required
            className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Last Name
          <input
            name="lastName"
            required
            className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
          />
        </label>
      </div>
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
          minLength={8}
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
        {loading ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
