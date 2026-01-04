import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Corner',
  description: 'Terms of Service for the Corner combat sports training platform',
};

export default function TermsOfServicePage() {
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

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-500 mb-8">Last updated: {lastUpdated}</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600">
                By accessing or using Corner ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-600">
                Corner is a combat sports training platform that provides online courses, live coaching sessions, training tools, and community features for athletes and coaches.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>You must provide accurate and complete information when creating an account</li>
                <li>You are responsible for maintaining the security of your account credentials</li>
                <li>You must be at least 16 years old to use the Service</li>
                <li>One person may not maintain multiple free accounts</li>
                <li>You are responsible for all activities that occur under your account</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Subscriptions and Payments</h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Some features require a paid subscription</li>
                <li>Subscriptions are billed on a recurring basis (monthly or annually)</li>
                <li>You may cancel your subscription at any time; access continues until the end of the billing period</li>
                <li>Prices may change with 30 days notice to existing subscribers</li>
                <li>Refunds are handled on a case-by-case basis</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Content and Intellectual Property</h2>
              <h3 className="text-lg font-medium text-gray-800 mb-2">5.1 Our Content</h3>
              <p className="text-gray-600 mb-4">
                All courses, videos, materials, and platform features are owned by Corner or our content creators. You may not copy, distribute, or create derivative works without permission.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">5.2 User Content</h3>
              <p className="text-gray-600">
                You retain ownership of content you submit (reviews, videos, messages). By submitting content, you grant us a license to use, display, and distribute it on the platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Acceptable Use</h2>
              <p className="text-gray-600 mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Post harmful, abusive, or inappropriate content</li>
                <li>Attempt to gain unauthorized access to the Service</li>
                <li>Interfere with the operation of the Service</li>
                <li>Share account credentials with others</li>
                <li>Use the Service for any illegal purposes</li>
              </ul>
            </section>

            <section className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Training Disclaimer</h2>
              <p className="text-gray-600 mb-4">
                <strong>IMPORTANT:</strong> Combat sports training involves inherent risks of injury. By using Corner:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>You acknowledge that physical training carries risk of injury</li>
                <li>You agree to consult a medical professional before starting any training program</li>
                <li>You understand that online coaching cannot replace in-person supervision</li>
                <li>You accept full responsibility for your physical safety during training</li>
                <li>Corner and our coaches are not liable for injuries sustained during training</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Coach Terms</h2>
              <p className="text-gray-600 mb-4">If you are a coach on the platform:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>You must have appropriate qualifications and experience</li>
                <li>You are responsible for the accuracy of your coaching content</li>
                <li>You must maintain appropriate professional liability insurance</li>
                <li>Revenue share and payment terms are outlined in your Coach Agreement</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-600">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, CORNER SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Indemnification</h2>
              <p className="text-gray-600">
                You agree to indemnify and hold harmless Corner and its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Termination</h2>
              <p className="text-gray-600">
                We may suspend or terminate your account for violations of these Terms. You may delete your account at any time through your account settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Dispute Resolution</h2>
              <p className="text-gray-600">
                Any disputes arising from these Terms shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Changes to Terms</h2>
              <p className="text-gray-600">
                We may modify these Terms at any time. Material changes will be communicated via email or platform notification. Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">14. Contact</h2>
              <p className="text-gray-600">
                For questions about these Terms, contact us at legal@combatcoach.app.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-8 border-t">
            <p className="text-sm text-gray-500">
              See also:{' '}
              <Link href="/legal/privacy" className="text-brand-600 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
