import clsx from "clsx";
import { ReactNode } from "react";

type TagProps = {
  children: ReactNode;
  tone?: "default" | "muted" | "accent";
};

export function Tag({ children, tone = "default" }: TagProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase",
        {
          "bg-[#1c1d20] text-copy": tone === "default",
          "bg-[#111116] text-copy-muted": tone === "muted",
          "bg-accent text-black": tone === "accent",
        },
      )}
    >
      {children}
    </span>
  );
}
