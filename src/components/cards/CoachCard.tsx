import { CoachSummary } from "@/types/content";
import { SecondaryButton } from "@/components/buttons/SecondaryButton";

type CoachCardProps = {
  coach: CoachSummary;
};

export function CoachCard({ coach }: CoachCardProps) {
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-[#2a2b30] bg-[#151518] p-4 shadow-card">
      <div className="flex items-center gap-3">
        <div
          className="h-16 w-16 rounded-full border border-[#2a2b30]"
          style={{
            backgroundImage: `url(${coach.avatarUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div>
          <p className="font-display text-2xl uppercase">{coach.name}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-copy-muted">{coach.gym}</p>
        </div>
      </div>
      <p className="text-sm text-copy-muted">{coach.bio}</p>
      <div className="flex gap-6 text-xs uppercase tracking-widest text-copy-muted">
        <div>
          <p className="text-copy text-lg">{coach.yearsCoaching}</p>
          <p>Years</p>
        </div>
        <div>
          <p className="text-copy text-lg">{coach.fightersCoached}</p>
          <p>Fighters</p>
        </div>
        <div>
          <p className="text-copy text-lg">{coach.titles}</p>
          <p>Titles</p>
        </div>
      </div>
      <SecondaryButton label={`Train with ${coach.name.split(" ")[0]}`} href={`/coaches/${coach.id}`} />
    </article>
  );
}
