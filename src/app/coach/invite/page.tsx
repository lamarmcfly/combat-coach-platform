'use client';

import { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { sendClientInvite } from '@/app/coach/setup/actions';

export default function CoachInvitePage() {
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<Array<{ email: string; message: string }>>([]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get('email') as string;

    try {
      const result = await sendClientInvite(formData);
      setResults((prev) => [{ email, message: result.message }, ...prev]);
      form.reset();
    } catch {
      setResults((prev) => [{ email, message: 'Failed to send invite' }, ...prev]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageContainer>
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="rounded-2xl border border-[#2a2b30] bg-[#121216] p-6">
          <SectionHeader eyebrow="Team" title="Invite Athletes" />
          <p className="text-sm text-gray-400 mb-6">
            Send invitations to your existing clients. They&apos;ll receive an email with a link to sign up and connect with you on Corner.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="flex flex-col gap-2 text-sm text-gray-300">
              Email address
              <input
                name="email"
                type="email"
                required
                placeholder="athlete@example.com"
                className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-white focus:border-accent focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-gray-300">
              Personal note (optional)
              <textarea
                name="note"
                rows={2}
                placeholder="Hey, I'm using Corner for scheduling and video reviews now..."
                className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-white focus:border-accent focus:outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-md bg-accent px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black hover:bg-accent-bright disabled:opacity-50"
            >
              {saving ? 'Sending...' : 'Send Invitation'}
            </button>
          </form>
        </div>

        {results.length > 0 && (
          <div className="rounded-2xl border border-[#2a2b30] bg-[#121216] p-6">
            <SectionHeader eyebrow="Sent" title="Invitation History" />
            <div className="space-y-2">
              {results.map((r, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border border-[#2a2b30] bg-[#0f0f12] px-4 py-3">
                  <span className="text-sm text-white">{r.email}</span>
                  <span className="text-xs text-gray-400">{r.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
