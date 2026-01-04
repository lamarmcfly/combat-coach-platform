import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Corner',
  description: 'Privacy Policy for the Corner combat sports training platform',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'January 2026';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="mb-8">
            <Link
              href="/"
              className="text-brand-600 hover:text-brand-700 text-sm"
            >
              &larr; Back to Home
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Last updated: {lastUpdated}</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-600 mb-4">
                Corner ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our combat sports training platform.
              </p>
              <p className="text-gray-600">
                By using Corner, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>

              <h3 className="text-lg font-medium text-gray-800 mb-2">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li>Account information (email, name, password)</li>
                <li>Profile information (training history, goals, preferences)</li>
                <li>Payment information (processed securely via Stripe)</li>
                <li>Content you submit (reviews, messages, video submissions)</li>
                <li>Health-related data (weight tracking, training logs) - provided voluntarily</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2">2.2 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li>Device information (browser type, operating system)</li>
                <li>Usage data (pages visited, features used, time spent)</li>
                <li>IP address and approximate location</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-600 mb-4">We use the collected information to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Provide and maintain our services</li>
                <li>Process transactions and send related information</li>
                <li>Personalize your training experience and recommendations</li>
                <li>Communicate with you about updates, offers, and support</li>
                <li>Improve our platform and develop new features</li>
                <li>Monitor and analyze usage patterns</li>
                <li>Detect, prevent, and address technical issues and fraud</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Data Sharing</h2>
              <p className="text-gray-600 mb-4">We may share your information with:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Coaches:</strong> When you enroll in courses or request coaching</li>
                <li><strong>Service Providers:</strong> Third parties that help us operate (payment processing, analytics, email)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              </ul>
              <p className="text-gray-600 mt-4">
                We do not sell your personal information to third parties.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Your Rights</h2>
              <p className="text-gray-600 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Rectification:</strong> Correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your data ("right to be forgotten")</li>
                <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              </ul>
              <p className="text-gray-600 mt-4">
                To exercise these rights, please visit your{' '}
                <Link href="/my/settings" className="text-brand-600 hover:underline">
                  account settings
                </Link>{' '}
                or contact us at privacy@combatcoach.app.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Data Security</h2>
              <p className="text-gray-600">
                We implement industry-standard security measures including encryption, secure servers, and regular security audits. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
              <p className="text-gray-600">
                We retain your personal information for as long as your account is active or as needed to provide services. After account deletion, we may retain certain information for legal compliance, dispute resolution, or legitimate business purposes for up to 3 years.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Children's Privacy</h2>
              <p className="text-gray-600">
                Corner is not intended for users under 16 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. International Transfers</h2>
              <p className="text-gray-600">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers in accordance with applicable data protection laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
              <p className="text-gray-600">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-600">
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <ul className="list-none text-gray-600 mt-4">
                <li>Email: privacy@combatcoach.app</li>
                <li>Address: [Your Business Address]</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
