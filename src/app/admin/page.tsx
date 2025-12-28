'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DashboardStats {
  sections: number;
  contentItems: number;
  mediaAssets: number;
  publishedItems: number;
  draftItems: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    sections: 0,
    contentItems: 0,
    mediaAssets: 0,
    publishedItems: 0,
    draftItems: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [sectionsRes, contentRes, mediaRes] = await Promise.all([
          fetch('/api/admin/content/sections'),
          fetch('/api/admin/content/items'),
          fetch('/api/admin/media'),
        ]);

        const sectionsData = await sectionsRes.json();
        const contentData = await contentRes.json();
        const mediaData = await mediaRes.json();

        const sections = sectionsData.sections || [];
        const contents = contentData.contents || [];
        const media = mediaData.assets || [];

        setStats({
          sections: sections.length,
          contentItems: contents.length,
          mediaAssets: media.length,
          publishedItems: contents.filter((c: { status: string }) => c.status === 'PUBLISHED').length,
          draftItems: contents.filter((c: { status: string }) => c.status === 'DRAFT').length,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const quickActions = [
    {
      title: 'Edit Hero Banner',
      description: 'Update the main hero section on the homepage',
      href: '/admin/content?page=home',
      icon: '🎨',
    },
    {
      title: 'Upload Media',
      description: 'Add new images or videos to the library',
      href: '/admin/media',
      icon: '📤',
    },
    {
      title: 'Site Settings',
      description: 'Configure global platform settings',
      href: '/admin/settings',
      icon: '⚙️',
    },
    {
      title: 'Manage Sections',
      description: 'Create or edit content sections',
      href: '/admin/content/sections',
      icon: '📑',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-400 mt-2">
          Manage your platform content and settings
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Sections"
          value={stats.sections}
          loading={loading}
          icon="📂"
        />
        <StatCard
          title="Content Items"
          value={stats.contentItems}
          loading={loading}
          icon="📝"
        />
        <StatCard
          title="Media Assets"
          value={stats.mediaAssets}
          loading={loading}
          icon="🖼️"
        />
        <StatCard
          title="Published"
          value={stats.publishedItems}
          loading={loading}
          icon="✅"
          color="green"
        />
        <StatCard
          title="Drafts"
          value={stats.draftItems}
          loading={loading}
          icon="📋"
          color="yellow"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="p-6 bg-gray-900 border border-gray-800 rounded-lg hover:border-orange-500 transition-colors group"
            >
              <div className="text-3xl mb-3">{action.icon}</div>
              <h3 className="text-lg font-medium text-white group-hover:text-orange-500 transition-colors">
                {action.title}
              </h3>
              <p className="text-sm text-gray-400 mt-1">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Getting Started</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <span className="text-2xl">1️⃣</span>
              <div>
                <h3 className="text-white font-medium">Create Content Sections</h3>
                <p className="text-gray-400 text-sm">
                  Define the editable areas of your site (hero, about, features, etc.)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-2xl">2️⃣</span>
              <div>
                <h3 className="text-white font-medium">Add Content Items</h3>
                <p className="text-gray-400 text-sm">
                  Create text, images, and videos for each section
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-2xl">3️⃣</span>
              <div>
                <h3 className="text-white font-medium">Upload Media</h3>
                <p className="text-gray-400 text-sm">
                  Add your images and videos to the media library
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-2xl">4️⃣</span>
              <div>
                <h3 className="text-white font-medium">Publish Content</h3>
                <p className="text-gray-400 text-sm">
                  Review and publish your content to make it live
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  loading,
  icon,
  color = 'blue',
}: {
  title: string;
  value: number;
  loading: boolean;
  icon: string;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}) {
  const colorClasses = {
    blue: 'border-blue-500/20 bg-blue-500/10',
    green: 'border-green-500/20 bg-green-500/10',
    yellow: 'border-yellow-500/20 bg-yellow-500/10',
    red: 'border-red-500/20 bg-red-500/10',
  };

  return (
    <div
      className={`p-6 rounded-lg border ${colorClasses[color]} bg-gray-900`}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-3xl font-bold text-white">
          {loading ? '...' : value}
        </span>
      </div>
      <p className="text-gray-400 text-sm mt-2">{title}</p>
    </div>
  );
}
