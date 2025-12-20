import { ReactNode } from "react";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
};

export function SectionHeader({ eyebrow, title, action }: SectionHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        {eyebrow ? <p className="text-xs uppercase tracking-[0.4em] text-copy-muted">{eyebrow}</p> : null}
        <h2 className="font-display text-3xl uppercase text-copy">{title}</h2>
      </div>
      {action}
    </div>
  );
}
