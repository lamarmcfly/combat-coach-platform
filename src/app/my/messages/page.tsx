import { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { ChatInterface } from '@/components/chat';

export const metadata: Metadata = {
  title: 'Messages | Corner',
  description: 'Your messages and conversations',
};

export default async function MessagesPage() {
  const session = (await getServerSession(authOptions)) as Session | null;

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/my/messages');
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Messages</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Chat with coaches and other athletes
        </p>
      </div>

      <ChatInterface currentUserId={session.user.id} />
    </div>
  );
}
