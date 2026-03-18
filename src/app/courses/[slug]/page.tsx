import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { Tag } from "@/components/Tag";
import { CourseSidebar } from "@/components/course/CourseSidebar";
import { CourseTabs } from "@/components/course/CourseTabs";
import { getCurrentSession } from "@/lib/auth/session";
import { userOwnsCourse } from "@/lib/auth/access";
import { getCourseBySlugServer } from "@/data/server/content";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const course = await getCourseBySlugServer(params.slug);
  if (!course) return { title: "Course Not Found" };

  return {
    title: course.title,
    description: course.shortDescription || `${course.title} - Combat sports course by ${course.coach.name}`,
    openGraph: {
      title: course.title,
      description: course.shortDescription || `Combat sports course by ${course.coach.name}`,
      type: "website",
    },
  };
}

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
  const course = await getCourseBySlugServer(params.slug);
  if (!course) {
    notFound();
  }
  const session = await getCurrentSession();
  const owned = await userOwnsCourse(session?.user?.id, course.id);

  return (
    <PageContainer>
      <div className="space-y-8">
        <div className="space-y-4">
          <VideoPlayer videoRef={course.trailerVideoUrl} controls className="w-full rounded-2xl border border-[#2b2c30]" />
          <div className="flex flex-wrap items-center gap-4">
            <Tag>{course.discipline.replace("-", " ")}</Tag>
            <Tag tone="muted">{course.level.replace("_", " ")}</Tag>
            <p className="text-sm text-copy-muted">
              {course.coach.name} · {course.coach.gym}
            </p>
          </div>
          <h1 className="font-display text-4xl uppercase text-copy">{course.title}</h1>
          <p className="text-copy-muted">{course.shortDescription}</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <CourseTabs course={course} owned={owned} />
          <CourseSidebar courseId={course.id} priceCents={course.priceCents} stats={course.stats} owned={owned} />
        </div>
      </div>
    </PageContainer>
  );
}
