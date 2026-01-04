import Stripe from 'stripe';

/**
 * Check if Stripe is configured (has API key)
 */
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/**
 * Lazy-initialized Stripe client to avoid build-time errors
 * when environment variables aren't set (e.g., during Vercel build)
 */
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
      typescript: true,
      appInfo: {
        name: 'CombatCoachPlatform',
        version: '1.0.0',
      },
    });
  }
  return stripeInstance;
}

/**
 * Stripe client instance - use getStripe() for lazy initialization
 * Only throws when actually used at runtime, not at build time
 */
export const stripe = {
  get customers() { return getStripe().customers; },
  get subscriptions() { return getStripe().subscriptions; },
  get checkout() { return getStripe().checkout; },
  get webhooks() { return getStripe().webhooks; },
  get paymentMethods() { return getStripe().paymentMethods; },
  get invoices() { return getStripe().invoices; },
  get billingPortal() { return getStripe().billingPortal; },
};

/**
 * Webhook signature verification
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Helper to get or create a Stripe customer for a user
 */
export async function getOrCreateCustomer(userId: string, email: string, stripeCustomerId?: string | null): Promise<string> {
  // If we already have a customer ID, return it
  if (stripeCustomerId) {
    return stripeCustomerId;
  }

  // Create a new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  });

  return customer.id;
}

/**
 * Create a subscription checkout session
 */
export async function createSubscriptionCheckout(params: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  userId: string;
  tier: string;
  billingInterval?: string;
  trialDays?: number;
}): Promise<Stripe.Checkout.Session> {
  const subscriptionData: Stripe.Checkout.SessionCreateParams['subscription_data'] = {
    metadata: {
      userId: params.userId,
      tier: params.tier,
      billingInterval: params.billingInterval || 'monthly',
    },
  };

  // Add trial period if specified
  if (params.trialDays && params.trialDays > 0) {
    subscriptionData.trial_period_days = params.trialDays;
  }

  return stripe.checkout.sessions.create({
    customer: params.customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      userId: params.userId,
      tier: params.tier,
      billingInterval: params.billingInterval || 'monthly',
      hasTrial: params.trialDays ? 'true' : 'false',
    },
    subscription_data: subscriptionData,
  });
}

/**
 * Create a trial subscription checkout session
 */
export async function createTrialCheckout(params: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  userId: string;
  tier: string;
  trialDays: number;
  billingInterval?: string;
}): Promise<Stripe.Checkout.Session> {
  return createSubscriptionCheckout({
    ...params,
    trialDays: params.trialDays,
  });
}

/**
 * Create a one-time payment checkout session for credit packs
 */
export async function createCreditPackCheckout(params: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  userId: string;
  credits: number;
  packId: string;
}): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create({
    customer: params.customerId,
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      userId: params.userId,
      packId: params.packId,
      credits: params.credits.toString(),
      type: 'credit_pack',
    },
  });
}

/**
 * Update a subscription (upgrade/downgrade)
 */
export async function updateSubscription(
  subscriptionId: string,
  newPriceId: string,
  prorate: boolean = true
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  return stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: prorate ? 'create_prorations' : 'none',
  });
}

/**
 * Cancel a subscription at period end
 */
export async function cancelSubscriptionAtPeriodEnd(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Cancel a subscription immediately
 */
export async function cancelSubscriptionImmediately(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Reactivate a canceled subscription
 */
export async function reactivateSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Update customer's payment method
 */
export async function updatePaymentMethod(
  customerId: string,
  paymentMethodId: string
): Promise<Stripe.Customer> {
  // Attach payment method to customer
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });

  // Set as default payment method
  return stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });
}

/**
 * Preview an upcoming invoice for a customer (useful for showing proration amounts)
 */
export async function getUpcomingInvoice(
  customerId: string,
  subscriptionId?: string
): Promise<Stripe.Invoice> {
  return stripe.invoices.createPreview({
    customer: customerId,
    subscription: subscriptionId,
  });
}

/**
 * Create a billing portal session for customer self-service
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}
