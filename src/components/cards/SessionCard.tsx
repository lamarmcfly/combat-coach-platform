import Link from "next/link";
import { LiveSession } from "@/types/content";
import { Tag } from "@/components/Tag";
import { PrimaryButton } from "@/components/buttons/PrimaryButton";
import { format } from "date-fns";

type SessionCardProps = {
  session: LiveSession;
  owned?: boolean;
};

export function SessionCard({ session, owned }: SessionCardProps) {
  const date = format(new Date(session.startTime), "EEE • MMM d • h:mm a");
  const price = `$${(session.priceCents / 100).toFixed(0)}`;
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-[#2a2b30] bg-[#151518] p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Tag>{session.discipline.replace("-", " ")}</Tag>
          <Tag tone="muted">{session.level.replace("_", " ")}</Tag>
        </div>
        <span className="text-sm text-copy-muted">{price}</span>
      </div>
      <Link href={`/sessions/${session.id}`} className="font-display text-2xl uppercase hover:text-accent">
        {session.title}
      </Link>
      <p className="text-sm text-copy-muted">{session.description}</p>
      <p className="text-xs uppercase tracking-[0.2em] text-copy-muted">{date}</p>
      <div className="flex items-center justify-between text-xs text-copy-muted">
        <span>{session.coach.name}</span>
        <span>{session.capacity} spots</span>
      </div>
      <PrimaryButton label={owned ? "Join session" : "Book spot"} href={`/sessions/${session.id}`} />
    </article>
  );
}
