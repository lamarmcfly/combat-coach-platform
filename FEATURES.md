# Combat Coach Platform - Feature Status

This document outlines the feature status and configuration requirements for the Combat Coach platform.

## Production Ready Features

These features are fully implemented and work out of the box:

| Feature | Description |
|---------|-------------|
| User Authentication | Email/password auth with NextAuth.js |
| Role-Based Access | Athlete, Coach, and Admin roles |
| Subscription Management | Tier-based subscriptions (Free, Contender, Pro, Champion) |
| Video Courses | Course creation, purchasing, and streaming |
| Live Sessions | 1-on-1 and group training sessions |
| Coaching Requests | Async coaching and video review |
| Training Schedule | Weekly schedule management |
| Goal Tracking | Goals with milestones and progress |
| Weight Tracking | Fight preparation weight management |
| Sparring Matching | Find training partners |
| Badge System | Achievements and rewards |
| Leaderboard | Community rankings |
| Dark/Light Theme | Full theme support |
| Admin CMS | Content and media management |

## Features Requiring Configuration

These features are implemented but require API keys/credentials to function:

### Stripe Payments

| Variable | Description | Get it from |
|----------|-------------|-------------|
| `STRIPE_SECRET_KEY` | API secret key | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | Stripe Dashboard → Webhooks |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public API key | Stripe Dashboard → API Keys |

**Current Status:** Placeholder keys configured. Replace with real keys for production.

### SendGrid Email

| Variable | Description | Get it from |
|----------|-------------|-------------|
| `SENDGRID_API_KEY` | API key for sending emails | [SendGrid](https://app.sendgrid.com/settings/api_keys) |
| `EMAIL_FROM` | Default sender address | Your verified SendGrid domain |

**Current Status:** Falls back to console logging in development when not configured.

### Google Calendar Integration

| Variable | Description | Get it from |
|----------|-------------|-------------|
| `GOOGLE_CLIENT_ID` | OAuth client ID | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | Same as above |

**Current Status:** ICS download fallback works without configuration.

### Mux Video Processing

| Variable | Description | Get it from |
|----------|-------------|-------------|
| `MUX_TOKEN_ID` | API token ID | [Mux Dashboard](https://dashboard.mux.com/settings/access-tokens) |
| `MUX_TOKEN_SECRET` | API token secret | Same as above |
| `MUX_SIGNING_KEY` | Signed URL key (optional) | Mux Dashboard |

**Current Status:** Static video provider configured as fallback.

### Web Push Notifications

| Variable | Description | How to generate |
|----------|-------------|-----------------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public VAPID key | `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Private VAPID key | Same command |

**Current Status:** In-app notifications work without push configuration.

### Sentry Error Tracking

| Variable | Description | Get it from |
|----------|-------------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Data Source Name | [Sentry](https://sentry.io) → Project Settings |
| `SENTRY_ORG` | Organization slug | Sentry settings |
| `SENTRY_PROJECT` | Project name | Sentry settings |

**Current Status:** Errors log to console only when not configured.

### Upstash Rate Limiting

| Variable | Description | Get it from |
|----------|-------------|-------------|
| `UPSTASH_REDIS_REST_URL` | Redis REST URL | [Upstash Console](https://console.upstash.com) |
| `UPSTASH_REDIS_REST_TOKEN` | Redis REST token | Same as above |

**Current Status:** Falls back to in-memory rate limiting when not configured.

## Graceful Degradation

All optional features are designed to fail gracefully:

- **Missing Google Calendar:** ICS download still works
- **Missing Push Notifications:** In-app notifications only
- **Missing SendGrid:** Emails logged to console in development
- **Missing Sentry:** Errors logged to console only
- **Missing Upstash:** In-memory rate limiting used

## Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in required variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` - Your app URL

3. Add optional service credentials as needed

## Development vs Production

| Environment | Required Variables |
|-------------|-------------------|
| Development | `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` |
| Production | All of above + `STRIPE_*` keys |

## Quick Start

```bash
# Install dependencies
npm install

# Set up database
npm run prisma:generate
npm run prisma:migrate

# Seed with demo data (optional)
npm run db:seed

# Start development server
npm run dev
```

## Testing Payments

Use Stripe test mode with these test cards:

| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 0002 | Declined card |
| 4000 0000 0000 3220 | 3D Secure required |

Use any future expiry date and any 3-digit CVC.
