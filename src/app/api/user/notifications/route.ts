import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db/client';

/**
 * GET - Get user's notification preferences
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create notification preferences
    let preferences = await db.notificationPreferences.findUnique({
      where: { userId: session.user.id },
    });

    // If no preferences exist, create defaults
    if (!preferences) {
      preferences = await db.notificationPreferences.create({
        data: {
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json({
      preferences: {
        emailCoaching: preferences.emailCoaching,
        emailSessions: preferences.emailSessions,
        emailGoals: preferences.emailGoals,
        emailSparring: preferences.emailSparring,
        emailBilling: preferences.emailBilling,
        emailMarketing: preferences.emailMarketing,
        pushEnabled: preferences.pushEnabled,
        pushSessionReminders: preferences.pushSessionReminders,
        pushMessages: preferences.pushMessages,
      },
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update user's notification preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate and extract only allowed fields
    const allowedFields = [
      'emailCoaching',
      'emailSessions',
      'emailGoals',
      'emailSparring',
      'emailBilling',
      'emailMarketing',
      'pushEnabled',
      'pushSessionReminders',
      'pushMessages',
    ];

    const updateData: Record<string, boolean> = {};
    for (const field of allowedFields) {
      if (typeof body[field] === 'boolean') {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Upsert notification preferences
    const preferences = await db.notificationPreferences.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...updateData,
      },
      update: updateData,
    });

    return NextResponse.json({
      success: true,
      preferences: {
        emailCoaching: preferences.emailCoaching,
        emailSessions: preferences.emailSessions,
        emailGoals: preferences.emailGoals,
        emailSparring: preferences.emailSparring,
        emailBilling: preferences.emailBilling,
        emailMarketing: preferences.emailMarketing,
        pushEnabled: preferences.pushEnabled,
        pushSessionReminders: preferences.pushSessionReminders,
        pushMessages: preferences.pushMessages,
      },
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}
