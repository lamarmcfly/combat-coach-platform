"use client";

import Link from "next/link";
import { useState } from "react";
import { PrimaryButton } from "@/components/buttons/PrimaryButton";

type SessionSidebarProps = {
  sessionId: string;
  priceCents: number;
  capacity: number;
  startTime: string;
  durationMinutes: number;
  meetingUrl?: string;
  booked?: boolean;
};

export function SessionSidebar({
  sessionId,
  priceCents,
  capacity,
  startTime,
  durationMinutes,
  meetingUrl,
  booked,
}: SessionSidebarProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [acceptedNoShowPolicy, setAcceptedNoShowPolicy] = useState(false);
  const [acceptedSafetyWaiver, setAcceptedSafetyWaiver] = useState(false);
  const [acceptedWaitlistAutoBilling, setAcceptedWaitlistAutoBilling] = useState(false);

  const price = `$${(priceCents / 100).toFixed(0)}`;
  const canBook = acceptedNoShowPolicy && acceptedSafetyWaiver;

  const handleCheckout = async () => {
    if (booked && meetingUrl) {
      window.open(meetingUrl, "_blank");
      return;
    }

    setErrorMessage(null);
    if (!canBook) {
      setErrorMessage("Acknowledge the no-show policy and safety waiver to continue.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/checkout/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          liveSessionId: sessionId,
          acceptedNoShowPolicy,
          acceptedSafetyWaiver,
          acceptedWaitlistAutoBilling,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data?.details?.[0]?.message) {
          setErrorMessage(data.details[0].message);
        } else if (data?.message) {
          setErrorMessage(data.message);
        } else if (data?.error) {
          setErrorMessage(data.error);
        } else {
          setErrorMessage("Unable to start checkout. Please try again.");
        }
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (!data.success) {
        setErrorMessage("Checkout initialized, but no checkout URL was returned.");
      }
    } catch (error) {
      console.error("Live session checkout failed:", error);
      setErrorMessage("Unable to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="rounded-2xl border border-[#2a2b30] bg-[#121216] p-6 shadow-card">
      <p className="text-xs uppercase tracking-[0.3em] text-copy-muted">Investment</p>
      <p className="font-display text-4xl uppercase">{price}</p>
      <PrimaryButton
        label={booked ? "Enter session" : loading ? "Preparing..." : "Book spot"}
        onClick={handleCheckout}
        className="mt-4 w-full"
        disabled={!booked && (!canBook || loading)}
      />

      {!booked ? (
        <div className="mt-4 rounded-xl border border-[#1f1f24] bg-[#0f0f12] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-copy-muted">Before you book</p>
          <div className="mt-3 space-y-3 text-xs text-copy-muted">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={acceptedNoShowPolicy}
                onChange={(event) => setAcceptedNoShowPolicy(event.target.checked)}
                className="mt-0.5 accent-accent"
              />
              <span>I acknowledge the no-show policy. Missed sessions may result in charges or forfeited credits.</span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={acceptedSafetyWaiver}
                onChange={(event) => setAcceptedSafetyWaiver(event.target.checked)}
                className="mt-0.5 accent-accent"
              />
              <span>I accept the training safety waiver and understand participation risks.</span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={acceptedWaitlistAutoBilling}
                onChange={(event) => setAcceptedWaitlistAutoBilling(event.target.checked)}
                className="mt-0.5 accent-accent"
              />
              <span>I consent to automatic billing if I join the waitlist and a spot opens.</span>
            </label>
          </div>
          <p className="mt-3 text-[11px] text-copy-muted">
            Booking confirms agreement to the{" "}
            <Link href="/legal/terms" className="text-accent underline">
              Terms of Service
            </Link>
            .
          </p>
        </div>
      ) : null}

      {errorMessage ? (
        <p className="mt-3 text-xs text-[#ff9a9a]">{errorMessage}</p>
      ) : null}

      <div className="mt-6 space-y-2 text-sm text-copy-muted">
        <p>Starts: {new Date(startTime).toLocaleString()}</p>
        <p>Duration: {durationMinutes} minutes</p>
        <p>Capacity: {capacity} athletes</p>
      </div>
      {booked ? (
        <div className="mt-4 rounded-lg border border-accent/40 bg-[#1b1b20] p-4 text-xs">
          <p className="text-copy-muted">Meeting link:</p>
          <a href={meetingUrl} className="text-accent underline" target="_blank" rel="noreferrer">
            {meetingUrl}
          </a>
        </div>
      ) : (
        <p className="mt-4 text-xs text-copy-muted">
          Meeting URL unlocks once you book. Spots are limited - once capacity hits, bookings close automatically.
        </p>
      )}
    </aside>
  );
}
