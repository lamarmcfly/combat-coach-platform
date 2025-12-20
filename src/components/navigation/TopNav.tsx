"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import clsx from "clsx";
import { ThemeToggleIcon } from "@/components/ui/ThemeToggle";

const mainLinks = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/coaches", label: "Coaches" },
  { href: "/live", label: "Live Sessions" },
];

const athleteLinks = [
  { href: "/my/training", label: "My Training" },
  { href: "/my/goals", label: "My Goals" },
  { href: "/my/schedule", label: "Schedule" },
  { href: "/my/coaching", label: "Coaching" },
  { href: "/my/fights", label: "Fights" },
  { href: "/my/sparring", label: "Sparring" },
  { href: "/my/weight", label: "Weight" },
  { href: "/my/lineage", label: "Lineage" },
];

const coachLinks = [
  { href: "/coach/dashboard", label: "Dashboard" },
  { href: "/coach/clients", label: "Clients" },
  { href: "/coach/earnings", label: "Earnings" },
  { href: "/coach/coaching", label: "Requests" },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const user = session?.user;
  const userRole = (user as any)?.role || "ATHLETE";
  const isCoach = userRole === "COACH" || userRole === "ADMIN";

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const getInitials = () => {
    if (!user) return "?";
    const firstName = (user as any).firstName || "";
    const lastName = (user as any).lastName || "";
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (user.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const handleSignOut = async () => {
    setIsUserMenuOpen(false);
    await signOut({ redirect: false });
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#1f1f24] bg-[#0b0b0c]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="font-display text-2xl uppercase tracking-[0.2em] text-copy">
          Corner
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 text-sm uppercase tracking-[0.2em] text-copy-muted md:flex">
          {mainLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx("transition hover:text-copy", {
                "text-accent": pathname === link.href,
              })}
            >
              {link.label}
            </Link>
          ))}
          {isCoach && (
            <Link
              href="/coach/dashboard"
              className={clsx("transition hover:text-copy", {
                "text-accent": pathname.startsWith("/coach"),
              })}
            >
              Coach
            </Link>
          )}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <ThemeToggleIcon />

          {/* Desktop Auth Section */}
          <div className="hidden items-center gap-3 md:flex">
            {isLoading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-700" />
            ) : isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 rounded-full p-1 transition hover:bg-gray-800"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-black">
                    {getInitials()}
                  </div>
                  <svg
                    className={`h-4 w-4 text-gray-400 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-gray-800 bg-gray-900 py-2 shadow-xl">
                    <div className="border-b border-gray-800 px-4 py-3">
                      <div className="text-sm font-medium text-white">
                        {(user as any)?.firstName || "User"} {(user as any)?.lastName || ""}
                      </div>
                      <div className="text-xs text-gray-400">{user?.email}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                            isCoach ? "bg-purple-900 text-purple-300" : "bg-blue-900 text-blue-300"
                          }`}
                        >
                          {userRole}
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <div className="px-4 py-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                        Training
                      </div>
                      {athleteLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>

                    {isCoach && (
                      <div className="border-t border-gray-800 py-1">
                        <div className="px-4 py-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                          Coach Tools
                        </div>
                        {coachLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    )}

                    <div className="border-t border-gray-800 py-1">
                      <Link
                        href="/my/settings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
                      >
                        Settings
                      </Link>
                      <Link
                        href="/my/subscription"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
                      >
                        Subscription
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-800"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/auth/sign-in"
                  className="text-xs uppercase tracking-[0.2em] text-copy-muted hover:text-copy"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="rounded-md border border-accent px-3 py-1 text-xs uppercase tracking-[0.2em] text-accent hover:bg-accent hover:text-black"
                >
                  Join Corner
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white md:hidden"
          >
            {isMobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="border-t border-gray-800 bg-[#0b0b0c] md:hidden">
          <div className="space-y-1 px-4 py-4">
            {/* Main Navigation */}
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "block rounded-lg px-4 py-3 text-sm font-medium transition",
                  pathname === link.href ? "bg-accent/10 text-accent" : "text-gray-300 hover:bg-gray-800"
                )}
              >
                {link.label}
              </Link>
            ))}

            {isAuthenticated && (
              <>
                <div className="my-2 border-t border-gray-800" />
                <div className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                  My Training
                </div>
                {athleteLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={clsx(
                      "block rounded-lg px-4 py-3 text-sm font-medium transition",
                      pathname === link.href ? "bg-accent/10 text-accent" : "text-gray-300 hover:bg-gray-800"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}

                {isCoach && (
                  <>
                    <div className="my-2 border-t border-gray-800" />
                    <div className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                      Coach Tools
                    </div>
                    {coachLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={clsx(
                          "block rounded-lg px-4 py-3 text-sm font-medium transition",
                          pathname === link.href ? "bg-accent/10 text-accent" : "text-gray-300 hover:bg-gray-800"
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </>
                )}

                <div className="my-2 border-t border-gray-800" />
                <Link
                  href="/my/settings"
                  className="block rounded-lg px-4 py-3 text-sm font-medium text-gray-300 hover:bg-gray-800"
                >
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-red-400 hover:bg-gray-800"
                >
                  Sign Out
                </button>
              </>
            )}

            {!isAuthenticated && !isLoading && (
              <>
                <div className="my-2 border-t border-gray-800" />
                <Link
                  href="/auth/sign-in"
                  className="block rounded-lg px-4 py-3 text-sm font-medium text-gray-300 hover:bg-gray-800"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="block rounded-lg bg-accent px-4 py-3 text-center text-sm font-medium text-black"
                >
                  Join Corner
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
