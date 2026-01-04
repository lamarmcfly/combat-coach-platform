'use client';

import { motion } from 'framer-motion';

interface CertificateProps {
  certificate: {
    certificateNumber: string;
    recipientName: string;
    courseName: string;
    coachName: string;
    completionDate: Date;
    isValid: boolean;
    isRevoked: boolean;
    revokedReason?: string | null;
    course: {
      title: string;
      slug: string;
      coverImageUrl: string | null;
      discipline: { name: string };
    };
    user: {
      firstName: string | null;
      lastName: string | null;
    };
  };
}

export function CertificateVerification({ certificate }: CertificateProps) {
  const completionDate = new Date(certificate.completionDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Verification Status */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-6 ${
          certificate.isValid
            ? 'bg-green-50 border-2 border-green-200'
            : 'bg-red-50 border-2 border-red-200'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              certificate.isValid ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            <span className="text-3xl">{certificate.isValid ? '✓' : '✕'}</span>
          </div>
          <div>
            <h1
              className={`text-2xl font-bold ${
                certificate.isValid ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {certificate.isValid ? 'Valid Certificate' : 'Invalid Certificate'}
            </h1>
            <p className={certificate.isValid ? 'text-green-600' : 'text-red-600'}>
              {certificate.isValid
                ? 'This certificate is authentic and verified'
                : certificate.revokedReason || 'This certificate has been revoked'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Certificate Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Certificate Header */}
        <div className="bg-gradient-to-r from-brand-700 to-brand-900 p-8 text-white text-center">
          <div className="text-sm uppercase tracking-widest mb-2 text-brand-200">
            Certificate of Completion
          </div>
          <h2 className="text-3xl font-bold mb-4">{certificate.courseName}</h2>
          <div className="inline-flex items-center gap-2 px-4 py-1 bg-white/10 rounded-full text-sm">
            <span>🥋</span>
            <span>{certificate.course.discipline.name}</span>
          </div>
        </div>

        {/* Certificate Body */}
        <div className="p-8">
          <div className="text-center mb-8">
            <p className="text-gray-500 mb-2">This certifies that</p>
            <p className="text-3xl font-bold text-gray-900">{certificate.recipientName}</p>
            <p className="text-gray-500 mt-2">
              has successfully completed the course
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-sm text-gray-500 mb-1">Coach</div>
              <div className="font-semibold text-gray-900">{certificate.coachName}</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-sm text-gray-500 mb-1">Completion Date</div>
              <div className="font-semibold text-gray-900">{completionDate}</div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div>
                <span className="font-medium">Certificate ID:</span>{' '}
                <code className="bg-gray-100 px-2 py-1 rounded">
                  {certificate.certificateNumber}
                </code>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Verified by Corner
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Share / Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center gap-4"
      >
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
          }}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <span>📋</span>
          Copy Link
        </button>
        <button
          onClick={() => {
            const text = `I earned my ${certificate.courseName} certificate from Corner! Verify at: ${window.location.href}`;
            window.open(
              `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
              '_blank'
            );
          }}
          className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <span>🐦</span>
          Share on X
        </button>
      </motion.div>
    </div>
  );
}
