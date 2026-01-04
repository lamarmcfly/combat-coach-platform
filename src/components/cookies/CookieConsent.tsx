'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export type CookiePreferences = {
  necessary: boolean; // Always true, required for the site to work
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
};

const COOKIE_CONSENT_KEY = 'cookie-consent';
const COOKIE_PREFERENCES_KEY = 'cookie-preferences';

const defaultPreferences: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false,
};

export function useCookieConsent() {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);

    if (consent === 'true') {
      setHasConsent(true);
      if (savedPreferences) {
        try {
          setPreferences(JSON.parse(savedPreferences));
        } catch {
          setPreferences({ ...defaultPreferences, analytics: true, preferences: true });
        }
      }
    } else if (consent === 'false') {
      setHasConsent(false);
    } else {
      setHasConsent(null); // No decision made yet
    }
    setIsLoaded(true);
  }, []);

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(allAccepted));
    setPreferences(allAccepted);
    setHasConsent(true);
  };

  const acceptNecessary = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'false');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(defaultPreferences));
    setPreferences(defaultPreferences);
    setHasConsent(false);
  };

  const savePreferences = (newPreferences: CookiePreferences) => {
    const prefs = { ...newPreferences, necessary: true }; // Necessary is always true
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setHasConsent(true);
  };

  const resetConsent = () => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    localStorage.removeItem(COOKIE_PREFERENCES_KEY);
    setPreferences(defaultPreferences);
    setHasConsent(null);
  };

  return {
    hasConsent,
    preferences,
    isLoaded,
    acceptAll,
    acceptNecessary,
    savePreferences,
    resetConsent,
  };
}

export function CookieConsentBanner() {
  const { hasConsent, isLoaded, acceptAll, acceptNecessary } = useCookieConsent();
  const [showCustomize, setShowCustomize] = useState(false);

  // Don't render until we've checked localStorage
  if (!isLoaded || hasConsent !== null) {
    return null;
  }

  if (showCustomize) {
    return <CookieCustomizeModal onClose={() => setShowCustomize(false)} />;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
      >
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl" role="img" aria-label="Cookie">🍪</span>
                <h3 className="text-lg font-semibold text-gray-900">Cookie Preferences</h3>
              </div>
              <p className="text-sm text-gray-600">
                We use cookies to enhance your experience, analyze site traffic, and for marketing purposes.
                By clicking &quot;Accept All&quot;, you consent to our use of cookies. Read our{' '}
                <Link href="/legal/privacy" className="text-brand-600 hover:underline">
                  Privacy Policy
                </Link>{' '}
                to learn more.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setShowCustomize(true)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Customize
              </button>
              <button
                onClick={acceptNecessary}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Necessary Only
              </button>
              <button
                onClick={acceptAll}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function CookieCustomizeModal({ onClose }: { onClose: () => void }) {
  const { preferences, savePreferences } = useCookieConsent();
  const [localPreferences, setLocalPreferences] = useState<CookiePreferences>(preferences);

  const handleToggle = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return; // Can't toggle necessary cookies
    setLocalPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    savePreferences(localPreferences);
    onClose();
  };

  const cookieTypes = [
    {
      key: 'necessary' as const,
      title: 'Strictly Necessary',
      description: 'These cookies are essential for the website to function properly. They cannot be disabled.',
      required: true,
    },
    {
      key: 'analytics' as const,
      title: 'Analytics',
      description: 'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.',
      required: false,
    },
    {
      key: 'preferences' as const,
      title: 'Preferences',
      description: 'These cookies allow the website to remember choices you make and provide enhanced, personalized features.',
      required: false,
    },
    {
      key: 'marketing' as const,
      title: 'Marketing',
      description: 'These cookies are used to track visitors across websites to display relevant advertisements.',
      required: false,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-modal-title"
      >
        <div className="p-6 border-b">
          <h2 id="cookie-modal-title" className="text-xl font-semibold text-gray-900">
            Cookie Preferences
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your cookie settings. You can enable or disable different types of cookies below.
          </p>
        </div>

        <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
          {cookieTypes.map((cookie) => (
            <div key={cookie.key} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">{cookie.title}</h3>
                  {cookie.required && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                      Required
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600">{cookie.description}</p>
              </div>
              <button
                onClick={() => handleToggle(cookie.key)}
                disabled={cookie.required}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localPreferences[cookie.key]
                    ? 'bg-brand-600'
                    : 'bg-gray-300'
                } ${cookie.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                role="switch"
                aria-checked={localPreferences[cookie.key]}
                aria-label={`Toggle ${cookie.title} cookies`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localPreferences[cookie.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
          >
            Save Preferences
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Small button to re-open cookie settings (usually placed in footer)
export function CookieSettingsButton() {
  const { resetConsent } = useCookieConsent();

  return (
    <button
      onClick={resetConsent}
      className="text-sm text-gray-500 hover:text-gray-700 underline"
    >
      Cookie Settings
    </button>
  );
}
