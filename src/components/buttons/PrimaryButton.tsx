import Link from "next/link";
import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  href?: string;
};

const baseClasses =
  "inline-flex items-center justify-center rounded-md bg-accent px-5 py-2 text-sm font-semibold uppercase tracking-[0.08em] text-black transition hover:bg-accent-bright focus:outline-none focus:ring-2 focus:ring-accent-bright";

export function PrimaryButton({ label, className, href, ...props }: PrimaryButtonProps) {
  if (href) {
    return (
      <Link href={href} className={clsx(baseClasses, className)}>
        {label}
      </Link>
    );
  }
  return (
    <button
      className={clsx(baseClasses, className)}
      {...props}
    >
      {label}
    </button>
  );
}
