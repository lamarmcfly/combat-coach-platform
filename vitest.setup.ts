import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    span: 'span',
    button: 'button',
    ul: 'ul',
    li: 'li',
    p: 'p',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    section: 'section',
    article: 'article',
    form: 'form',
    input: 'input',
    a: 'a',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useMotionValue: () => ({ set: vi.fn(), get: () => 0 }),
  useSpring: () => ({ set: vi.fn(), get: () => 0 }),
  useTransform: () => ({ set: vi.fn(), get: () => 0 }),
}));

// Global fetch mock
global.fetch = vi.fn();

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
