import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db/client';

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const preferences = await db.sparringPreference.findUnique({
      where: { userId },
    });

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error fetching sparring preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    const {
      isAvailable,
      weightClass,
      disciplines,
      location,
      latitude,
      longitude,
      radius,
      experienceMin,
      experienceMax,
      skillLevel,
      preferredDays,
      preferredTime,
      gymName,
      notes,
    } = body;

    const preferences = await db.sparringPreference.upsert({
      where: { userId },
      update: {
        isAvailable: isAvailable ?? true,
        weightClass,
        disciplines: disciplines ?? [],
        location,
        latitude,
        longitude,
        radius: radius ?? 25,
        experienceMin,
        experienceMax,
        skillLevel,
        preferredDays: preferredDays ?? [],
        preferredTime,
        gymName,
        notes,
      },
      create: {
        userId,
        isAvailable: isAvailable ?? true,
        weightClass,
        disciplines: disciplines ?? [],
        location,
        latitude,
        longitude,
        radius: radius ?? 25,
        experienceMin,
        experienceMax,
        skillLevel,
        preferredDays: preferredDays ?? [],
        preferredTime,
        gymName,
        notes,
      },
    });

    return NextResponse.json({ preferences }, { status: 201 });
  } catch (error) {
    console.error('Error saving sparring preferences:', error);
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    );
  }
}
