# Corner Platform - Customization Guide

This guide explains how to customize the content, branding, and configuration of the Corner combat coaching platform.

---

## Table of Contents

1. [Admin CMS (Easiest)](#admin-cms)
2. [Branding & Theme](#branding--theme)
3. [Sample Content (Coaches, Courses)](#sample-content)
4. [Subscription Pricing](#subscription-pricing)
5. [Text Content & Copy](#text-content--copy)
6. [Images & Videos](#images--videos)
7. [Legal Pages](#legal-pages)
8. [Navigation & Footer](#navigation--footer)
9. [Badges & Achievements](#badges--achievements)
10. [Database Content](#database-content)

---

## Admin CMS

The easiest way to manage content is through the built-in Admin CMS.

### Accessing the CMS

1. Sign in as an admin user
2. Navigate to `/admin/content`

### Content Sections

The CMS organizes content into sections:

- **home** - Homepage content
- **about** - About page content
- **pricing** - Pricing page content
- **courses** - Course catalog content
- **coaches** - Coach directory content

### Content Types

Each content item can be one of these types:

| Type | Use For |
|------|---------|
| TEXT | Simple text (headings, labels) |
| RICH_TEXT | Formatted HTML content |
| IMAGE | Single image with URL and alt text |
| VIDEO | Video embed or URL |
| GALLERY | Multiple images |
| LINK | Navigation or external links |
| HTML | Raw HTML blocks |
| JSON | Structured data |

### Adding Content

1. Go to `/admin/content`
2. Select a section or create a new one
3. Click "Add Item"
4. Choose content type
5. Enter content and metadata
6. Toggle "Published" to make it live

---

## Branding & Theme

### Colors

**File:** `tailwind.config.js`

The color scheme is defined in the `theme.extend.colors` section:

```javascript
colors: {
  base: {
    DEFAULT: '#0e0e11',      // Main background
    50: '#0a0a0d',           // Darker shade
    100: '#121216',          // Card backgrounds
    200: '#151518',          // Slightly lighter
  },
  copy: {
    DEFAULT: '#e4e4e7',      // Primary text
    muted: '#9ca3af',        // Secondary text
  },
  accent: {
    DEFAULT: '#dc2626',      // Primary accent (red)
    bright: '#ef4444',       // Hover state
    muted: '#450a0a',        // Dark accent
  },
}
```

To change the accent color (currently red), update all `accent` values.

### Fonts

**File:** `src/app/layout.tsx`

Fonts are imported via `next/font`:

```typescript
import { Bebas_Neue, Inter } from 'next/font/google';

const displayFont = Bebas_Neue({ /* config */ });
const bodyFont = Inter({ /* config */ });
```

To change fonts:
1. Import your fonts from `next/font/google`
2. Update the font variables
3. Update `tailwind.config.js` font families if needed

### Dark/Light Mode

**File:** `src/app/globals.css`

Theme variables are defined in CSS custom properties:

```css
:root {
  /* Light mode */
  --background: #ffffff;
  --foreground: #171717;
}

.dark {
  /* Dark mode */
  --background: #0a0a0a;
  --foreground: #ededed;
}
```

---

## Sample Content

### Coaches & Courses

**File:** `src/data/sampleContent.ts`

This file contains fallback content used when the database is empty:

```typescript
export const coaches: CoachSummary[] = [
  {
    id: "coach-1",
    name: "Lena \"Stone\" Alvarez",
    gym: "Stone Muay Thai",
    location: "Los Angeles, CA",
    bio: "Former WBC champion with 15+ years...",
    avatarUrl: "/images/coaches/lena-stone.png",
    yearsCoaching: 12,
    fightersCoached: 200,
    titles: 8,
    disciplines: ["muay-thai", "kickboxing"],
  },
  // Add more coaches...
];

export const featuredCourses: Course[] = [
  {
    id: "course-1",
    slug: "muay-thai-masterclass",
    title: "Muay Thai Masterclass",
    shortDescription: "Complete striking fundamentals...",
    // ...
  },
];
```

### Disciplines

**File:** `src/data/sampleContent.ts`

Available combat disciplines:

```typescript
export const disciplines = [
  { id: "boxing", slug: "boxing", name: "Boxing" },
  { id: "muay-thai", slug: "muay-thai", name: "Muay Thai" },
  { id: "kickboxing", slug: "kickboxing", name: "Kickboxing" },
  { id: "mma", slug: "mma", name: "MMA" },
  { id: "wrestling", slug: "wrestling", name: "Wrestling" },
  { id: "bare-knuckle", slug: "bare-knuckle", name: "Bare-knuckle" },
  { id: "slap", slug: "slap", name: "Slap" },
];
```

### Database Seed Data

**File:** `db/seed.ts`

This file populates the database with initial data:

```typescript
// Seed disciplines
const disciplines = [
  { slug: 'boxing', name: 'Boxing' },
  { slug: 'muay-thai', name: 'Muay Thai' },
  // ...
];

// Seed sample users
await db.user.create({
  data: {
    email: 'athlete@example.com',
    role: 'ATHLETE',
    // ...
  }
});
```

Run seeding:
```bash
npm run db:seed
```

---

## Subscription Pricing

**File:** `src/lib/stripe/config.ts`

### Tier Configuration

```typescript
export const SUBSCRIPTION_TIERS: SubscriptionTierConfig = {
  FREE: {
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [...],
    limits: {
      coursesPerMonth: 0,
      liveSessionsPerMonth: 1,
      coachingRequestsPerMonth: 0,
      // ...
    }
  },
  BASIC: {
    name: 'Basic',
    monthlyPrice: 1999, // $19.99
    annualPrice: 16788, // $167.88 (30% off)
    features: [...],
    limits: {...}
  },
  PRO: {
    name: 'Pro',
    monthlyPrice: 4999, // $49.99
    // ...
  },
  ELITE: {
    name: 'Elite',
    monthlyPrice: 9999, // $99.99
    // ...
  }
};
```

Prices are in **cents** (e.g., 1999 = $19.99).

### Stripe Price IDs

For production, map tier names to Stripe price IDs:

```typescript
export const STRIPE_PRICE_IDS = {
  BASIC_MONTHLY: 'price_xxx',
  BASIC_ANNUAL: 'price_xxx',
  PRO_MONTHLY: 'price_xxx',
  // ...
};
```

---

## Text Content & Copy

### Homepage

**File:** `src/components/home/HomeFeed.tsx`

Main homepage text:

```tsx
<HeroVideoBanner
  title="CORNER"
  subtitle="Train with proven combat coaches"
/>
```

### Hero Banner

**File:** `src/components/HeroVideoBanner.tsx`

```tsx
<span className="text-copy-muted">Corner Marketplace</span>
```

### Section Headers

Throughout the app, look for `SectionHeader` components:

```tsx
<SectionHeader
  eyebrow="Featured"
  title="Top Courses"
/>
```

---

## Images & Videos

### Static Assets

Place images in: `public/images/`

Reference them as: `/images/your-image.png`

### Coach Avatars

Update in `sampleContent.ts`:

```typescript
avatarUrl: "/images/coaches/coach-name.png"
```

Or use external URLs:

```typescript
avatarUrl: "https://example.com/images/coach.jpg"
```

### Course Covers

```typescript
coverImageUrl: "/images/courses/course-cover.jpg"
trailerVideoUrl: "https://videos.example.com/trailer.mp4"
```

### Video Hosting Options

**File:** `.env`

```env
# Option 1: Static files
NEXT_PUBLIC_VIDEO_PROVIDER="static"
VIDEO_PROVIDER_BASE_URL="https://your-cdn.com/videos"

# Option 2: Mux
NEXT_PUBLIC_VIDEO_PROVIDER="mux"
MUX_TOKEN_ID="your-token"
MUX_TOKEN_SECRET="your-secret"
```

---

## Legal Pages

### Privacy Policy

**File:** `src/app/legal/privacy/page.tsx`

Update the content directly in the page component:

```tsx
<h1>Privacy Policy</h1>
<p>Last updated: January 2026</p>

<h2>Information We Collect</h2>
<p>Your updated privacy text here...</p>
```

### Terms of Service

**File:** `src/app/legal/terms/page.tsx`

Similar structure to privacy policy.

---

## Navigation & Footer

### Footer Links

**File:** `src/components/navigation/Footer.tsx`

```tsx
// Platform section
<Link href="/courses">Browse Courses</Link>
<Link href="/coaches">Find Coaches</Link>
<Link href="/pricing">Pricing</Link>

// For Athletes section
<Link href="/my/training">Dashboard</Link>

// For Coaches section
<Link href="/coach/apply">Become a Coach</Link>
```

### Footer Branding

```tsx
<span className="text-2xl font-display text-white">CORNER</span>
<span className="text-gray-500 text-sm">
  Train with the best. Become the best.
</span>
```

### Top Navigation

**File:** `src/components/navigation/TopNav.tsx`

Update navigation links in this component.

---

## Badges & Achievements

**File:** `src/lib/badges/seed.ts`

### Badge Categories

- **streak** - Consecutive training days
- **session** - Live session attendance
- **course** - Course completion
- **goal** - Goal achievements
- **community** - Social engagement
- **special** - Platform achievements

### Adding/Modifying Badges

```typescript
export const BADGE_DEFINITIONS = [
  {
    slug: 'week-warrior',
    name: 'Week Warrior',
    description: 'Train for 7 consecutive days',
    icon: 'flame',
    category: 'streak',
    tier: 'bronze',
    requiredValue: 7,
  },
  // Add more badges...
];
```

### Badge Tiers

- bronze
- silver
- gold
- platinum
- diamond

---

## Database Content

### Using Prisma Studio

Visual database editor:

```bash
npx prisma studio
```

Opens at http://localhost:5555

### Direct Database Queries

Create/update content programmatically:

```typescript
import { db } from '@/db/client';

// Create a course
await db.course.create({
  data: {
    title: 'New Course',
    slug: 'new-course',
    shortDescription: '...',
    // ...
  }
});
```

### Migrations

After schema changes:

```bash
npm run prisma:migrate
```

---

## Quick Reference

| What to Change | File Location |
|----------------|---------------|
| Brand colors | `tailwind.config.js` |
| Fonts | `src/app/layout.tsx` |
| Sample coaches | `src/data/sampleContent.ts` |
| Sample courses | `src/data/sampleContent.ts` |
| Pricing | `src/lib/stripe/config.ts` |
| Footer links | `src/components/navigation/Footer.tsx` |
| Privacy policy | `src/app/legal/privacy/page.tsx` |
| Terms of service | `src/app/legal/terms/page.tsx` |
| Badges | `src/lib/badges/seed.ts` |
| Homepage content | Admin CMS at `/admin/content` |
| Database schema | `db/schema.prisma` |

---

## Tips

1. **Start with Admin CMS** - Use `/admin/content` for quick text/image changes
2. **Test locally first** - Run `npm run dev` before deploying changes
3. **Use Prisma Studio** - Great for exploring and editing database content
4. **Keep backups** - Export data before major changes
5. **Check mobile** - Test all changes on mobile devices

---

## Need Help?

- Check the [README.md](./README.md) for setup instructions
- Open a GitHub issue for bugs or questions
- Review the codebase - it's well-organized and typed
