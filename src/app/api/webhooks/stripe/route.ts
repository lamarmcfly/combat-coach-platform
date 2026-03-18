import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { constructWebhookEvent } from '@/lib/stripe/client';
import { prisma } from '@/db/client';
import { SubscriptionStatus, SubscriptionTier } from '@prisma/client';
import Stripe from 'stripe';
import { TIER_CONFIG, CREDIT_PACKS, getFeatureLimit } from '@/lib/stripe/config';
import { sendTemplatedEmail } from '@/lib/email/emailService';
import { stripeLogger as log } from '@/lib/logger';

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

/**
 * Resolve the correct tier from a Stripe price ID.
 * Returns the tier if a match is found, or null otherwise.
 */
function resolveTierFromPriceId(priceId: string): SubscriptionTier | null {
  for (const [tierKey, config] of Object.entries(TIER_CONFIG)) {
    if (config.stripePriceId === priceId || config.stripeAnnualPriceId === priceId) {
      return tierKey as SubscriptionTier;
    }
  }
  return null;
}

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
    log.error('Webhook signature verification failed', err);
    return NextResponse.json(
      { error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 400 }
    );
  }

  log.info('Received webhook event', { eventType: event.type, eventId: event.id });

  // --- Idempotency Check ---
  // Prevent duplicate processing if Stripe retries the webhook
  const existingEvent = await prisma.webhookEvent.findUnique({
    where: { eventId: event.id },
  });

  if (existingEvent) {
    log.info('Webhook event already processed, skipping', { eventId: event.id });
    return NextResponse.json({ received: true });
  }

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
        log.debug('Unhandled event type', { eventType: event.type });
    }

    // Record event as processed after successful handling
    await prisma.webhookEvent.create({
      data: {
        eventId: event.id,
        eventType: event.type,
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    log.error(`Error processing webhook event`, error, { eventType: event.type });
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle subscription creation
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const metadata = subscription.metadata || {};
  const userId = metadata.userId;
  const metadataTier = metadata.tier as SubscriptionTier | undefined;

  if (!userId) {
    log.error('Missing userId in subscription metadata', null, { subscriptionId: subscription.id });
    return;
  }

  // Verify user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    log.error('User not found for subscription', null, { userId, subscriptionId: subscription.id });
    return;
  }

  // Verify tier: trust the price ID over metadata
  const priceId = subscription.items.data[0]?.price?.id;
  const verifiedTier = priceId ? resolveTierFromPriceId(priceId) : null;
  const tier = verifiedTier ?? metadataTier;

  if (!tier) {
    log.error('Could not determine tier from price or metadata', null, {
      subscriptionId: subscription.id,
      priceId,
      metadataTier,
    });
    return;
  }

  if (verifiedTier && metadataTier && verifiedTier !== metadataTier) {
    log.warn('Tier mismatch: metadata says one tier but price resolves to another. Using price-based tier.', {
      metadataTier,
      verifiedTier,
      priceId,
    });
  }

  log.info('Creating subscription', { userId, tier });

  const monthlyCredits = getFeatureLimit(tier, 'liveSessionCreditsPerMonth');

  // Atomic transaction: create subscription + update user tier
  await prisma.$transaction([
    prisma.subscription.create({
      data: {
        userId,
        tier,
        status: subscription.status.toUpperCase() as SubscriptionStatus,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId || '',
        currentPeriodStart: new Date(((subscription as any).current_period_start ?? Math.floor(Date.now() / 1000)) * 1000),
        currentPeriodEnd: new Date(((subscription as any).current_period_end ?? Math.floor(Date.now() / 1000)) * 1000),
        monthlyCreditsRemaining: monthlyCredits === -1 ? 999999 : monthlyCredits,
        monthlyCoursesUsed: 0,
        trialStart: (subscription as any).trial_start ? new Date((subscription as any).trial_start * 1000) : null,
        trialEnd: (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000) : null,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: tier },
    }),
  ]);

  log.info('Subscription created successfully', { userId, tier });
}

/**
 * Handle subscription updates (upgrades, downgrades, renewals)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const stripeSubscriptionId = subscription.id;

  log.info('Updating subscription', { stripeSubscriptionId });

  const existingSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
  });

  if (!existingSubscription) {
    log.info('Subscription not found locally, creating it', { stripeSubscriptionId });
    await handleSubscriptionCreated(subscription);
    return;
  }

  // Determine tier from price ID (authoritative source)
  const priceId = subscription.items.data[0]?.price?.id;
  const resolvedTier = priceId ? resolveTierFromPriceId(priceId) : null;
  const tier = resolvedTier ?? existingSubscription.tier;

  const monthlyCredits = getFeatureLimit(tier, 'liveSessionCreditsPerMonth');

  // Atomic transaction: update subscription + update user tier
  await prisma.$transaction([
    prisma.subscription.update({
      where: { stripeSubscriptionId },
      data: {
        tier,
        status: subscription.status.toUpperCase() as SubscriptionStatus,
        stripePriceId: priceId || existingSubscription.stripePriceId,
        currentPeriodStart: new Date(((subscription as any).current_period_start ?? Math.floor(Date.now() / 1000)) * 1000),
        currentPeriodEnd: new Date(((subscription as any).current_period_end ?? Math.floor(Date.now() / 1000)) * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        monthlyCreditsRemaining: monthlyCredits === -1 ? 999999 : monthlyCredits,
      },
    }),
    prisma.user.update({
      where: { id: existingSubscription.userId },
      data: { subscriptionTier: tier },
    }),
  ]);

  log.info('Subscription updated', { stripeSubscriptionId, tier });
}

/**
 * Handle subscription deletion/cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const stripeSubscriptionId = subscription.id;

  log.info('Processing subscription deletion', { stripeSubscriptionId });

  const existingSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
  });

  if (!existingSubscription) {
    log.warn('Subscription not found locally for deletion', { stripeSubscriptionId });
    return;
  }

  // Atomic transaction: cancel subscription + downgrade user
  await prisma.$transaction([
    prisma.subscription.update({
      where: { stripeSubscriptionId },
      data: {
        status: SubscriptionStatus.CANCELED,
        canceledAt: new Date(),
      },
    }),
    prisma.user.update({
      where: { id: existingSubscription.userId },
      data: { subscriptionTier: SubscriptionTier.FREE },
    }),
  ]);

  log.info('Subscription canceled', { stripeSubscriptionId, userId: existingSubscription.userId });
}

/**
 * Handle successful invoice payment (renewal)
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const sub = invoice.parent?.subscription_details?.subscription;
  const subscriptionId = typeof sub === 'string' ? sub : sub?.id;

  if (!subscriptionId) {
    log.debug('Invoice not related to a subscription', { invoiceId: invoice.id });
    return;
  }

  log.info('Invoice paid for subscription', { subscriptionId, invoiceId: invoice.id });

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!subscription) {
    log.warn('Subscription not found for invoice', { subscriptionId });
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

  log.info('Subscription renewed, credits reset', { subscriptionId });

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
      log.info('Renewal email sent', { email: user.email, subscriptionId });
    }
  } catch (emailError) {
    log.error('Failed to send renewal email', emailError, { subscriptionId });
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const sub = invoice.parent?.subscription_details?.subscription;
  const subscriptionId = typeof sub === 'string' ? sub : sub?.id;

  if (!subscriptionId) {
    return;
  }

  log.warn('Invoice payment failed', { subscriptionId, invoiceId: invoice.id });

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

  log.info('Subscription marked as PAST_DUE', { subscriptionId });

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
      log.info('Payment failure email sent', { email: user.email, subscriptionId });
    }
  } catch (emailError) {
    log.error('Failed to send payment failure email', emailError, { subscriptionId });
  }
}

/**
 * Handle checkout session completion
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  log.info('Checkout completed', { sessionId: session.id });

  const metadata = session.metadata;

  if (!metadata) {
    log.debug('No metadata in checkout session', { sessionId: session.id });
    return;
  }

  // Handle credit pack purchase
  if (metadata.type === 'credit_pack') {
    const userId = metadata.userId;
    const packId = metadata.packId;
    const credits = parseInt(metadata.credits, 10);

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true },
    });

    if (!user) {
      log.error('User not found for credit pack purchase', null, { userId, packId });
      return;
    }

    // Verify credit amount matches known pack configuration
    const knownPack = CREDIT_PACKS.find((p) => p.id === packId);
    if (knownPack && knownPack.credits !== credits) {
      log.error('Credit pack mismatch: metadata credits do not match pack config', null, {
        packId,
        metadataCredits: credits,
        expectedCredits: knownPack.credits,
      });
      // Use the known pack credits (authoritative source)
      // Fall through with corrected value
    }
    const verifiedCredits = knownPack ? knownPack.credits : credits;

    log.info('Credit pack purchased', { packId, userId, credits: verifiedCredits });

    // Import CreditService dynamically to avoid circular dependencies
    const { CreditService } = await import('@/services/creditService');

    await CreditService.purchaseCreditPack({
      userId,
      packId,
      credits: verifiedCredits,
      priceCents: session.amount_total || 0,
    });

    log.info('Credits added to user', { credits: verifiedCredits, userId });

    // Send credit pack purchase confirmation email
    try {
      if (user.email) {
        const newBalance = await CreditService.getPackCreditBalance(userId);

        await sendTemplatedEmail(user.email, 'credit_pack_purchased', {
          firstName: user.firstName || '',
          credits: verifiedCredits.toString(),
          newBalance: newBalance.toString(),
        });
        log.info('Credit purchase email sent', { email: user.email, credits: verifiedCredits, newBalance });
      }
    } catch (emailError) {
      log.error('Failed to send credit purchase email', emailError, { userId, credits: verifiedCredits });
    }
  }
}
