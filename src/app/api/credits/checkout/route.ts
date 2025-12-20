import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/db/client';
import { getOrCreateCustomer, createCreditPackCheckout } from '@/lib/stripe/client';
import { CREDIT_PACKS } from '@/lib/stripe/config';

export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { packId } = await req.json();

    const pack = CREDIT_PACKS.find(p => p.id === packId);

    if (!pack) {
      return NextResponse.json({ error: 'Invalid pack ID' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(
      user.id,
      user.email,
      user.stripeCustomerId
    );

    // Update user with Stripe customer ID if newly created
    if (!user.stripeCustomerId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session for credit pack
    const checkoutSession = await createCreditPackCheckout({
      customerId,
      priceId: pack.stripePriceId,
      successUrl: `${process.env.NEXTAUTH_URL}/my/credits?success=true&credits=${pack.credits}`,
      cancelUrl: `${process.env.NEXTAUTH_URL}/live?canceled=true`,
      userId: user.id,
      credits: pack.credits,
      packId: pack.id,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Credit pack checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
