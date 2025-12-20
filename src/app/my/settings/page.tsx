'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/contexts/ToastContext';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  subscriptionTier: string;
  createdAt: string;
}

interface NotificationPrefs {
  emailCoaching: boolean;
  emailSessions: boolean;
  emailGoals: boolean;
  emailSparring: boolean;
  emailBilling: boolean;
  emailMarketing: boolean;
  pushEnabled: boolean;
  pushSessionReminders: boolean;
  pushMessages: boolean;
}

const experienceLevels = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'EXPERT', label: 'Expert' },
];

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const { success, error: showError } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'notifications' | 'billing'>('profile');

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>({
    emailCoaching: true,
    emailSessions: true,
    emailGoals: true,
    emailSparring: true,
    emailBilling: true,
    emailMarketing: false,
    pushEnabled: false,
    pushSessionReminders: true,
    pushMessages: true,
  });
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isLoadingBillingPortal, setIsLoadingBillingPortal] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchNotificationPrefs();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setFirstName(data.user.firstName || '');
        setLastName(data.user.lastName || '');
      }
    } catch (err) {
      showError('Error', 'Failed to load profile');
      console.error('Error fetching profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotificationPrefs = async () => {
    try {
      const response = await fetch('/api/user/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotificationPrefs(data.preferences);
      }
    } catch (err) {
      console.error('Error fetching notification preferences:', err);
    }
  };

  const handleToggleNotification = (key: keyof NotificationPrefs) => {
    setNotificationPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true);
    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationPrefs),
      });

      if (response.ok) {
        success('Preferences Saved', 'Your notification preferences have been updated.');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save preferences');
      }
    } catch (err) {
      showError('Error', err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleOpenBillingPortal = async () => {
    setIsLoadingBillingPortal(true);
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        showError('Billing Portal', data.error);
      }
    } catch (err) {
      showError('Error', 'Failed to open billing portal');
    } finally {
      setIsLoadingBillingPortal(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName }),
      });

      if (response.ok) {
        success('Profile Updated', 'Your profile has been saved successfully.');
        await updateSession();
        await fetchProfile();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }
    } catch (err) {
      showError('Error', err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showError('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      showError('Error', 'Password must be at least 8 characters');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (response.ok) {
        success('Password Changed', 'Your password has been updated.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to change password');
      }
    } catch (err) {
      showError('Error', err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (profile?.email) {
      return profile.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="mt-2 text-gray-400">Manage your account and preferences</p>
        </div>
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="mt-2 text-gray-400">Manage your account and preferences</p>
      </div>

      {/* Profile Header */}
      <Card className="mb-6">
        <div className="flex items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-2xl font-bold text-black">
            {getInitials()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">
              {firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Set your name'}
            </h2>
            <p className="text-gray-400">{profile?.email}</p>
            <div className="mt-2 flex gap-2">
              <Badge variant={profile?.role === 'COACH' ? 'info' : 'default'}>
                {profile?.role}
              </Badge>
              <Badge variant="success">{profile?.subscriptionTier}</Badge>
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            Member since<br />
            {profile?.createdAt && formatDate(profile.createdAt)}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-gray-800">
        {[
          { id: 'profile', label: 'Profile' },
          { id: 'account', label: 'Account' },
          { id: 'notifications', label: 'Notifications' },
          { id: 'billing', label: 'Billing' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'border-b-2 border-accent text-accent'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card>
          <h3 className="mb-6 text-lg font-bold text-white">Personal Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-400">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-400">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-400">Email</label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-gray-400"
              />
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          <Card>
            <h3 className="mb-6 text-lg font-bold text-white">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-400">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-400">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Enter new password (min 8 characters)"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-400">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Confirm new password"
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleChangePassword}
                  disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
                >
                  {isSaving ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="border-red-900/50 bg-red-900/10">
            <h3 className="mb-4 text-lg font-bold text-red-400">Danger Zone</h3>
            <p className="mb-4 text-sm text-gray-400">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button variant="outline" className="border-red-800 text-red-400 hover:bg-red-900/30">
              Delete Account
            </Button>
          </Card>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <Card>
            <h3 className="mb-6 text-lg font-bold text-white">Email Notifications</h3>
            <div className="space-y-4">
              {[
                { key: 'emailCoaching' as const, label: 'Coaching request updates', description: 'Get notified when a coach responds to your request' },
                { key: 'emailSessions' as const, label: 'Live session reminders', description: 'Receive reminders before your booked sessions' },
                { key: 'emailGoals' as const, label: 'Goal progress reminders', description: 'Weekly progress updates on your training goals' },
                { key: 'emailSparring' as const, label: 'Sparring requests', description: 'Notifications for new sparring match requests' },
                { key: 'emailBilling' as const, label: 'Billing updates', description: 'Receipts, subscription changes, and payment issues' },
                { key: 'emailMarketing' as const, label: 'Product updates', description: 'News about new features, courses, and announcements' },
              ].map((pref) => (
                <div key={pref.key} className="flex items-center justify-between rounded-lg bg-gray-800/50 p-4">
                  <div>
                    <div className="font-medium text-white">{pref.label}</div>
                    <div className="text-sm text-gray-400">{pref.description}</div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={notificationPrefs[pref.key]}
                      onChange={() => handleToggleNotification(pref.key)}
                    />
                    <div className="h-6 w-11 rounded-full bg-gray-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-accent peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="mb-6 text-lg font-bold text-white">Push Notifications</h3>
            <p className="mb-4 text-sm text-gray-400">
              Push notifications are coming soon. Enable them to be notified when they launch.
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-4">
                <div>
                  <div className="font-medium text-white">Enable push notifications</div>
                  <div className="text-sm text-gray-400">Receive real-time notifications in your browser</div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={notificationPrefs.pushEnabled}
                    onChange={() => handleToggleNotification('pushEnabled')}
                  />
                  <div className="h-6 w-11 rounded-full bg-gray-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-accent peer-checked:after:translate-x-full"></div>
                </label>
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveNotifications} disabled={isSavingNotifications}>
              {isSavingNotifications ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <Card>
            <h3 className="mb-6 text-lg font-bold text-white">Subscription & Billing</h3>
            <p className="text-sm text-gray-400 mb-6">
              Manage your subscription, update payment methods, and view invoices through the Stripe Customer Portal.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-800/50">
                <div className="p-2 rounded-lg bg-accent/20">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-white">Payment Methods</h4>
                  <p className="text-sm text-gray-400">Add, update, or remove payment methods</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-800/50">
                <div className="p-2 rounded-lg bg-accent/20">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-white">Invoices & Receipts</h4>
                  <p className="text-sm text-gray-400">Download past invoices and receipts</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-800/50">
                <div className="p-2 rounded-lg bg-accent/20">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-white">Subscription Management</h4>
                  <p className="text-sm text-gray-400">Change or cancel your subscription</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-700">
              <Button
                onClick={handleOpenBillingPortal}
                disabled={isLoadingBillingPortal}
              >
                {isLoadingBillingPortal ? 'Opening...' : 'Open Billing Portal'}
              </Button>
              <p className="mt-2 text-xs text-gray-500">
                You will be redirected to Stripe to manage your billing securely.
              </p>
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 text-lg font-bold text-white">Quick Links</h3>
            <div className="space-y-2">
              <a
                href="/my/subscription"
                className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition"
              >
                <span className="text-white">View Subscription Details</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              <a
                href="/my/credits"
                className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition"
              >
                <span className="text-white">Purchase Credits</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
