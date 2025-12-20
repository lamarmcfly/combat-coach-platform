import Link from "next/link";
import { Course } from "@/types/content";
import { Tag } from "@/components/Tag";
import { PrimaryButton } from "@/components/buttons/PrimaryButton";

type CourseCardProps = {
  course: Course;
  owned?: boolean;
  progressPercent?: number;
};

export function CourseCard({ course, owned, progressPercent }: CourseCardProps) {
  const href = `/courses/${course.slug}`;
  const price = `$${(course.priceCents / 100).toFixed(0)}`;
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-[#2a2b30] bg-[#151518] p-4 shadow-card">
      <Link href={href} className="relative block overflow-hidden rounded-lg">
        <div
          className="h-48 w-full bg-[#1f1f24] object-cover transition duration-300 hover:scale-[1.02]"
          style={{
            backgroundImage: `url(${course.coverImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
          <Tag>{course.discipline.replace("-", " ")}</Tag>
          <Tag tone="muted">{course.level.replace("_", " ")}</Tag>
        </div>
      </Link>
      <div className="flex grow flex-col gap-4">
        <div>
          <Link href={href} className="font-display text-2xl uppercase text-copy">
            {course.title}
          </Link>
          <p className="text-sm text-copy-muted">{course.shortDescription}</p>
        </div>
        <div className="flex items-center justify-between text-sm text-copy-muted">
          <span>{course.coach.name}</span>
          <span>{price}</span>
        </div>
      </div>
      {progressPercent !== undefined ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-copy-muted">
            <span>Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#2a2b30]">
            <div className="h-1.5 rounded-full bg-accent" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      ) : null}
      <PrimaryButton label={owned ? "Resume training" : "Start program"} href={href} />
    </article>
  );
}
