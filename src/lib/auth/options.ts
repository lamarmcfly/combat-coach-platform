import { PrismaAdapter } from "@auth/prisma-adapter";
import type { AdapterUser } from "next-auth/adapters";
import type { Adapter } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { db } from "@/db/client";

// Use PrismaAdapter only for OAuth providers (Google etc.).
// For Credentials provider, the adapter's createUser/linkAccount
// methods conflict with JWT strategy — so we strip them for credentials flow.
const hasOAuthProviders = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const adapter: Adapter | undefined = hasOAuthProviders ? PrismaAdapter(db) as Adapter : undefined;

export const authOptions = {
  ...(adapter ? { adapter } : {}),
  session: {
    strategy: "jwt" as const,
  },
  providers: [
    // Google OAuth (optional — only active when env vars are set)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Credentials({
      name: "Email/Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const user = await db.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            passwordHash: true,
            emailVerified: true,
          },
        });
        if (!user) return null;
        const matches = await compare(credentials.password, user.passwordHash);
        if (!matches) return null;

        // Require email verification only when email service is configured
        const emailServiceConfigured = !!process.env.SENDGRID_API_KEY;
        if (emailServiceConfigured && !user.emailVerified) {
          throw new Error("Please verify your email before signing in.");
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        const adapterUser = user as AdapterUser & { role?: string };
        token.role = adapterUser.role ?? token.role;
      }
      // For OAuth users, fetch role from DB if not already set
      if (token.sub && !token.role) {
        const dbUser = await db.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        });
        token.role = dbUser?.role ?? "ATHLETE";
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token.role as string) ?? "ATHLETE";
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/sign-in",
  },
};
