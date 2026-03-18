'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveCoachProfile, saveOfficeHours, completeCoachSetup, sendClientInvite } from './actions';

type Step = 'welcome' | 'profile' | 'availability' | 'invite' | 'complete';
const STEPS: Step[] = ['welcome', 'profile', 'availability', 'invite', 'complete'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function CoachSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [saving, setSaving] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);

  const idx = STEPS.indexOf(step);
  const goNext = () => setStep(STEPS[idx + 1]);
  const goBack = () => setStep(STEPS[idx - 1]);

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveCoachProfile(new FormData(e.currentTarget));
      goNext();
    } catch {
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvailabilitySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveOfficeHours(new FormData(e.currentTarget));
      goNext();
    } catch {
      alert('Failed to save availability.');
    } finally {
      setSaving(false);
    }
  }

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setInviteStatus(null);
    try {
      const result = await sendClientInvite(new FormData(e.currentTarget));
      setInviteStatus(result.message);
      (e.target as HTMLFormElement).reset();
    } catch {
      setInviteStatus('Failed to send invitation.');
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete() {
    setSaving(true);
    await completeCoachSetup();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        {step !== 'welcome' && step !== 'complete' && (
          <div className="mb-8">
            <div className="flex justify-center gap-2">
              {['profile', 'availability', 'invite'].map((s) => (
                <div
                  key={s}
                  className={`h-2 w-16 rounded-full transition-colors ${
                    STEPS.indexOf(step) > STEPS.indexOf(s as Step)
                      ? 'bg-accent'
                      : s === step
                      ? 'bg-accent/50'
                      : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <p className="text-center mt-2 text-sm text-gray-500">
              Step {idx} of 4
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-[#2a2b30] bg-[#121216] p-8">
          {/* Step 1: Welcome */}
          {step === 'welcome' && (
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">🏆</div>
              <h1 className="font-display text-4xl uppercase text-white">Welcome, Coach</h1>
              <p className="text-xl text-gray-400 max-w-md mx-auto">
                Your application has been approved. Let&apos;s set up your coaching profile so athletes can find and book you.
              </p>
              <button
                onClick={goNext}
                className="mt-8 rounded-md bg-accent px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black hover:bg-accent-bright"
              >
                Set Up Profile
              </button>
            </div>
          )}

          {/* Step 2: Profile completion */}
          {step === 'profile' && (
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Step 1</p>
              <h2 className="font-display text-3xl uppercase text-white mt-1">Your Profile</h2>
              <p className="text-sm text-gray-400 mt-2 mb-6">
                This is what athletes see when they browse coaches. Make it count.
              </p>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm text-gray-300">
                    Display Name *
                    <input
                      name="displayName"
                      required
                      placeholder='e.g. Coach "Iron" Mike'
                      className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-white focus:border-accent focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-gray-300">
                    Tagline
                    <input
                      name="tagline"
                      placeholder="e.g. Building champions since 2010"
                      className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-white focus:border-accent focus:outline-none"
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-2 text-sm text-gray-300">
                  Short Bio
                  <textarea
                    name="shortBio"
                    rows={3}
                    placeholder="Tell athletes about your coaching philosophy and experience..."
                    className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-white focus:border-accent focus:outline-none"
                  />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm text-gray-300">
                    Gym Name
                    <input
                      name="gymName"
                      placeholder="e.g. Southside Boxing"
                      className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-white focus:border-accent focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-gray-300">
                    Gym Location
                    <input
                      name="gymLocation"
                      placeholder="e.g. Brooklyn, NY"
                      className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-white focus:border-accent focus:outline-none"
                    />
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm text-gray-300">
                    Location
                    <input
                      name="location"
                      placeholder="e.g. New York, NY"
                      className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-white focus:border-accent focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-gray-300">
                    Years Coaching
                    <input
                      name="yearsCoaching"
                      type="number"
                      min={0}
                      placeholder="e.g. 10"
                      className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-white focus:border-accent focus:outline-none"
                    />
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={goBack}
                    className="rounded-md border border-[#2a2b30] px-6 py-3 text-sm text-gray-400 hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-md bg-accent px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black hover:bg-accent-bright disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Continue'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Office Hours / Availability */}
          {step === 'availability' && (
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Step 2</p>
              <h2 className="font-display text-3xl uppercase text-white mt-1">Availability</h2>
              <p className="text-sm text-gray-400 mt-2 mb-6">
                Set your first office hours block. You can add more slots later from your dashboard.
              </p>
              <form onSubmit={handleAvailabilitySubmit} className="space-y-4">
                <label className="flex flex-col gap-2 text-sm text-gray-300">
                  Day of the week
                  <select
                    name="dayOfWeek"
                    required
                    className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-white focus:border-accent focus:outline-none"
                  >
                    {DAY_NAMES.map((name, i) => (
                      <option key={i} value={i}>{name}</option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm text-gray-300">
                    Start time
                    <input
                      name="startTime"
                      type="time"
                      required
                      defaultValue="10:00"
                      className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-white focus:border-accent focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-gray-300">
                    End time
                    <input
                      name="endTime"
                      type="time"
                      required
                      defaultValue="12:00"
                      className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-white focus:border-accent focus:outline-none"
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-2 text-sm text-gray-300">
                  Max bookings per slot
                  <input
                    name="maxBookings"
                    type="number"
                    min={1}
                    defaultValue={5}
                    className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-white focus:border-accent focus:outline-none"
                  />
                </label>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={goBack}
                    className="rounded-md border border-[#2a2b30] px-6 py-3 text-sm text-gray-400 hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="rounded-md border border-[#2a2b30] px-6 py-3 text-sm text-gray-400 hover:text-white"
                  >
                    Skip for now
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-md bg-accent px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black hover:bg-accent-bright disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save & Continue'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 4: Invite Clients */}
          {step === 'invite' && (
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Step 3</p>
              <h2 className="font-display text-3xl uppercase text-white mt-1">Invite Your Athletes</h2>
              <p className="text-sm text-gray-400 mt-2 mb-6">
                Bring your existing clients to Corner. Send them an invite and they&apos;ll be connected to you when they sign up.
              </p>
              <form onSubmit={handleInvite} className="space-y-4">
                <label className="flex flex-col gap-2 text-sm text-gray-300">
                  Client email
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
                    placeholder="Hey, I'm setting up on Corner for our training sessions..."
                    className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-white focus:border-accent focus:outline-none"
                  />
                </label>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {saving ? 'Sending...' : 'Send Invite'}
                </button>
              </form>

              {inviteStatus && (
                <div className="mt-4 rounded-md border border-[#2a2b30] bg-[#0f0f12] p-3 text-sm text-gray-300">
                  {inviteStatus}
                </div>
              )}

              <p className="text-xs text-gray-500 mt-4 text-center">
                You can send more invites from your dashboard later.
              </p>

              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={goBack}
                  className="rounded-md border border-[#2a2b30] px-6 py-3 text-sm text-gray-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  onClick={goNext}
                  className="flex-1 rounded-md bg-accent px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black hover:bg-accent-bright"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {step === 'complete' && (
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">🥊</div>
              <h1 className="font-display text-4xl uppercase text-white">You&apos;re Ready</h1>
              <p className="text-xl text-gray-400 max-w-md mx-auto">
                Your coaching profile is live. Head to your dashboard to create courses, schedule sessions, and start building your roster.
              </p>
              <button
                onClick={handleComplete}
                disabled={saving}
                className="mt-8 rounded-md bg-accent px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black hover:bg-accent-bright disabled:opacity-50"
              >
                {saving ? 'Loading...' : 'Go to Dashboard'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
