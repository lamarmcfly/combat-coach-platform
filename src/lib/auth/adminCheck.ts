import { getServerSession } from 'next-auth/next';
import { authOptions } from './options';
import { NextResponse } from 'next/server';

export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (session.user.role !== 'ADMIN') {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }),
    };
  }

  return {
    authorized: true,
    user: session.user,
  };
}
