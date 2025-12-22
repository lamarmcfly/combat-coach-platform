import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { CreditService } from '@/services/creditService';

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const summary = await CreditService.getCreditSummary(session.user.id);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Get credit balance error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve credit balance' },
      { status: 500 }
    );
  }
}
