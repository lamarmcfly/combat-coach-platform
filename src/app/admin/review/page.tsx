import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { getCurrentSession } from "@/lib/auth/session";
import { PageContainer } from "@/components/layout/PageContainer";
import { reviewCoachApplication } from "@/app/coach/actions";
import { CoachStatus } from "@prisma/client";

export default async function AdminReviewPage() {
  const session = await getCurrentSession();
  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  const pendingProfiles = await db.coachProfile.findMany({
    where: { status: CoachStatus.PENDING },
    include: { user: true, disciplines: { include: { discipline: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-copy-muted">Admin</p>
          <h1 className="font-display text-4xl uppercase text-copy">Coach applications</h1>
          <p className="text-sm text-copy-muted">Review pending coaches before granting dashboard access.</p>
        </div>
        <div className="space-y-4">
          {pendingProfiles.length ? (
            pendingProfiles.map((profile) => (
              <article key={profile.id} className="rounded-2xl border border-[#2a2b30] bg-[#121216] p-6 shadow-card">
                <div className="flex flex-col gap-2">
                  <h2 className="font-display text-2xl uppercase text-copy">{profile.displayName}</h2>
                  <p className="text-xs uppercase tracking-[0.2em] text-copy-muted">
                    {profile.gymName ?? "Independent"} · {profile.gymLocation ?? "Remote"}
                  </p>
                  <p className="text-sm text-copy-muted">{profile.shortBio}</p>
                  <p className="text-xs text-copy-muted">
                    Disciplines: {profile.disciplines.map((d) => d.discipline.name).join(", ") || "N/A"}
                  </p>
                  <div className="mt-4 flex gap-3">
                    <form action={reviewCoachApplication}>
                      <input type="hidden" name="profileId" value={profile.id} />
                      <input type="hidden" name="status" value="APPROVED" />
                      <button
                        type="submit"
                        className="rounded-md bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black"
                      >
                        Approve
                      </button>
                    </form>
                    <form action={reviewCoachApplication}>
                      <input type="hidden" name="profileId" value={profile.id} />
                      <input type="hidden" name="status" value="REJECTED" />
                      <button
                        type="submit"
                        className="rounded-md border border-[#2a2b30] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-copy-muted hover:border-accent hover:text-accent"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-[#2a2b30] p-6 text-sm text-copy-muted">
              No pending applications right now.
            </p>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
