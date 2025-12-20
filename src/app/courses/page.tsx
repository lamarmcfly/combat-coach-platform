import { getCurrentSession } from "@/lib/auth/session";
import { getPublishedCourses } from "@/data/server/content";
import { getOwnedCourseIds } from "@/data/server/userContent";
import { PageContainer } from "@/components/layout/PageContainer";
import { CourseBrowse } from "@/components/courses/CourseBrowse";

export default async function CoursesPage() {
  const courses = await getPublishedCourses();
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  const ownedCourseIds = await getOwnedCourseIds(userId);

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-copy-muted">Corner Marketplace</p>
          <h1 className="font-display text-5xl uppercase text-copy">Programs</h1>
          <p className="text-sm text-copy-muted">Structured fight systems from verified coaches.</p>
        </div>
        <CourseBrowse courses={courses} ownedCourseIds={ownedCourseIds} />
      </div>
    </PageContainer>
  );
}
