'use client';

import { useState } from "react";
import { Course, CourseLevel, DisciplineSlug } from "@/types/content";
import { DisciplineFilter } from "@/components/DisciplineFilter";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { CourseCard } from "@/components/cards/CourseCard";

type CourseBrowseProps = {
  courses: Course[];
  ownedCourseIds: string[];
};

const levelFilters: (CourseLevel | "all")[] = ["all", "BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"];

export function CourseBrowse({ courses, ownedCourseIds }: CourseBrowseProps) {
  const [discipline, setDiscipline] = useState<DisciplineSlug | "all">("all");
  const [level, setLevel] = useState<(typeof levelFilters)[number]>("all");

  const filteredCourses = courses.filter((course) => {
    const disciplineMatch = discipline === "all" || course.discipline === discipline;
    const levelMatch = level === "all" || course.level === level;
    return disciplineMatch && levelMatch;
  });

  return (
    <div className="space-y-8">
      <section>
        <SectionHeader eyebrow="Disciplines" title="Pick your system" />
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
        <SectionHeader
          eyebrow="Courses"
          title={discipline === "all" ? "All programs" : `${discipline.replace("-", " ")} programs`}
        />
        {filteredCourses.length ? (
          <div className="section-grid">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} owned={ownedCourseIds.includes(course.id)} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-[#2a2b30] p-6 text-sm text-copy-muted">
            No courses match those filters yet.
          </p>
        )}
      </section>
    </div>
  );
}
