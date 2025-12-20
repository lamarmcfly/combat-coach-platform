'use client';

import { useState } from "react";
import { CourseLevel, DisciplineSlug, LiveSession } from "@/types/content";
import { DisciplineFilter } from "@/components/DisciplineFilter";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { SessionCard } from "@/components/cards/SessionCard";

type LiveScheduleProps = {
  sessions: LiveSession[];
  bookedSessionIds: string[];
};

const levelFilters: (CourseLevel | "all")[] = ["all", "BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"];

export function LiveSchedule({ sessions, bookedSessionIds }: LiveScheduleProps) {
  const [discipline, setDiscipline] = useState<DisciplineSlug | "all">("all");
  const [level, setLevel] = useState<(typeof levelFilters)[number]>("all");

  const filteredSessions = sessions.filter((session) => {
    const disciplineMatch = discipline === "all" || session.discipline === discipline;
    const levelMatch = level === "all" || session.level === level;
    return disciplineMatch && levelMatch;
  });

  return (
    <div className="space-y-8">
      <section>
        <SectionHeader eyebrow="Disciplines" title="Pick your rounds" />
        <DisciplineFilter active={discipline} onChange={setDiscipline} />
      </section>
      <section>
        <div className="flex flex-wrap items-center gap-3">
          {levelFilters.map((filter) => (
            <button
              key={filter}
              className={`rounded-full px-4 py-1 text-xs uppercase tracking-[0.2em] transition ${
                level === filter ? "bg-accent text-black" : "bg-[#1f1f24] text-copy-muted hover:text-copy"
              }`}
              onClick={() => setLevel(filter)}
            >
              {filter === "all" ? "All Levels" : filter.replace("_", " ")}
            </button>
          ))}
        </div>
      </section>
      <section>
        <SectionHeader eyebrow="Schedule" title="Live sessions" />
        {filteredSessions.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredSessions.map((session) => (
              <SessionCard key={session.id} session={session} owned={bookedSessionIds.includes(session.id)} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-[#2a2b30] p-6 text-sm text-copy-muted">
            No live sessions match those filters yet.
          </p>
        )}
      </section>
    </div>
  );
}
