/**
 * Email Service
 * Centralized email sending with template support
 * Ready for SendGrid integration - currently logs emails in development
 */

import { db } from '@/db/client';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.SENDGRID_API_KEY;
}

/**
 * Send an email
 * Uses SendGrid if configured, otherwise logs to console in development
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const fromAddress = options.from || process.env.EMAIL_FROM || 'noreply@combatcoach.app';

  // If SendGrid is configured, use it
  if (process.env.SENDGRID_API_KEY) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: options.to }] }],
          from: { email: fromAddress },
          reply_to: options.replyTo ? { email: options.replyTo } : undefined,
          subject: options.subject,
          content: [
            { type: 'text/html', value: options.html },
            ...(options.text ? [{ type: 'text/plain', value: options.text }] : []),
          ],
        }),
      });

      if (response.ok || response.status === 202) {
        const messageId = response.headers.get('x-message-id') || undefined;
        return { success: true, messageId };
      } else {
        const errorText = await response.text();
        console.error('[Email] SendGrid error:', errorText);
        return { success: false, error: errorText };
      }
    } catch (error) {
      console.error('[Email] Failed to send:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Development mode: log to console
  if (process.env.NODE_ENV === 'development') {
    console.log('─'.repeat(60));
    console.log('[Email] Would send email (SendGrid not configured):');
    console.log(`  To: ${options.to}`);
    console.log(`  From: ${fromAddress}`);
    console.log(`  Subject: ${options.subject}`);
    console.log(`  Body Preview: ${options.html.slice(0, 200)}...`);
    console.log('─'.repeat(60));
    return { success: true, messageId: 'dev-' + Date.now() };
  }

  // Production without SendGrid: fail gracefully
  console.warn('[Email] SendGrid not configured, email not sent');
  return { success: false, error: 'Email service not configured' };
}

/**
 * Send a templated email
 */
export async function sendTemplatedEmail(
  to: string,
  template: EmailTemplate,
  variables: Record<string, string>
): Promise<EmailResult> {
  const { subject, html, text } = renderTemplate(template, variables);
  return sendEmail({ to, subject, html, text });
}

/**
 * Map templates to notification preference keys
 */
const templateToPreference: Record<EmailTemplate, keyof typeof preferenceDefaults | null> = {
  subscription_renewed: 'emailBilling',
  payment_failed: 'emailBilling',
  credit_pack_purchased: 'emailBilling',
  coaching_request_received: 'emailCoaching',
  coaching_response_received: 'emailCoaching',
  sparring_request_received: 'emailSparring',
  sparring_request_accepted: 'emailSparring',
  welcome: null, // Always send welcome emails
};

const preferenceDefaults = {
  emailCoaching: true,
  emailSessions: true,
  emailGoals: true,
  emailSparring: true,
  emailBilling: true,
  emailMarketing: false,
};

/**
 * Check if user wants to receive this type of email
 */
async function shouldSendEmail(userId: string, template: EmailTemplate): Promise<boolean> {
  const preferenceKey = templateToPreference[template];

  // Always send if no preference applies (like welcome emails)
  if (!preferenceKey) return true;

  try {
    const prefs = await db.notificationPreferences.findUnique({
      where: { userId },
      select: { [preferenceKey]: true },
    });

    // If no preferences set, use defaults
    if (!prefs) {
      return preferenceDefaults[preferenceKey];
    }

    return (prefs as any)[preferenceKey] ?? preferenceDefaults[preferenceKey];
  } catch (error) {
    console.error('[Email] Error checking preferences:', error);
    // Default to sending if we can't check preferences
    return true;
  }
}

/**
 * Send a templated email with preference checking
 * Will skip sending if user has disabled this notification type
 */
export async function sendTemplatedEmailWithPreferences(
  userId: string,
  to: string,
  template: EmailTemplate,
  variables: Record<string, string>
): Promise<EmailResult> {
  const shouldSend = await shouldSendEmail(userId, template);

  if (!shouldSend) {
    console.log(`[Email] Skipped ${template} for user ${userId} (disabled in preferences)`);
    return { success: true, messageId: 'skipped-by-preference' };
  }

  return sendTemplatedEmail(to, template, variables);
}

/**
 * Available email templates
 */
export type EmailTemplate =
  | 'subscription_renewed'
  | 'payment_failed'
  | 'credit_pack_purchased'
  | 'coaching_request_received'
  | 'coaching_response_received'
  | 'sparring_request_received'
  | 'sparring_request_accepted'
  | 'welcome';

interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/**
 * Render an email template with variables
 */
