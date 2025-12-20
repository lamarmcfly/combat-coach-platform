'use client';

import { FormEvent, useState, useTransition } from "react";
import { submitCoachApplication } from "@/app/coach/actions";

type DisciplineOption = {
  id: number;
  name: string;
  slug: string;
};

export function CoachApplicationForm({ disciplines }: { disciplines: DisciplineOption[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        await submitCoachApplication(formData);
        setMessage("Application submitted. Our team will review it within 2 business days.");
        event.currentTarget.reset();
      } catch (err) {
        console.error(err);
        setError("Unable to submit application. Please try again.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          Display Name
          <input
            name="displayName"
            required
            placeholder='e.g., "Coach Alvarez"'
            className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Gym / Team
          <input
            name="gymName"
            placeholder="Southside Combat Collective"
            className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          Gym Location
          <input
            name="gymLocation"
            placeholder="Brooklyn, NY"
            className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Years Coaching
          <input
            name="yearsCoaching"
            type="number"
            min={0}
            required
            className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
          />
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm">
        Short Bio
        <textarea
          name="shortBio"
          required
          rows={3}
          className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        Longer Bio / Highlights
        <textarea
          name="longBio"
          rows={4}
          className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
        />
      </label>
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-copy-muted">Disciplines</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {disciplines.map((discipline) => (
            <label key={discipline.id} className="flex items-center gap-2 text-sm text-copy-muted">
              <input type="checkbox" name="disciplines" value={discipline.slug} className="accent-accent" />
              {discipline.name}
            </label>
          ))}
        </div>
      </div>
      <label className="flex flex-col gap-2 text-sm">
        Highlight Video URL
        <input
          name="highlightVideoUrl"
          type="url"
          placeholder="https://videos.corner/coach-reel"
          className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        Instagram
        <input
          name="instagram"
          type="url"
          placeholder="https://instagram.com/coach"
          className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        YouTube
        <input
          name="youtube"
          type="url"
          placeholder="https://youtube.com/@coach"
          className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
        />
      </label>
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      {message ? <p className="text-sm text-copy-muted">{message}</p> : null}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-accent px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black hover:bg-accent-bright disabled:opacity-60"
      >
        {isPending ? "Submitting..." : "Submit application"}
      </button>
    </form>
  );
}
