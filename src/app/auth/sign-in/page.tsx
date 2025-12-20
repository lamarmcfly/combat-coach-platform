import { PageContainer } from "@/components/layout/PageContainer";
import { SignInForm } from "@/components/auth/SignInForm";

export default function SignInPage() {
  return (
    <PageContainer>
      <div className="mx-auto max-w-md rounded-2xl border border-[#2a2b30] bg-[#121216] p-8">
        <p className="text-xs uppercase tracking-[0.4em] text-copy-muted">Corner Access</p>
        <h1 className="font-display text-4xl uppercase text-copy">Sign in</h1>
        <p className="text-sm text-copy-muted">Return to your programs and sessions.</p>
        <div className="mt-6">
          <SignInForm />
        </div>
      </div>
    </PageContainer>
  );
}
