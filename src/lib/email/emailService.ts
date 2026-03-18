/**
 * Email Service
 * Centralized email sending with template support
 * Ready for SendGrid integration - currently logs emails in development
 */

import { db } from '@/db/client';
import { emailLogger as log } from '@/lib/logger';
import { escapeHtml, validateEmailUrl } from './sanitize';

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
        log.info('Email sent successfully', { to: options.to, messageId });
        return { success: true, messageId };
      } else {
        const errorText = await response.text();
        log.error('SendGrid API error', null, { to: options.to, error: errorText });
        return { success: false, error: errorText };
      }
    } catch (error) {
      log.error('Failed to send email', error, { to: options.to });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Development mode: log to console
  if (process.env.NODE_ENV === 'development') {
    log.info('Email simulated (SendGrid not configured)', {
      to: options.to,
      from: fromAddress,
      subject: options.subject,
      bodyPreview: options.html.slice(0, 100) + '...',
    });
    return { success: true, messageId: 'dev-' + Date.now() };
  }

  // Production without SendGrid: fail gracefully
  log.warn('SendGrid not configured, email not sent', { to: options.to });
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
  passwordReset: null, // Always send password reset emails
  passwordChanged: null, // Always send password changed confirmation
  email_verification: null, // Always send verification emails
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
    log.error('Error checking email preferences', error, { userId });
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
    log.debug('Email skipped (disabled in user preferences)', { template, userId });
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
  | 'welcome'
  | 'passwordReset'
  | 'passwordChanged'
  | 'email_verification';

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
  // Sanitize all variables to prevent XSS in email HTML
  const v: Record<string, string> = {};
  for (const [key, value] of Object.entries(variables)) {
    v[key] = escapeHtml(value || '');
  }

  // Validate URLs to prevent open redirect attacks
  const safeUrl = (key: string) => validateEmailUrl(v[key] || '');

  const templates: Record<EmailTemplate, RenderedEmail> = {
    subscription_renewed: {
      subject: 'Your Combat Coach subscription has been renewed',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e6a627;">Subscription Renewed</h2>
          <p>Hi ${v.firstName || 'there'},</p>
          <p>Your <strong>${v.tier}</strong> subscription has been successfully renewed.</p>
          <p>Your next billing date is <strong>${v.nextBillingDate}</strong>.</p>
          <p>Your monthly credits have been refreshed. Keep training!</p>
          <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">Combat Coach Platform</p>
        </div>
      `,
      text: `Your ${v.tier} subscription has been renewed. Next billing: ${v.nextBillingDate}`,
    },

    payment_failed: {
      subject: 'Action Required: Payment Failed',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">Payment Failed</h2>
          <p>Hi ${v.firstName || 'there'},</p>
          <p>We were unable to process your payment for your Combat Coach subscription.</p>
          <p>Please update your payment method to continue enjoying your ${v.tier} benefits.</p>
          <a href="${safeUrl('updatePaymentUrl')}" style="display: inline-block; background: #e6a627; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Update Payment Method</a>
          <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">Combat Coach Platform</p>
        </div>
      `,
      text: `Payment failed for your subscription. Please update your payment method: ${safeUrl('updatePaymentUrl')}`,
    },

    credit_pack_purchased: {
      subject: 'Credit Pack Purchase Confirmed',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">Credits Added!</h2>
          <p>Hi ${v.firstName || 'there'},</p>
          <p>Your purchase of <strong>${v.credits} credits</strong> has been confirmed.</p>
          <p>Your new credit balance is <strong>${v.newBalance} credits</strong>.</p>
          <p>Use your credits to book live sessions with coaches!</p>
          <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">Combat Coach Platform</p>
        </div>
      `,
      text: `${v.credits} credits added to your account. New balance: ${v.newBalance}`,
    },

    coaching_request_received: {
      subject: 'New Coaching Request',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e6a627;">New Coaching Request</h2>
          <p>Hi Coach,</p>
          <p>You have a new coaching request from <strong>${v.studentName}</strong>.</p>
          <p><strong>Type:</strong> ${v.requestType}</p>
          <p><strong>Title:</strong> ${v.title}</p>
          <a href="${safeUrl('viewUrl')}" style="display: inline-block; background: #e6a627; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Request</a>
          <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">Combat Coach Platform</p>
        </div>
      `,
      text: `New coaching request from ${v.studentName}: ${v.title}`,
    },

    coaching_response_received: {
      subject: 'Your Coach Responded!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">Coach Response</h2>
          <p>Hi ${v.firstName || 'there'},</p>
          <p>Coach <strong>${v.coachName}</strong> has responded to your coaching request.</p>
          <p><strong>Request:</strong> ${v.title}</p>
          <a href="${safeUrl('viewUrl')}" style="display: inline-block; background: #e6a627; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Response</a>
          <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">Combat Coach Platform</p>
        </div>
      `,
      text: `Coach ${v.coachName} responded to: ${v.title}`,
    },

    sparring_request_received: {
      subject: 'New Sparring Partner Request',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e6a627;">Sparring Request</h2>
          <p>Hi ${v.firstName || 'there'},</p>
          <p><strong>${v.requesterName}</strong> wants to spar with you!</p>
          ${v.discipline ? `<p><strong>Discipline:</strong> ${v.discipline}</p>` : ''}
          ${v.proposedDate ? `<p><strong>Proposed Date:</strong> ${v.proposedDate}</p>` : ''}
          ${v.message ? `<p><strong>Message:</strong> ${v.message}</p>` : ''}
          <a href="${safeUrl('viewUrl')}" style="display: inline-block; background: #e6a627; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Request</a>
          <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">Combat Coach Platform</p>
        </div>
      `,
      text: `${v.requesterName} wants to spar with you!`,
    },

    sparring_request_accepted: {
      subject: 'Sparring Request Accepted!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">Request Accepted!</h2>
          <p>Hi ${v.firstName || 'there'},</p>
          <p>Great news! <strong>${v.partnerName}</strong> accepted your sparring request.</p>
          ${v.discipline ? `<p><strong>Discipline:</strong> ${v.discipline}</p>` : ''}
          ${v.proposedDate ? `<p><strong>Date:</strong> ${v.proposedDate}</p>` : ''}
          ${v.location ? `<p><strong>Location:</strong> ${v.location}</p>` : ''}
          <a href="${safeUrl('viewUrl')}" style="display: inline-block; background: #e6a627; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Details</a>
          <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">Combat Coach Platform</p>
        </div>
      `,
      text: `${v.partnerName} accepted your sparring request!`,
    },

    welcome: {
      subject: 'Welcome to Combat Coach!',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e6a627;">Welcome to Combat Coach!</h2>
          <p>Hi ${v.firstName || 'there'},</p>
          <p>Thanks for joining Combat Coach! We're excited to help you on your martial arts journey.</p>
          <h3>Get Started:</h3>
          <ul>
            <li>Set up your training schedule</li>
            <li>Define your goals</li>
            <li>Find sparring partners</li>
            <li>Connect with coaches</li>
          </ul>
          <a href="${safeUrl('dashboardUrl')}" style="display: inline-block; background: #e6a627; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Go to Dashboard</a>
          <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">Combat Coach Platform</p>
        </div>
      `,
      text: `Welcome to Combat Coach, ${v.firstName}! Start your journey at ${safeUrl('dashboardUrl')}`,
    },

    passwordReset: {
      subject: 'Reset Your Password - Combat Coach',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e6a627;">Password Reset Request</h2>
          <p>Hi ${v.firstName || 'there'},</p>
          <p>We received a request to reset your Combat Coach password.</p>
          <p>Click the button below to reset your password. This link will expire in ${v.expiryHours} hours.</p>
          <a href="${safeUrl('resetUrl')}" style="display: inline-block; background: #e6a627; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Reset Password</a>
          <p style="margin-top: 20px; color: #666;">If you didn't request this password reset, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">Combat Coach Platform</p>
        </div>
      `,
      text: `Reset your password: ${safeUrl('resetUrl')}. This link expires in ${v.expiryHours} hours.`,
    },

    passwordChanged: {
      subject: 'Your Password Has Been Changed - Combat Coach',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">Password Changed Successfully</h2>
          <p>Hi ${v.firstName || 'there'},</p>
          <p>Your Combat Coach password has been successfully changed.</p>
          <p>If you did not make this change, please contact support immediately.</p>
          <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">Combat Coach Platform</p>
        </div>
      `,
      text: `Your password has been changed. If you did not make this change, please contact support.`,
    },

    email_verification: {
      subject: 'Verify Your Email - Combat Coach',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e6a627;">Verify Your Email</h2>
          <p>Hi ${v.firstName || 'there'},</p>
          <p>Thanks for signing up for Combat Coach! Please verify your email address by clicking the button below.</p>
          <a href="${safeUrl('verifyUrl')}" style="display: inline-block; background: #e6a627; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Verify Email</a>
          <p style="margin-top: 20px; color: #666;">This link will expire in 24 hours. If you didn't create this account, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">Combat Coach Platform</p>
        </div>
      `,
      text: `Verify your email: ${safeUrl('verifyUrl')}. This link expires in 24 hours.`,
    },
  };

  return templates[template] || templates.welcome;
}
