import Link from "next/link";
import { getCurrentSession } from "@/lib/auth/session";
import { PageContainer } from "@/components/layout/PageContainer";
import { CoachApplicationForm } from "@/components/coach/CoachApplicationForm";
import { getDisciplineOptions } from "@/data/server/content";
import { PrimaryButton } from "@/components/buttons/PrimaryButton";
import { SecondaryButton } from "@/components/buttons/SecondaryButton";

export default async function CoachApplyPage() {
  const session = await getCurrentSession();
  const disciplines = await getDisciplineOptions();

  if (!session?.user?.id) {
    return (
      <PageContainer>
        <div className="rounded-2xl border border-[#2a2b30] bg-[#121216] p-8 text-center">
          <h1 className="font-display text-4xl uppercase text-copy">Coach Application</h1>
          <p className="mt-2 text-sm text-copy-muted">Sign in or create an account before applying to coach on Corner.</p>
          <div className="mt-4 flex justify-center gap-3">
            <PrimaryButton label="Sign in" href="/auth/sign-in" />
            <SecondaryButton label="Create account" href="/auth/sign-up" />
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mx-auto max-w-3xl rounded-2xl border border-[#2a2b30] bg-[#121216] p-8">
        <p className="text-xs uppercase tracking-[0.4em] text-copy-muted">Corner Coaches</p>
        <h1 className="font-display text-4xl uppercase text-copy">Apply to coach</h1>
        <p className="text-sm text-copy-muted">
          Tell us about your fight history, coaching resume, and training philosophy. Our admin team reviews every application to keep the
          marketplace focused on verified elites. Need help?{" "}
          <Link href="mailto:coaches@corner.com" className="text-accent underline">
            Contact support
          </Link>
          .
        </p>
        <div className="mt-6">
          <CoachApplicationForm disciplines={disciplines} />
        </div>
      </div>
    </PageContainer>
  );
}