function renderTemplate(
  template: EmailTemplate,
  variables: Record<string, string>
): RenderedEmail {
  const templates: Record<EmailTemplate, RenderedEmail> = {
    subscription_renewed: {
      subject: 'Your Combat Coach subscription has been renewed',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e6a627;">Subscription Renewed</h2>
          <p>Hi ${variables.firstName || 'there'},</p>
          <p>Your <strong>${variables.tier}</strong> subscription has been successfully renewed.</p>
          <p>Your next billing date is <strong>${variables.nextBillingDate}</strong>.</p>
          <p>Your monthly credits have been refreshed. Keep training!</p>
          <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">Combat Coach Platform</p>
        </div>
      `,
      text: `Your ${variables.tier} subscription has been renewed. Next billing: ${variables.nextBillingDate}`,
    },

    payment_failed: {
      subject: 'Action Required: Payment Failed',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">Payment Failed</h2>
          <p>Hi ${variables.firstName || 'there'},</p>
          <p>We were unable to process your payment for your Combat Coach subscription.</p>
          <p>Please update your payment method to continue enjoying your ${variables.tier} benefits.</p>
          <a href="${variables.updatePaymentUrl}" style="display: inline-block; background: #e6a627; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Update Payment Method</a>
          <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">Combat Coach Platform</p>
        </div>
      `,
      text: `Payment failed for your subscription. Please update your payment method: ${variables.updatePaymentUrl}`,
    },

    credit_pack_purchased: {
      subject: 'Credit Pack Purchase Confirmed',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">Credits Added!</h2>
          <p>Hi ${variables.firstName || 'there'},</p>
          <p>Your purchase of <strong>${variables.credits} credits</strong> has been confirmed.</p>
          <p>Your new credit balance is <strong>${variables.newBalance} credits</strong>.</p>
          <p>Use your credits to book live sessions with coaches!</p>
          <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">Combat Coach Platform</p>
        </div>
      `,
      text: `${variables.credits} credits added to your account. New balance: ${variables.newBalance}`,
    },

    coaching_request_received: {
      subject: 'New Coaching Request',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e6a627;">New Coaching Request</h2>
          <p>Hi Coach,</p>
          <p>You have a new coaching request from <strong>${variables.studentName}</strong>.</p>
          <p><strong>Type:</strong> ${variables.requestType}</p>
          <p><strong>Title:</strong> ${variables.title}</p>
          <a href="${variables.viewUrl}" style="display: inline-block; background: #e6a627; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Request</a>
          <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">Combat Coach Platform</p>
        </div>
      `,
      text: `New coaching request from ${variables.studentName}: ${variables.title}`,
    },

    coaching_response_received: {
      subject: 'Your Coach Responded!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">Coach Response</h2>
          <p>Hi ${variables.firstName || 'there'},</p>
          <p>Coach <strong>${variables.coachName}</strong> has responded to your coaching request.</p>
          <p><strong>Request:</strong> ${variables.title}</p>
          <a href="${variables.viewUrl}" style="display: inline-block; background: #e6a627; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Response</a>
          <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">Combat Coach Platform</p>
        </div>
      `,
      text: `Coach ${variables.coachName} responded to: ${variables.title}`,
    },

    sparring_request_received: {
      subject: 'New Sparring Partner Request',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e6a627;">Sparring Request</h2>
          <p>Hi ${variables.firstName || 'there'},</p>
          <p><strong>${variables.requesterName}</strong> wants to spar with you!</p>
          ${variables.discipline ? `<p><strong>Discipline:</strong> ${variables.discipline}</p>` : ''}
          ${variables.proposedDate ? `<p><strong>Proposed Date:</strong> ${variables.proposedDate}</p>` : ''}
          ${variables.message ? `<p><strong>Message:</strong> ${variables.message}</p>` : ''}
          <a href="${variables.viewUrl}" style="display: inline-block; background: #e6a627; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Request</a>
          <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">Combat Coach Platform</p>
        </div>
      `,
      text: `${variables.requesterName} wants to spar with you!`,
    },

    sparring_request_accepted: {
      subject: 'Sparring Request Accepted!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">Request Accepted!</h2>
          <p>Hi ${variables.firstName || 'there'},</p>
          <p>Great news! <strong>${variables.partnerName}</strong> accepted your sparring request.</p>
          ${variables.discipline ? `<p><strong>Discipline:</strong> ${variables.discipline}</p>` : ''}
          ${variables.proposedDate ? `<p><strong>Date:</strong> ${variables.proposedDate}</p>` : ''}
          ${variables.location ? `<p><strong>Location:</strong> ${variables.location}</p>` : ''}
          <a href="${variables.viewUrl}" style="display: inline-block; background: #e6a627; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Details</a>
          <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">Combat Coach Platform</p>
        </div>
      `,
      text: `${variables.partnerName} accepted your sparring request!`,
    },

    welcome: {
      subject: 'Welcome to Combat Coach!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e6a627;">Welcome to Combat Coach!</h2>
          <p>Hi ${variables.firstName || 'there'},</p>
          <p>Thanks for joining Combat Coach! We're excited to help you on your martial arts journey.</p>
          <h3>Get Started:</h3>
          <ul>
            <li>Set up your training schedule</li>
            <li>Define your goals</li>
            <li>Find sparring partners</li>
            <li>Connect with coaches</li>
          </ul>
          <a href="${variables.dashboardUrl}" style="display: inline-block; background: #e6a627; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Go to Dashboard</a>
          <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">Combat Coach Platform</p>
        </div>
      `,
      text: `Welcome to Combat Coach, ${variables.firstName}! Start your journey at ${variables.dashboardUrl}`,
    },
  };

  return templates[template] || templates.welcome;
}
