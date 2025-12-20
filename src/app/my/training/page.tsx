import Link from "next/link";
import { getCurrentSession } from "@/lib/auth/session";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { CourseCard } from "@/components/cards/CourseCard";
import { PrimaryButton } from "@/components/buttons/PrimaryButton";
import { getPublishedCourses } from "@/data/server/content";
import { getCourseProgressMap } from "@/data/server/userContent";
import { TrainingStats } from "@/components/training/TrainingStats";
import { ContinueLearning } from "@/components/training/ContinueLearning";

export default async function MyTrainingPage() {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return (
      <PageContainer>
        <div className="rounded-2xl border border-[#2a2b30] bg-[#121216] p-8 text-center">
          <h1 className="font-display text-4xl uppercase text-copy">My Training</h1>
          <p className="mt-2 text-sm text-copy-muted">Sign in to see your programs and track progress.</p>
          <div className="mt-4 flex justify-center">
            <PrimaryButton label="Sign in" href="/auth/sign-in" />
          </div>
        </div>
      </PageContainer>
    );
  }

  const [courses, progressMap] = await Promise.all([getPublishedCourses(), getCourseProgressMap(session.user.id)]);
  const ownedCourses = courses.filter((course) => progressMap[course.id] !== undefined);

  // Calculate training statistics
  const progressValues = Object.values(progressMap);
  const totalCourses = ownedCourses.length;
  const averageProgress = totalCourses > 0 ? Math.round(progressValues.reduce((a, b) => a + b, 0) / totalCourses) : 0;
  const completedCourses = progressValues.filter((p) => p >= 100).length;
  const inProgressCourses = progressValues.filter((p) => p > 0 && p < 100).length;

  // Find the most in-progress course for "Continue Learning"
  const mostRecentCourse = ownedCourses
    .filter((c) => progressMap[c.id] > 0 && progressMap[c.id] < 100)
    .sort((a, b) => progressMap[b.id] - progressMap[a.id])[0];

  return (
    <PageContainer>
      <SectionHeader eyebrow="Dashboard" title="My training" />

      {ownedCourses.length > 0 && (
        <div className="mb-8">
          <TrainingStats
            totalCourses={totalCourses}
            averageProgress={averageProgress}
            completedCourses={completedCourses}
            inProgressCourses={inProgressCourses}
          />
        </div>
      )}

      {mostRecentCourse && (
        <div className="mb-8">
          <ContinueLearning course={mostRecentCourse} progressPercent={progressMap[mostRecentCourse.id]} />
        </div>
      )}

      {ownedCourses.length ? (
        <>
          <h2 className="mb-4 text-lg font-semibold text-white">All Courses</h2>
          <div className="section-grid">
            {ownedCourses.map((course) => (
              <CourseCard key={course.id} course={course} owned progressPercent={progressMap[course.id]} />
            ))}
          </div>
        </>
      ) : (
        <p className="rounded-2xl border border-dashed border-[#2a2b30] p-6 text-sm text-copy-muted">
          You haven&apos;t started a program yet. Explore the{" "}
          <Link className="text-accent underline" href="/courses">
            course marketplace
          </Link>{" "}
          to begin.
        </p>
      )}
    </PageContainer>
  );
}
