'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface Setting {
  id: string;
  key: string;
  value: string;
  type: string;
  category: string;
  label: string | null;
  description: string | null;
  isPublic: boolean;
}

const defaultSettings = [
  {
    key: 'site_name',
    label: 'Site Name',
    description: 'The name of your platform',
    category: 'branding',
    type: 'string',
    defaultValue: 'Corner',
  },
  {
    key: 'site_tagline',
    label: 'Tagline',
    description: 'A short description of your platform',
    category: 'branding',
    type: 'string',
    defaultValue: 'Your Combat Sports Training Platform',
  },
  {
    key: 'contact_email',
    label: 'Contact Email',
    description: 'Public contact email address',
    category: 'contact',
    type: 'string',
    defaultValue: 'contact@corner.com',
  },
  {
    key: 'support_email',
    label: 'Support Email',
    description: 'Email for customer support',
    category: 'contact',
    type: 'string',
    defaultValue: 'support@corner.com',
  },
  {
    key: 'social_twitter',
    label: 'Twitter/X URL',
    description: 'Your Twitter/X profile URL',
    category: 'social',
    type: 'string',
    defaultValue: '',
  },
  {
    key: 'social_instagram',
    label: 'Instagram URL',
    description: 'Your Instagram profile URL',
    category: 'social',
    type: 'string',
    defaultValue: '',
  },
  {
    key: 'social_youtube',
    label: 'YouTube URL',
    description: 'Your YouTube channel URL',
    category: 'social',
    type: 'string',
    defaultValue: '',
  },
  {
    key: 'maintenance_mode',
    label: 'Maintenance Mode',
    description: 'Enable to show a maintenance page to visitors',
    category: 'general',
    type: 'boolean',
    defaultValue: 'false',
  },
  {
    key: 'allow_registration',
    label: 'Allow Registration',
    description: 'Allow new users to register',
    category: 'general',
    type: 'boolean',
    defaultValue: 'true',
  },
  {
    key: 'free_trial_days',
    label: 'Free Trial Days',
    description: 'Number of days for free trial period',
    category: 'subscriptions',
    type: 'number',
    defaultValue: '7',
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('branding');

  const categories = [
    { key: 'branding', label: 'Branding', icon: '🎨' },
    { key: 'contact', label: 'Contact', icon: '📧' },
    { key: 'social', label: 'Social Media', icon: '📱' },
    { key: 'general', label: 'General', icon: '⚙️' },
    { key: 'subscriptions', label: 'Subscriptions', icon: '💳' },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      setSettings(data.settings || []);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  }

  function getSettingValue(key: string): string {
    const setting = settings.find((s) => s.key === key);
    if (setting) return setting.value;

    const defaultSetting = defaultSettings.find((s) => s.key === key);
    return defaultSetting?.defaultValue || '';
  }

  async function saveSetting(key: string, value: string) {
    setSaving(key);

    const settingConfig = defaultSettings.find((s) => s.key === key);

    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          value,
          type: settingConfig?.type || 'string',
          category: settingConfig?.category || 'general',
          label: settingConfig?.label,
          description: settingConfig?.description,
          isPublic: ['site_name', 'site_tagline'].includes(key),
        }),
      });
      fetchSettings();
    } catch (error) {
      console.error('Failed to save setting:', error);
    } finally {
      setSaving(null);
    }
  }

  const filteredSettings = defaultSettings.filter(
    (s) => s.category === activeCategory
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Platform Settings</h1>
        <p className="text-gray-400 mt-2">
          Configure your platform settings and preferences
        </p>
      </div>

      <div className="flex gap-6">
        {/* Category Sidebar */}
        <div className="w-56 space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeCategory === cat.key
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Settings Panel */}
        <div className="flex-1 bg-gray-900 border border-gray-800 rounded-lg p-6">
          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : (
            <div className="space-y-6">
              {filteredSettings.map((settingConfig) => (
                <SettingField
                  key={settingConfig.key}
                  config={settingConfig}
                  value={getSettingValue(settingConfig.key)}
                  saving={saving === settingConfig.key}
                  onSave={(value) => saveSetting(settingConfig.key, value)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Seed Default Content Section */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Initialize Default Content
        </h2>
        <p className="text-gray-400 mb-4">
          Seed your platform with default content sections for the homepage.
          This will create editable sections like Hero Banner, Features, etc.
        </p>
        <SeedContentButton />
      </div>
    </div>
  );
}

function SettingField({
  config,
  value,
  saving,
  onSave,
}: {
  config: (typeof defaultSettings)[0];
  value: string;
  saving: boolean;
  onSave: (value: string) => void;
}) {
  const [localValue, setLocalValue] = useState(value);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setLocalValue(value);
    setIsDirty(false);
  }, [value]);

  function handleChange(newValue: string) {
    setLocalValue(newValue);
    setIsDirty(newValue !== value);
  }

  function handleSave() {
    onSave(localValue);
    setIsDirty(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-white">
            {config.label}
          </label>
          {config.description && (
            <p className="text-xs text-gray-500">{config.description}</p>
          )}
        </div>
        {isDirty && (
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        )}
      </div>

      {config.type === 'boolean' ? (
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleChange(localValue === 'true' ? 'false' : 'true')}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              localValue === 'true' ? 'bg-orange-600' : 'bg-gray-700'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                localValue === 'true' ? 'left-7' : 'left-1'
              }`}
            />
          </button>
          <span className="text-sm text-gray-400">
            {localValue === 'true' ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      ) : config.type === 'number' ? (
        <input
          type="number"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
        />
      ) : (
        <input
          type="text"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
        />
      )}
    </div>
  );
}

function SeedContentButton() {
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSeed() {
    if (!confirm('This will create default content sections. Continue?')) return;

    setSeeding(true);
    setMessage(null);

    try {
      // Create default sections for homepage
      const sections = [
        {
          slug: 'hero-banner',
          name: 'Hero Banner',
          page: 'home',
          description: 'Main hero section at the top of the homepage',
          contents: [
            { key: 'headline', type: 'TEXT', label: 'Headline', placeholder: 'Train Like a Champion' },
            { key: 'subheadline', type: 'TEXT', label: 'Subheadline', placeholder: 'Learn from the best coaches in combat sports' },
            { key: 'background-image', type: 'IMAGE', label: 'Background Image' },
            { key: 'cta-text', type: 'TEXT', label: 'CTA Button Text', placeholder: 'Start Training' },
            { key: 'cta-link', type: 'LINK', label: 'CTA Button Link' },
          ],
        },
        {
          slug: 'featured-video',
          name: 'Featured Video',
          page: 'home',
          description: 'Featured promotional video section',
          contents: [
            { key: 'video-url', type: 'VIDEO', label: 'Video URL' },
            { key: 'video-title', type: 'TEXT', label: 'Video Title' },
            { key: 'video-description', type: 'TEXT', label: 'Video Description' },
          ],
        },
        {
          slug: 'value-props',
          name: 'Value Propositions',
          page: 'home',
          description: 'Key benefits/features section',
          contents: [
            { key: 'section-title', type: 'TEXT', label: 'Section Title', placeholder: 'Why Choose Corner' },
            { key: 'prop-1-title', type: 'TEXT', label: 'Prop 1 Title' },
            { key: 'prop-1-description', type: 'TEXT', label: 'Prop 1 Description' },
            { key: 'prop-2-title', type: 'TEXT', label: 'Prop 2 Title' },
            { key: 'prop-2-description', type: 'TEXT', label: 'Prop 2 Description' },
            { key: 'prop-3-title', type: 'TEXT', label: 'Prop 3 Title' },
            { key: 'prop-3-description', type: 'TEXT', label: 'Prop 3 Description' },
          ],
        },
        {
          slug: 'testimonials',
          name: 'Testimonials',
          page: 'home',
          description: 'Customer testimonials section',
          contents: [
            { key: 'section-title', type: 'TEXT', label: 'Section Title', placeholder: 'What Athletes Say' },
          ],
        },
      ];

      for (const section of sections) {
        // Create section
        const sectionRes = await fetch('/api/admin/content/sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: section.slug,
            name: section.name,
            page: section.page,
            description: section.description,
          }),
        });

        if (!sectionRes.ok) continue;

        const { section: createdSection } = await sectionRes.json();

        // Create content items
        for (const content of section.contents) {
          await fetch('/api/admin/content/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sectionId: createdSection.id,
              key: content.key,
              type: content.type,
              label: content.label,
              placeholder: content.placeholder,
            }),
          });
        }
      }

      setMessage({ type: 'success', text: 'Default content sections created successfully!' });
    } catch (error) {
      console.error('Failed to seed content:', error);
      setMessage({ type: 'error', text: 'Failed to create default content' });
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div>
      <Button onClick={handleSeed} disabled={seeding} variant="secondary">
        {seeding ? 'Creating...' : 'Create Default Sections'}
      </Button>
      {message && (
        <p
          className={`mt-2 text-sm ${
            message.type === 'success' ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
