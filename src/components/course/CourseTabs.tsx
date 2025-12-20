"use client";

import { useState } from "react";
import clsx from "clsx";
import { Course } from "@/types/content";

type CourseTabsProps = {
  course: Course;
  owned?: boolean;
};

const tabs = ["Overview", "Curriculum", "Coach", "Reviews"] as const;

export function CourseTabs({ course, owned }: CourseTabsProps) {
  const [active, setActive] = useState<(typeof tabs)[number]>("Overview");

  return (
    <div className="rounded-2xl border border-[#2a2b30] bg-[#121216] p-6">
      <div className="flex flex-wrap gap-4 border-b border-[#1f1f24] pb-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={clsx(
              "text-sm uppercase tracking-[0.2em] text-copy-muted transition",
              active === tab ? "text-copy" : "hover:text-copy",
            )}
            onClick={() => setActive(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="pt-6 text-sm leading-relaxed text-copy-muted">
        {active === "Overview" && (
          <div className="space-y-4">
            <p>{course.longDescription}</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>What you&apos;ll learn: elbow chains, clinch pressure, close-range defense.</li>
              <li>Who this is for: intermediate strikers with 1+ year of padwork.</li>
              <li>Requirements: bag, basic pads, partner for clinch labs.</li>
            </ul>
          </div>
        )}
        {active === "Curriculum" && (
          <div className="space-y-4">
            {course.modules.map((module) => (
              <div key={module.label}>
                <p className="font-display text-xl text-copy">{module.label}</p>
                <div className="mt-2 space-y-2">
                  {module.lessons.map((lesson) => {
                    const locked = !owned && !lesson.isPreview;
                    return (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between rounded-lg border border-[#1f1f24] px-3 py-2"
                      >
                      <div>
                          <p className="text-copy">
                            {lesson.title} {locked ? "🔒" : ""}
                          </p>
                          <p className="text-xs text-copy-muted">
                            {lesson.description} {lesson.isPreview ? "(Preview)" : ""}
                          </p>
                      </div>
                        <span className="text-xs text-copy-muted">{lesson.durationMinutes ?? 12} min</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        {active === "Coach" && (
          <div>
            <p className="font-display text-xl text-copy">{course.coach.name}</p>
            <p className="text-sm text-copy-muted">{course.coach.bio}</p>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-copy-muted">
              Gym: {course.coach.gym} · Location: {course.coach.location}
            </p>
          </div>
        )}
        {active === "Reviews" && (
          <div className="rounded-lg border border-[#1f1f24] p-4 text-sm text-copy-muted">
            Reviews are coming soon. Early athletes will be able to leave verified feedback.
          </div>
        )}
      </div>
    </div>
  );
}
