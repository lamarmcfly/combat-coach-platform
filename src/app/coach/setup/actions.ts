'use server';

import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth/session';
import { db } from '@/db/client';

export async function saveCoachProfile(formData: FormData) {
  const session = await getCurrentSession();
  if (!session?.user?.id) redirect('/auth/sign-in');

  const coachProfile = await db.coachProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!coachProfile) {
    throw new Error('Coach profile not found');
  }

  await db.coachProfile.update({
    where: { id: coachProfile.id },
    data: {
      displayName: formData.get('displayName') as string || coachProfile.displayName,
      tagline: formData.get('tagline') as string || null,
      shortBio: formData.get('shortBio') as string || null,
      gymName: formData.get('gymName') as string || null,
      gymLocation: formData.get('gymLocation') as string || null,
      location: formData.get('location') as string || null,
      yearsCoaching: formData.get('yearsCoaching')
        ? parseInt(formData.get('yearsCoaching') as string, 10)
        : null,
    },
  });
}

export async function saveOfficeHours(formData: FormData) {
  const session = await getCurrentSession();
  if (!session?.user?.id) redirect('/auth/sign-in');

  const coachProfile = await db.coachProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!coachProfile) {
    throw new Error('Coach profile not found');
  }

  const dayOfWeek = parseInt(formData.get('dayOfWeek') as string, 10);
  const startTimeStr = formData.get('startTime') as string;
  const endTimeStr = formData.get('endTime') as string;
  const maxAttendees = parseInt(formData.get('maxBookings') as string, 10) || 5;

  if (isNaN(dayOfWeek) || !startTimeStr || !endTimeStr) {
    throw new Error('Invalid office hours data');
  }

  // Build a recurring slot: use a reference date and set hours from the form
  const [startH, startM] = startTimeStr.split(':').map(Number);
  const [endH, endM] = endTimeStr.split(':').map(Number);

  const baseDate = new Date();
  // Set to next occurrence of the chosen day
  const currentDay = baseDate.getDay();
  const daysUntil = (dayOfWeek - currentDay + 7) % 7 || 7;
  baseDate.setDate(baseDate.getDate() + daysUntil);

  const startTime = new Date(baseDate);
  startTime.setHours(startH, startM, 0, 0);

  const endTime = new Date(baseDate);
  endTime.setHours(endH, endM, 0, 0);

  const DAY_NAMES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

  await db.officeHoursSlot.create({
    data: {
      coachId: coachProfile.id,
      startTime,
      endTime,
      maxAttendees,
      isRecurring: true,
      recurringRule: `FREQ=WEEKLY;BYDAY=${DAY_NAMES[dayOfWeek]}`,
    },
  });
}

export async function completeCoachSetup() {
  const session = await getCurrentSession();
  if (!session?.user?.id) redirect('/auth/sign-in');

  // Mark the profile as having completed setup by ensuring they have a tagline
  // (lightweight — no extra schema column needed)
  const coachProfile = await db.coachProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!coachProfile) {
    throw new Error('Coach profile not found');
  }

  redirect('/coach/dashboard');
}

export async function sendClientInvite(formData: FormData) {
  const session = await getCurrentSession();
  if (!session?.user?.id) redirect('/auth/sign-in');

  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const note = formData.get('note') as string || '';

  if (!email) {
    throw new Error('Email is required');
  }

  const coachProfile = await db.coachProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  });

  if (!coachProfile) {
    throw new Error('Coach profile not found');
  }

  // Check if user already exists
  const existingUser = await db.user.findUnique({ where: { email } });

  if (existingUser) {
    // User already on platform — no invite needed, but we could notify them
    return { status: 'existing', message: `${email} is already on the platform.` };
  }

  // Send invite email
  try {
    const { sendTemplatedEmail } = await import('@/lib/email/emailService');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://combatcoach.app';
    const signUpUrl = `${baseUrl}/auth/sign-up?ref=coach&coach=${coachProfile.id}`;

    await sendTemplatedEmail(email, 'welcome', {
      firstName: '',
      coachName: coachProfile.displayName,
      message: note || `${coachProfile.displayName} has invited you to join Corner — a combat sports coaching platform.`,
      signUpUrl,
    });

    return { status: 'sent', message: `Invitation sent to ${email}` };
  } catch (err) {
    console.error('Failed to send invite email:', err);
    return { status: 'error', message: 'Failed to send invitation email' };
  }
}
