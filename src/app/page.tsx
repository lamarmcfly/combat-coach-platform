import { getCurrentSession } from "@/lib/auth/session";
import { getPublishedCourses, getLiveSessions, getFeaturedCoaches } from "@/data/server/content";
import { getBookedSessionIds, getOwnedCourseIds } from "@/data/server/userContent";
import { HomeFeed } from "@/components/home/HomeFeed";

export default async function HomePage() {
  const session = await getCurrentSession();
  const userId = session?.user?.id;

  const [courses, sessions, coachList, ownedCourseIds, bookedSessionIds] = await Promise.all([
    getPublishedCourses(),
    getLiveSessions(),
    getFeaturedCoaches(4),
    getOwnedCourseIds(userId),
    getBookedSessionIds(userId),
  ]);

  return (
    <HomeFeed
      courses={courses}
      liveSessions={sessions}
      coaches={coachList}
      ownedCourseIds={ownedCourseIds}
      bookedSessionIds={bookedSessionIds}
    />
  );
}
