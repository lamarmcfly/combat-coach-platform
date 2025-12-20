"use client";

import { PrimaryButton } from "@/components/buttons/PrimaryButton";
import { Tag } from "@/components/Tag";
import { useState } from "react";

type CourseSidebarProps = {
  courseId: string;
  priceCents: number;
  stats: {
    modules: number;
    lessons: number;
    durationHours: number;
  };
  owned?: boolean;
};

export function CourseSidebar({ courseId, priceCents, stats, owned }: CourseSidebarProps) {
  const [loading, setLoading] = useState(false);
  const actionLabel = owned ? "Resume training" : "Start this program";

  const handleCheckout = async () => {
    if (owned) {
      window.location.href = `/courses/${courseId}/lessons`;
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/checkout/course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } finally {
      setLoading(false);
    }
  };

  const price = `$${(priceCents / 100).toFixed(0)}`;

  return (
    <aside className="rounded-2xl border border-[#2a2b30] bg-[#121216] p-6 shadow-card">
      <p className="text-sm text-copy-muted">Price</p>
      <p className="text-4xl font-display uppercase">{price}</p>
      <PrimaryButton label={loading ? "Preparing..." : actionLabel} onClick={handleCheckout} className="mt-4 w-full" />

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between text-sm text-copy-muted">
          <span>Modules</span>
          <Tag tone="muted">{stats.modules}</Tag>
        </div>
        <div className="flex items-center justify-between text-sm text-copy-muted">
          <span>Lessons</span>
          <Tag tone="muted">{stats.lessons}</Tag>
        </div>
        <div className="flex items-center justify-between text-sm text-copy-muted">
          <span>Total Hours</span>
          <Tag tone="muted">{stats.durationHours}</Tag>
        </div>
      </div>
    </aside>
  );
}
