'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface CertificateCardProps {
  certificate: {
    id: string;
    certificateNumber: string;
    courseName: string;
    coachName: string;
    completionDate: Date;
    verificationUrl: string;
    course: {
      title: string;
      slug: string;
      coverImageUrl: string | null;
      discipline: { name: string };
      coach: { displayName: string };
    };
  };
}

export function CertificateCard({ certificate }: CertificateCardProps) {
  const completionDate = new Date(certificate.completionDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100"
    >
      {/* Certificate Header with gradient */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-800 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <span className="text-sm font-medium text-brand-200">Certificate of Completion</span>
          </div>
          <span className="px-2 py-1 bg-white/20 rounded text-xs">
            {certificate.course.discipline.name}
          </span>
        </div>
      </div>

      {/* Certificate Body */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 mb-1">{certificate.courseName}</h3>
        <p className="text-sm text-gray-500 mb-3">Coached by {certificate.coachName}</p>

        <div className="flex items-center justify-between text-sm mb-4">
          <div className="text-gray-500">
            Completed {completionDate}
          </div>
          <div className="flex items-center gap-1 text-green-600">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Verified
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/verify/${certificate.certificateNumber}`}
            className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-center rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            View Certificate
          </Link>
          <button
            onClick={() => {
              navigator.clipboard.writeText(certificate.verificationUrl);
              alert('Verification link copied!');
            }}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            title="Copy verification link"
          >
            📋
          </button>
        </div>
      </div>

      {/* Certificate Number */}
      <div className="px-4 py-2 bg-gray-50 border-t">
        <code className="text-xs text-gray-500">{certificate.certificateNumber}</code>
      </div>
    </motion.div>
  );
}
