import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { CoachCard } from "@/components/cards/CoachCard";
import { getAllCoaches } from "@/data/server/content";

export const metadata = {
  title: "Find Coaches | Corner",
  description: "Browse and connect with world-class combat sports coaches",
};

export default async function CoachesPage() {
  const coaches = await getAllCoaches();

  return (
    <PageContainer>
      <div className="space-y-8">
        <SectionHeader
          eyebrow="Coaches"
          title="Train with the best"
        />

        {coaches.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {coaches.map((coach) => (
              <CoachCard key={coach.id} coach={coach} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#2a2b30] p-12 text-center">
            <p className="text-copy-muted">No coaches available at the moment.</p>
            <p className="mt-2 text-sm text-copy-muted">Check back soon!</p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
