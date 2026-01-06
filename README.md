# Corner - Combat Sports Coaching Platform

A full-stack marketplace connecting combat sports athletes with world-class coaches. Built with Next.js 16, React 19, and PostgreSQL.

**Live Demo:** https://corner-zeta.vercel.app

## Features

### For Athletes
- Browse and purchase video courses from professional coaches
- Book live training sessions (1-on-1 and group)
- Track training goals with progress monitoring
- Weight tracking for fight preparation
- Sparring partner matching system
- Training schedule with adherence tracking
- Achievement badges and leaderboard
- Async coaching requests (video submission for technique review)
- Certificate generation for completed courses

### For Coaches
- Create and sell video courses with lessons
- Schedule and manage live sessions
- Client management dashboard
- Earnings tracking and payouts
- Respond to coaching requests
- Office hours booking system

### Platform Features
- Role-based access (Athlete, Coach, Admin)
- Subscription tiers (Free, Basic, Pro, Elite)
- Stripe payment integration
- Admin CMS for content management
- Google Calendar integration
- Email notifications (SendGrid)
- Push notifications
- Dark/light theme
- Mobile responsive

---

## Tech Stack

- **Framework:** Next.js 16.1.1 with App Router
- **Runtime:** React 19 with React Compiler
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** NextAuth.js with email/password
- **Payments:** Stripe (subscriptions, one-time purchases)
- **Styling:** Tailwind CSS
- **Testing:** Vitest + Testing Library
- **Error Tracking:** Sentry
- **Deployment:** Vercel

---

## Prerequisites

- Node.js 18+
- PostgreSQL 15+ (or use Docker)
- npm or yarn

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/lamarmcfly/combat-coach-platform.git
cd combat-coach-platform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your values. At minimum, you need:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/corner_dev"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### 4. Start Database (Docker)

```bash
docker-compose up -d
```

Or connect to your existing PostgreSQL instance.

### 5. Set Up Database Schema

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed sample data
npm run db:seed
```

### 6. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

---

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Secret for session encryption |
| `NEXTAUTH_URL` | Your app URL (http://localhost:3000 for dev) |

### Payments (Stripe)

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_test_...) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (pk_test_...) |
| `ALLOW_DUMMY_PAYMENTS` | Set to "true" to skip Stripe in development |

### Email (SendGrid)

| Variable | Description |
|----------|-------------|
| `SENDGRID_API_KEY` | SendGrid API key |
| `EMAIL_FROM` | Sender email address |

### Google Calendar

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret |

### Video Provider

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_VIDEO_PROVIDER` | "static" or "mux" |
| `VIDEO_PROVIDER_BASE_URL` | Base URL for video files |
| `MUX_TOKEN_ID` | Mux API token ID (if using Mux) |
| `MUX_TOKEN_SECRET` | Mux API token secret |

### Optional

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error tracking DSN |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web push notification key |
| `VAPID_PRIVATE_KEY` | Web push private key |
| `UPSTASH_REDIS_REST_URL` | Redis for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Redis auth token |

---

## Available Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run db:seed          # Seed sample data

# Testing
npm run test            # Run tests in watch mode
npm run test:run        # Run tests once
npm run test:coverage   # Generate coverage report
```

---

## Project Structure

```
corner/
├── db/
│   ├── schema.prisma      # Database schema (57 models)
│   ├── migrations/        # Database migrations
│   └── seed.ts           # Sample data seeder
├── public/               # Static assets
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/          # API routes (79 endpoints)
│   │   ├── admin/        # Admin CMS pages
│   │   ├── auth/         # Authentication pages
│   │   ├── coach/        # Coach dashboard
│   │   ├── courses/      # Course catalog
│   │   ├── my/           # Athlete dashboard
│   │   └── ...
│   ├── components/       # React components (99 total)
│   ├── contexts/         # React contexts
│   ├── data/             # Sample content & data fetching
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities & services
│   │   ├── auth/         # Authentication helpers
│   │   ├── email/        # Email service
│   │   ├── payments/     # Payment processing
│   │   ├── stripe/       # Stripe configuration
│   │   └── ...
│   ├── services/         # Business logic
│   └── types/            # TypeScript definitions
├── .env.example          # Environment template
├── docker-compose.yml    # PostgreSQL container
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## Key Pages

### Public
- `/` - Homepage with featured content
- `/courses` - Course catalog
- `/coaches` - Coach directory
- `/pricing` - Subscription plans
- `/auth/sign-in` - Login
- `/auth/sign-up` - Registration

### Athlete Dashboard (`/my/...`)
- `/my/training` - Main dashboard
- `/my/goals` - Goal tracking
- `/my/schedule` - Training schedule
- `/my/weight` - Weight tracking
- `/my/sparring` - Sparring matches
- `/my/sessions` - Booked sessions
- `/my/achievements` - Badges & progress

### Coach Dashboard (`/coach/...`)
- `/coach/dashboard` - Overview & content creation
- `/coach/clients` - Client management
- `/coach/earnings` - Revenue tracking
- `/coach/coaching` - Coaching requests

### Admin (`/admin/...`)
- `/admin/content` - CMS for site content
- `/admin/review` - Content moderation

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

The app is configured for Vercel with automatic builds.

### Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# The app expects these services:
# - PostgreSQL on port 5432
```

---

## Content Customization

See [CUSTOMIZATION_GUIDE.md](./CUSTOMIZATION_GUIDE.md) for detailed instructions on:

- Changing branding colors and fonts
- Updating sample coaches and courses
- Modifying subscription pricing
- Managing content via Admin CMS
- Customizing legal pages

---

## Database Schema

The app uses 57 Prisma models including:

- **Users & Auth:** User, Account, Session
- **Coaches:** CoachProfile, CoachDiscipline
- **Content:** Course, Lesson, CourseReview
- **Sessions:** LiveSession, LiveSessionBooking
- **Training:** Goal, TrainingSchedule, WeightEntry
- **Billing:** Subscription, CoursePurchase, CreditTransaction
- **Community:** SparringRequest, Fight, TrainingLineage
- **Badges:** Badge, UserBadge

Run `npx prisma studio` to explore the database visually.

---

## API Overview

79 API endpoints organized by feature:

- `/api/auth/*` - Authentication
- `/api/courses/*` - Course management
- `/api/goals/*` - Goal tracking
- `/api/schedule/*` - Training schedules
- `/api/sparring/*` - Sparring system
- `/api/coach/*` - Coach operations
- `/api/subscriptions/*` - Billing
- `/api/admin/*` - Admin operations

All endpoints use standard REST conventions with JSON payloads.

---

## Testing

```bash
# Run all tests
npm run test:run

# Watch mode
npm run test

# Coverage report
npm run test:coverage
```

Tests are located in `src/__tests__/` using Vitest and Testing Library.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

Private - All rights reserved.

---

## Support

For questions or issues, please open a GitHub issue.
