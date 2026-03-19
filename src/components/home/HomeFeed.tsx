"use client";

import { useState } from "react";
import { Course, CoachSummary, DisciplineSlug, LiveSession } from "@/types/content";
import { HeroVideoBanner } from "@/components/HeroVideoBanner";
import { DisciplineFilter } from "@/components/DisciplineFilter";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { CourseCard } from "@/components/cards/CourseCard";
import { SessionCard } from "@/components/cards/SessionCard";
import { CoachCard } from "@/components/cards/CoachCard";
import { PageContainer } from "@/components/layout/PageContainer";
import { PrimaryButton } from "@/components/buttons/PrimaryButton";

type HomeFeedProps = {
  courses: Course[];
  liveSessions: LiveSession[];
  coaches: CoachSummary[];
  ownedCourseIds: string[];
  bookedSessionIds: string[];
};

export function HomeFeed({ courses, liveSessions, coaches, ownedCourseIds, bookedSessionIds }: HomeFeedProps) {
  const [activeDiscipline, setActiveDiscipline] = useState<DisciplineSlug | "all">("all");
  const filteredCourses =
    activeDiscipline === "all" ? courses : courses.filter((course) => course.discipline === activeDiscipline);

  return (
    <PageContainer>
      <div className="space-y-10">
        <HeroVideoBanner
          posterImage="/images/hero-fight.jpg"
          title="Train with proven combat coaches"
          subtitle="Structured Muay Thai, boxing, MMA, wrestling, and more. Programs that respect the grind, not algorithms."
          primaryCta={{ label: "Start training", href: "/courses" }}
          secondaryCta={{ label: "Meet the coaches", href: "/coaches" }}
        />

        <section>
          <SectionHeader eyebrow="Disciplines" title="Find your track" />
          <DisciplineFilter active={activeDiscipline} onChange={setActiveDiscipline} />
        </section>

        <section>
          <SectionHeader
            eyebrow="Programs"
            title="Featured courses"
            action={<PrimaryButton label="View all" href="/courses" />}
          />
          <div className="section-grid">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} owned={ownedCourseIds.includes(course.id)} />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            eyebrow="Live This Week"
            title="Keep your rounds honest"
            action={<PrimaryButton label="See schedule" href="/live" />}
          />
          <div className="grid gap-4 md:grid-cols-2">
            {liveSessions.map((session) => (
              <SessionCard key={session.id} session={session} owned={bookedSessionIds.includes(session.id)} />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            eyebrow="Coaches"
            title="Meet the corner team"
            action={<PrimaryButton label="Browse coaches" href="/coaches" />}
          />
          <div className="grid gap-4 md:grid-cols-2">
            {coaches.map((coach) => (
              <CoachCard key={coach.id} coach={coach} />
            ))}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
