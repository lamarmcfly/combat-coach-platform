import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { ScheduleService } from '@/services/scheduleService';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weeks = parseInt(searchParams.get('weeks') || '12');

    const adherenceData = await ScheduleService.getAdherenceStats(session.user.id, weeks);

    return NextResponse.json(adherenceData);
  } catch (error) {
    console.error('Error fetching adherence stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch adherence stats' },
      { status: 500 }
    );
  }
}
