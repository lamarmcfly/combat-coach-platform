'use client';

import clsx from "clsx";
import { disciplines } from "@/data/sampleContent";
import { DisciplineSlug } from "@/types/content";

type DisciplineFilterProps = {
  active: DisciplineSlug | "all";
  onChange?: (slug: DisciplineSlug | "all") => void;
};

export function DisciplineFilter({ active, onChange }: DisciplineFilterProps) {
  const items: (DisciplineSlug | "all")[] = ["all", ...disciplines.map((d) => d.slug)];
  return (
    <div className="flex flex-wrap gap-3 rounded-xl border border-[#2a2b30] bg-[#141416] p-4">
      {items.map((slug) => (
        <button
          key={slug}
          className={clsx(
            "rounded-full px-4 py-1 text-xs uppercase tracking-[0.2em] transition",
            active === slug ? "bg-accent text-black" : "bg-[#1f1f24] text-copy-muted hover:text-copy",
          )}
          onClick={() => onChange?.(slug)}
        >
          {slug === "all" ? "All" : slug.replace("-", " ")}
        </button>
      ))}
    </div>
  );
}
