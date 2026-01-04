import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCertificateByNumber } from '@/lib/certificates/service';
import { CertificateVerification } from '@/components/certificates/CertificateVerification';

interface Props {
  params: Promise<{ certificateNumber: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { certificateNumber } = await params;

  return {
    title: `Verify Certificate ${certificateNumber} | Corner`,
    description: 'Verify the authenticity of a Corner training certificate',
  };
}

export default async function VerifyCertificatePage({ params }: Props) {
  const { certificateNumber } = await params;

  const certificate = await getCertificateByNumber(certificateNumber);

  if (!certificate) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <CertificateVerification certificate={certificate} />
      </div>
    </div>
  );
}
