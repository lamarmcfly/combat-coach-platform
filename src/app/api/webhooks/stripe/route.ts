import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { constructWebhookEvent } from '@/lib/stripe/client';
import { prisma } from '@/db/client';
import { SubscriptionStatus, SubscriptionTier } from '@prisma/client';
import Stripe from 'stripe';
import { TIER_CONFIG, getFeatureLimit } from '@/lib/stripe/config';
import { sendTemplatedEmail } from '@/lib/email/emailService';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 400 }
    );
  }

  console.log(`[Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`[Webhook] Error processing ${event.type}:`, error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle subscription creation
 */
async function handleSubscriptionCreated(subscription: any) {
  const userId = subscription.metadata.userId;
  const tier = subscription.metadata.tier as SubscriptionTier;

  if (!userId || !tier) {
    console.error('[Webhook] Missing userId or tier in subscription metadata');
    return;
  }

  console.log(`[Webhook] Creating subscription for user ${userId}, tier: ${tier}`);

  const monthlyCredits = getFeatureLimit(tier, 'liveSessionCreditsPerMonth');

  await prisma.subscription.create({
    data: {
      userId,
      tier,
      status: subscription.status.toUpperCase() as SubscriptionStatus,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      monthlyCreditsRemaining: monthlyCredits === -1 ? 999999 : monthlyCredits,
      monthlyCoursesUsed: 0,
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    },
  });

  // Update user's tier
  await prisma.user.update({
    where: { id: userId },
    data: { subscriptionTier: tier },
  });

  console.log(`[Webhook] Subscription created successfully for user ${userId}`);
}

/**
 * Handle subscription updates (upgrades, downgrades, renewals)
 */
async function handleSubscriptionUpdated(subscription: any) {
  const stripeSubscriptionId = subscription.id;

  console.log(`[Webhook] Updating subscription: ${stripeSubscriptionId}`);

  const existingSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
  });

  if (!existingSubscription) {
    console.log('[Webhook] Subscription not found locally, creating it');
    await handleSubscriptionCreated(subscription);
    return;
  }

  // Determine tier from price ID
  let tier = existingSubscription.tier;
  const priceId = subscription.items.data[0].price.id;

  // Match price ID to tier
  for (const [tierKey, config] of Object.entries(TIER_CONFIG)) {
    if (config.stripePriceId === priceId) {
      tier = tierKey as SubscriptionTier;
      break;
    }
  }

  const monthlyCredits = getFeatureLimit(tier, 'liveSessionCreditsPerMonth');

  await prisma.subscription.update({
    where: { stripeSubscriptionId },
    data: {
      tier,
      status: subscription.status.toUpperCase() as SubscriptionStatus,
      stripePriceId: priceId,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      monthlyCreditsRemaining: monthlyCredits === -1 ? 999999 : monthlyCredits,
    },
  });

  // Update user's tier
  await prisma.user.update({
    where: { id: existingSubscription.userId },
    data: { subscriptionTier: tier },
  });

  console.log(`[Webhook] Subscription updated: ${stripeSubscriptionId}, new tier: ${tier}`);
}

/**
 * Handle subscription deletion/cancellation
 */
async function handleSubscriptionDeleted(subscription: any) {
  const stripeSubscriptionId = subscription.id;

  console.log(`[Webhook] Deleting subscription: ${stripeSubscriptionId}`);

  const existingSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
  });

  if (!existingSubscription) {
    console.warn('[Webhook] Subscription not found locally');
    return;
  }

  // Mark subscription as canceled
  await prisma.subscription.update({
    where: { stripeSubscriptionId },
    data: {
      status: SubscriptionStatus.CANCELED,
      canceledAt: new Date(),
    },
  });

  // Downgrade user to FREE tier
  await prisma.user.update({
    where: { id: existingSubscription.userId },
    data: { subscriptionTier: SubscriptionTier.FREE },
  });

  console.log(`[Webhook] Subscription canceled: ${stripeSubscriptionId}`);
}

/**
 * Handle successful invoice payment (renewal)
 */
async function handleInvoicePaid(invoice: any) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    console.log('[Webhook] Invoice not related to a subscription');
    return;
  }

  console.log(`[Webhook] Invoice paid for subscription: ${subscriptionId}`);

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!subscription) {
    console.warn('[Webhook] Subscription not found for invoice');
    return;
  }

  // Reset monthly credits and course usage on renewal
  const monthlyCredits = getFeatureLimit(subscription.tier, 'liveSessionCreditsPerMonth');

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: SubscriptionStatus.ACTIVE,
      monthlyCreditsRemaining: monthlyCredits === -1 ? 999999 : monthlyCredits,
      monthlyCoursesUsed: 0,
    },
  });

  console.log(`[Webhook] Subscription renewed, credits reset: ${subscriptionId}`);

  // Send renewal confirmation email
  try {
    const user = await prisma.user.findUnique({
      where: { id: subscription.userId },
      select: { email: true, firstName: true },
    });

    if (user?.email) {
      const nextBillingDate = new Date(
        (invoice.lines?.data?.[0]?.period?.end || Date.now() / 1000) * 1000
      );

      await sendTemplatedEmail(user.email, 'subscription_renewed', {
        firstName: user.firstName || '',
        tier: subscription.tier,
        nextBillingDate: nextBillingDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      });
      console.log(`[Webhook] Renewal email sent to ${user.email}`);
    }
  } catch (emailError) {
    console.error('[Webhook] Failed to send renewal email:', emailError);
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: any) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    return;
  }

  console.log(`[Webhook] Invoice payment failed for subscription: ${subscriptionId}`);

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!subscription) {
    return;
  }

  // Mark subscription as past due
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: SubscriptionStatus.PAST_DUE,
    },
  });

  console.log(`[Webhook] Subscription marked as PAST_DUE: ${subscriptionId}`);

  // Send payment failure email with retry link
  try {
    const user = await prisma.user.findUnique({
      where: { id: subscription.userId },
      select: { email: true, firstName: true },
    });

    if (user?.email) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://combatcoach.app';

      await sendTemplatedEmail(user.email, 'payment_failed', {
        firstName: user.firstName || '',
        tier: subscription.tier,
        updatePaymentUrl: `${baseUrl}/settings/billing`,
      });
      console.log(`[Webhook] Payment failure email sent to ${user.email}`);
    }
  } catch (emailError) {
    console.error('[Webhook] Failed to send payment failure email:', emailError);
  }
}

/**
 * Handle checkout session completion
 */
async function handleCheckoutCompleted(session: any) {
  console.log(`[Webhook] Checkout completed: ${session.id}`);

  const metadata = session.metadata;

  if (!metadata) {
    console.log('[Webhook] No metadata in checkout session');
    return;
  }

  // Handle credit pack purchase
  if (metadata.type === 'credit_pack') {
    const userId = metadata.userId;
    const packId = metadata.packId;
    const credits = parseInt(metadata.credits, 10);

    console.log(`[Webhook] Credit pack purchased: ${packId} for user ${userId}`);

    // Import CreditService dynamically to avoid circular dependencies
    const { CreditService } = await import('@/services/creditService');

    await CreditService.purchaseCreditPack({
      userId,
      packId,
      credits,
      priceCents: session.amount_total || 0,
    });

    console.log(`[Webhook] ${credits} credits added to user ${userId}`);

    // Send credit pack purchase confirmation email
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true },
      });

      if (user?.email) {
        // Get updated credit balance
        const newBalance = await CreditService.getPackCreditBalance(userId);

        await sendTemplatedEmail(user.email, 'credit_pack_purchased', {
          firstName: user.firstName || '',
          credits: credits.toString(),
          newBalance: newBalance.toString(),
        });
        console.log(`[Webhook] Credit purchase email sent to ${user.email}`);
      }
    } catch (emailError) {
      console.error('[Webhook] Failed to send credit purchase email:', emailError);
    }
  }
}
