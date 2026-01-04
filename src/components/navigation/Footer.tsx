'use client';

import Link from 'next/link';
import { CookieSettingsButton } from '@/components/cookies';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Platform
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/courses" className="text-gray-400 hover:text-white text-sm">
                  Browse Courses
                </Link>
              </li>
              <li>
                <Link href="/coaches" className="text-gray-400 hover:text-white text-sm">
                  Find Coaches
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-gray-400 hover:text-white text-sm">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* For Athletes */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              For Athletes
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/my/training" className="text-gray-400 hover:text-white text-sm">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/my/achievements" className="text-gray-400 hover:text-white text-sm">
                  Achievements
                </Link>
              </li>
              <li>
                <Link href="/my/goals" className="text-gray-400 hover:text-white text-sm">
                  Goals
                </Link>
              </li>
            </ul>
          </div>

          {/* For Coaches */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              For Coaches
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/coach/apply" className="text-gray-400 hover:text-white text-sm">
                  Become a Coach
                </Link>
              </li>
              <li>
                <Link href="/coach/dashboard" className="text-gray-400 hover:text-white text-sm">
                  Coach Dashboard
                </Link>
              </li>
              <li>
                <Link href="/coach/courses" className="text-gray-400 hover:text-white text-sm">
                  Manage Courses
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Legal
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/legal/privacy" className="text-gray-400 hover:text-white text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="text-gray-400 hover:text-white text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <CookieSettingsButton />
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-display text-white">CORNER</span>
              <span className="text-gray-500 text-sm">
                Train with the best. Become the best.
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              &copy; {currentYear} Corner. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
