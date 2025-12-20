import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { SignUpForm } from "@/components/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <PageContainer>
      <div className="mx-auto max-w-2xl rounded-2xl border border-[#2a2b30] bg-[#121216] p-8">
        <p className="text-xs uppercase tracking-[0.4em] text-copy-muted">Corner Access</p>
        <h1 className="font-display text-4xl uppercase text-copy">Create your account</h1>
        <p className="text-sm text-copy-muted">
          Join as an athlete today. Ready to coach?{" "}
          <Link href="/coach/apply" className="text-accent underline">
            Apply here
          </Link>
          .
        </p>
        <div className="mt-6">
          <SignUpForm />
        </div>
      </div>
    </PageContainer>
  );
}
