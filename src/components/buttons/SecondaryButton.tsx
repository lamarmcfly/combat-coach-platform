import Link from "next/link";
import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type SecondaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  href?: string;
};

const baseClasses =
  "inline-flex items-center justify-center rounded-md border border-accent px-5 py-2 text-sm font-semibold uppercase tracking-[0.08em] text-accent transition hover:bg-accent hover:text-black focus:outline-none focus:ring-2 focus:ring-accent";

export function SecondaryButton({ label, className, href, ...props }: SecondaryButtonProps) {
  if (href) {
    return (
      <Link href={href} className={clsx(baseClasses, className)}>
        {label}
      </Link>
    );
  }
  return (
    <button className={clsx(baseClasses, className)} {...props}>
      {label}
    </button>
  );
}
