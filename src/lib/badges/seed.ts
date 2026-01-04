import { prisma } from '@/db/client';
import { BadgeCategory, BadgeRarity } from '@prisma/client';

interface BadgeDefinition {
  slug: string;
  name: string;
  description: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  points: number;
  requirement: string;
}

const INITIAL_BADGES: BadgeDefinition[] = [
  // Streak Badges
  {
    slug: 'streak-3-days',
    name: 'Getting Started',
    description: 'Maintain a 3-day training streak',
    category: 'STREAK',
    rarity: 'COMMON',
    points: 10,
    requirement: 'Train for 3 consecutive days',
  },
  {
    slug: 'streak-7-days',
    name: 'Week Warrior',
    description: 'Maintain a 7-day training streak',
    category: 'STREAK',
    rarity: 'UNCOMMON',
    points: 25,
    requirement: 'Train for 7 consecutive days',
  },
  {
    slug: 'streak-14-days',
    name: 'Dedicated Fighter',
    description: 'Maintain a 14-day training streak',
    category: 'STREAK',
    rarity: 'RARE',
    points: 50,
    requirement: 'Train for 14 consecutive days',
  },
  {
    slug: 'streak-30-days',
    name: 'Iron Will',
    description: 'Maintain a 30-day training streak',
    category: 'STREAK',
    rarity: 'EPIC',
    points: 100,
    requirement: 'Train for 30 consecutive days',
  },
  {
    slug: 'streak-60-days',
    name: 'Unstoppable',
    description: 'Maintain a 60-day training streak',
    category: 'STREAK',
    rarity: 'EPIC',
    points: 200,
    requirement: 'Train for 60 consecutive days',
  },
  {
    slug: 'streak-100-days',
    name: 'Legend',
    description: 'Maintain a 100-day training streak',
    category: 'STREAK',
    rarity: 'LEGENDARY',
    points: 500,
    requirement: 'Train for 100 consecutive days',
  },

  // Course Badges
  {
    slug: 'first-course',
    name: 'First Steps',
    description: 'Complete your first course',
    category: 'COURSES',
    rarity: 'COMMON',
    points: 15,
    requirement: 'Complete 1 course',
  },
  {
    slug: 'courses-5',
    name: 'Knowledge Seeker',
    description: 'Complete 5 courses',
    category: 'COURSES',
    rarity: 'UNCOMMON',
    points: 50,
    requirement: 'Complete 5 courses',
  },
  {
    slug: 'courses-10',
    name: 'Dedicated Student',
    description: 'Complete 10 courses',
    category: 'COURSES',
    rarity: 'RARE',
    points: 100,
    requirement: 'Complete 10 courses',
  },
  {
    slug: 'courses-25',
    name: 'Master Student',
    description: 'Complete 25 courses',
    category: 'COURSES',
    rarity: 'EPIC',
    points: 250,
    requirement: 'Complete 25 courses',
  },

  // Session Badges
  {
    slug: 'first-session',
    name: 'Live Learner',
    description: 'Attend your first live session',
    category: 'SESSIONS',
    rarity: 'COMMON',
    points: 15,
    requirement: 'Attend 1 live session',
  },
  {
    slug: 'sessions-5',
    name: 'Active Participant',
    description: 'Attend 5 live sessions',
    category: 'SESSIONS',
    rarity: 'UNCOMMON',
    points: 50,
    requirement: 'Attend 5 live sessions',
  },
  {
    slug: 'sessions-10',
    name: 'Session Regular',
    description: 'Attend 10 live sessions',
    category: 'SESSIONS',
    rarity: 'RARE',
    points: 100,
    requirement: 'Attend 10 live sessions',
  },
  {
    slug: 'sessions-25',
    name: 'Live Training Pro',
    description: 'Attend 25 live sessions',
    category: 'SESSIONS',
    rarity: 'EPIC',
    points: 250,
    requirement: 'Attend 25 live sessions',
  },

  // Goal Badges
  {
    slug: 'first-goal',
    name: 'Goal Getter',
    description: 'Complete your first goal',
    category: 'GOALS',
    rarity: 'COMMON',
    points: 20,
    requirement: 'Complete 1 goal',
  },
  {
    slug: 'goals-5',
    name: 'Achiever',
    description: 'Complete 5 goals',
    category: 'GOALS',
    rarity: 'UNCOMMON',
    points: 75,
    requirement: 'Complete 5 goals',
  },
  {
    slug: 'goals-10',
    name: 'Goal Crusher',
    description: 'Complete 10 goals',
    category: 'GOALS',
    rarity: 'RARE',
    points: 150,
    requirement: 'Complete 10 goals',
  },

  // Community Badges
  {
    slug: 'first-review',
    name: 'Voice Heard',
    description: 'Write your first course review',
    category: 'COMMUNITY',
    rarity: 'COMMON',
    points: 10,
    requirement: 'Write 1 review',
  },
  {
    slug: 'reviews-5',
    name: 'Helpful Reviewer',
    description: 'Write 5 course reviews',
    category: 'COMMUNITY',
    rarity: 'UNCOMMON',
    points: 40,
    requirement: 'Write 5 reviews',
  },
  {
    slug: 'reviews-10',
    name: 'Community Pillar',
    description: 'Write 10 course reviews',
    category: 'COMMUNITY',
    rarity: 'RARE',
    points: 100,
    requirement: 'Write 10 reviews',
  },

  // Special Badges
  {
    slug: 'early-adopter',
    name: 'Early Adopter',
    description: 'One of the first members of Combat Coach',
    category: 'SPECIAL',
    rarity: 'LEGENDARY',
    points: 100,
    requirement: 'Join during beta period',
  },
  {
    slug: 'elite-member',
    name: 'Elite Member',
    description: 'Subscribe to Elite tier',
    category: 'SPECIAL',
    rarity: 'EPIC',
    points: 50,
    requirement: 'Subscribe to Elite tier',
  },
];

export async function seedBadges(): Promise<void> {
  console.log('Seeding badges...');

  for (const badge of INITIAL_BADGES) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      update: {
        name: badge.name,
        description: badge.description,
        category: badge.category,
        rarity: badge.rarity,
        points: badge.points,
        requirement: badge.requirement,
      },
      create: badge,
    });
  }

  console.log(`Seeded ${INITIAL_BADGES.length} badges`);
}

// Run if executed directly
if (require.main === module) {
  seedBadges()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error seeding badges:', error);
      process.exit(1);
    });
}
