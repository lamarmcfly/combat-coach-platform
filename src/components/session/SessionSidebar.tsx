"use client";

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
  const price = `$${(priceCents / 100).toFixed(0)}`;

  const handleCheckout = async () => {
    if (booked && meetingUrl) {
      window.open(meetingUrl, "_blank");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/checkout/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveSessionId: sessionId }),
      });
      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
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
      />
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
          Meeting URL unlocks once you book. Spots are limited — once capacity hits, bookings close automatically.
        </p>
      )}
    </aside>
  );
}
