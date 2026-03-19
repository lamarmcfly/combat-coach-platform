'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface ContentSection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  page: string;
  orderIndex: number;
  isActive: boolean;
  contents: ContentItem[];
}

interface ContentItem {
  id: string;
  key: string;
  type: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  label: string | null;
  textValue: string | null;
  richText: string | null;
  mediaUrl: string | null;
  mediaAlt: string | null;
  version: number;
  section?: ContentSection;
}

type ModalMode = 'none' | 'createSection' | 'editSection' | 'createContent' | 'editContent';

export default function ContentManagementPage() {
  const searchParams = useSearchParams();
  const pageFilter = searchParams.get('page');

  const [sections, setSections] = useState<ContentSection[]>([]);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode>('none');
  const [selectedItem, setSelectedItem] = useState<ContentSection | ContentItem | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sections' | 'content'>('content');

  const pages = ['home', 'about', 'pricing', 'courses', 'coaches'];

  useEffect(() => {
    fetchData();
  }, [pageFilter]);

  async function fetchData() {
    setLoading(true);
    try {
      const url = pageFilter
        ? `/api/admin/content/sections?page=${pageFilter}`
        : '/api/admin/content/sections';

      const [sectionsRes, contentsRes] = await Promise.all([
        fetch(url),
        fetch(`/api/admin/content/items${pageFilter ? `?page=${pageFilter}` : ''}`),
      ]);

      const sectionsData = await sectionsRes.json();
      const contentsData = await contentsRes.json();

      setSections(sectionsData.sections || []);
      setContents(contentsData.contents || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish(id: string) {
    try {
      await fetch(`/api/admin/content/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish' }),
      });
      fetchData();
    } catch (error) {
      console.error('Failed to publish:', error);
    }
  }

  async function handleUnpublish(id: string) {
    try {
      await fetch(`/api/admin/content/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unpublish' }),
      });
      fetchData();
    } catch (error) {
      console.error('Failed to unpublish:', error);
    }
  }

  async function handleDelete(id: string, type: 'section' | 'content') {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const endpoint = type === 'section'
        ? `/api/admin/content/sections/${id}`
        : `/api/admin/content/items/${id}`;

      await fetch(endpoint, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  }

  const statusVariants: Record<string, 'success' | 'warning' | 'default'> = {
    PUBLISHED: 'success',
    DRAFT: 'warning',
    ARCHIVED: 'default',
  };

  const typeIcons: Record<string, string> = {
    TEXT: '📝',
    RICH_TEXT: '📄',
    IMAGE: '🖼️',
    VIDEO: '🎬',
    GALLERY: '📸',
    LINK: '🔗',
    HTML: '🌐',
    JSON: '{}',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Content Management</h1>
          <p className="text-gray-400 mt-2">
            Manage your site content and sections
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setModalMode('createSection');
              setSelectedItem(null);
            }}
          >
            + New Section
          </Button>
          <Button
            onClick={() => {
              setModalMode('createContent');
              setSelectedItem(null);
            }}
          >
            + New Content
          </Button>
        </div>
      </div>

      {/* Page Filter */}
      <div className="flex gap-2 flex-wrap">
        <a
          href="/admin/content"
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            !pageFilter
              ? 'bg-accent text-black'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          All Pages
        </a>
        {pages.map((page) => (
          <a
            key={page}
            href={`/admin/content?page=${page}`}
            className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
              pageFilter === page
                ? 'bg-accent text-black'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {page}
          </a>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('content')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'content'
              ? 'text-accent border-b-2 border-accent'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Content Items ({contents.length})
        </button>
        <button
          onClick={() => setActiveTab('sections')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'sections'
              ? 'text-accent border-b-2 border-accent'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Sections ({sections.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading...</p>
        </div>
      ) : activeTab === 'sections' ? (
        /* Sections List */
        <div className="space-y-4">
          {sections.length === 0 ? (
            <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
              <p className="text-gray-400">No sections found. Create your first section to get started.</p>
            </div>
          ) : (
            sections.map((section) => (
              <div
                key={section.id}
                className="p-6 bg-gray-900 border border-gray-800 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium text-white">
                        {section.name}
                      </h3>
                      <Badge variant={section.isActive ? 'success' : 'default'}>
                        {section.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-xs text-gray-500 font-mono">
                        {section.slug}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                      Page: <span className="capitalize">{section.page}</span> •{' '}
                      {section.contents.length} items
                    </p>
                    {section.description && (
                      <p className="text-gray-500 text-sm mt-2">
                        {section.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedItem(section);
                        setModalMode('editSection');
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDelete(section.id, 'section')}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Content Items List */
        <div className="space-y-4">
          {contents.length === 0 ? (
            <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
              <p className="text-gray-400">No content items found. Create sections first, then add content.</p>
            </div>
          ) : (
            contents.map((content) => (
              <div
                key={content.id}
                className="p-6 bg-gray-900 border border-gray-800 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{typeIcons[content.type] || '📄'}</span>
                      <h3 className="text-lg font-medium text-white">
                        {content.label || content.key}
                      </h3>
                      <Badge variant={statusVariants[content.status] || 'default'}>
                        {content.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        v{content.version}
                      </span>
                    </div>
                    <div className="text-gray-400 text-sm mt-1 flex items-center gap-2">
                      <span className="font-mono text-xs bg-gray-800 px-2 py-0.5 rounded">
                        {content.key}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{content.section?.page}</span>
                      <span>•</span>
                      <span>{content.section?.name}</span>
                    </div>
                    {/* Preview */}
                    <div className="mt-3 text-sm text-gray-500">
                      {content.type === 'IMAGE' || content.type === 'VIDEO' ? (
                        content.mediaUrl ? (
                          <div className="flex items-center gap-2">
                            {content.type === 'IMAGE' && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={content.mediaUrl}
                                alt={content.mediaAlt || ''}
                                className="h-12 w-12 object-cover rounded"
                              />
                            )}
                            <span className="truncate max-w-md">{content.mediaUrl}</span>
                          </div>
                        ) : (
                          <span className="italic">No media set</span>
                        )
                      ) : content.textValue ? (
                        <span className="line-clamp-2">{content.textValue}</span>
                      ) : (
                        <span className="italic">No content</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {content.status === 'DRAFT' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handlePublish(content.id)}
                      >
                        Publish
                      </Button>
                    ) : content.status === 'PUBLISHED' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUnpublish(content.id)}
                      >
                        Unpublish
                      </Button>
                    ) : null}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedItem(content);
                        setModalMode('editContent');
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDelete(content.id, 'content')}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {modalMode !== 'none' && (
        <ContentModal
          mode={modalMode}
          item={selectedItem}
          sections={sections}
          selectedSectionId={selectedSectionId}
          onClose={() => {
            setModalMode('none');
            setSelectedItem(null);
            setSelectedSectionId(null);
          }}
          onSave={() => {
            setModalMode('none');
            setSelectedItem(null);
            setSelectedSectionId(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function ContentModal({
  mode,
  item,
  sections,
  selectedSectionId,
  onClose,
  onSave,
}: {
  mode: ModalMode;
  item: ContentSection | ContentItem | null;
  sections: ContentSection[];
  selectedSectionId: string | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState<Record<string, string | boolean | number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === 'editSection' && item) {
      const section = item as ContentSection;
      setFormData({
        name: section.name,
        slug: section.slug,
        description: section.description || '',
        page: section.page,
        orderIndex: section.orderIndex,
        isActive: section.isActive,
      });
    } else if (mode === 'editContent' && item) {
      const content = item as ContentItem;
      setFormData({
        key: content.key,
        type: content.type,
        label: content.label || '',
        textValue: content.textValue || '',
        richText: content.richText || '',
        mediaUrl: content.mediaUrl || '',
        mediaAlt: content.mediaAlt || '',
      });
    } else if (mode === 'createSection') {
      setFormData({
        name: '',
        slug: '',
        description: '',
        page: 'home',
        orderIndex: 0,
        isActive: true,
      });
    } else if (mode === 'createContent') {
      setFormData({
        sectionId: selectedSectionId || (sections[0]?.id || ''),
        key: '',
        type: 'TEXT',
        label: '',
        textValue: '',
        mediaUrl: '',
        mediaAlt: '',
      });
    }
  }, [mode, item, sections, selectedSectionId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      let endpoint = '';
      let method = 'POST';

      if (mode === 'createSection') {
        endpoint = '/api/admin/content/sections';
      } else if (mode === 'editSection' && item) {
        endpoint = `/api/admin/content/sections/${(item as ContentSection).id}`;
        method = 'PATCH';
      } else if (mode === 'createContent') {
        endpoint = '/api/admin/content/items';
      } else if (mode === 'editContent' && item) {
        endpoint = `/api/admin/content/items/${(item as ContentItem).id}`;
        method = 'PATCH';
      }

      await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      onSave();
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  }

  const title = mode.includes('create')
    ? mode === 'createSection'
      ? 'Create Section'
      : 'Create Content'
    : mode === 'editSection'
    ? 'Edit Section'
    : 'Edit Content';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {(mode === 'createSection' || mode === 'editSection') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name as string || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.slug as string || ''}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent font-mono"
                  required
                  placeholder="hero-banner"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Page
                </label>
                <select
                  value={formData.page as string || 'home'}
                  onChange={(e) => setFormData({ ...formData, page: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
                >
                  <option value="home">Home</option>
                  <option value="about">About</option>
                  <option value="pricing">Pricing</option>
                  <option value="courses">Courses</option>
                  <option value="coaches">Coaches</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description as string || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
                  rows={3}
                />
              </div>
            </>
          )}

          {(mode === 'createContent' || mode === 'editContent') && (
            <>
              {mode === 'createContent' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Section
                  </label>
                  <select
                    value={formData.sectionId as string || ''}
                    onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
                    required
                  >
                    {sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name} ({section.page})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Key
                </label>
                <input
                  type="text"
                  value={formData.key as string || ''}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent font-mono"
                  required
                  placeholder="headline"
                  disabled={mode === 'editContent'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Type
                </label>
                <select
                  value={formData.type as string || 'TEXT'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
                  disabled={mode === 'editContent'}
                >
                  <option value="TEXT">Text</option>
                  <option value="RICH_TEXT">Rich Text</option>
                  <option value="IMAGE">Image</option>
                  <option value="VIDEO">Video</option>
                  <option value="LINK">Link</option>
                  <option value="HTML">HTML</option>
                  <option value="JSON">JSON</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={formData.label as string || ''}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
                  placeholder="Hero Headline"
                />
              </div>

              {/* Content fields based on type */}
              {(formData.type === 'TEXT' || formData.type === 'RICH_TEXT' || formData.type === 'HTML') && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Content
                  </label>
                  <textarea
                    value={(formData.type === 'TEXT' ? formData.textValue : formData.richText) as string || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [formData.type === 'TEXT' ? 'textValue' : 'richText']: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
                    rows={5}
                  />
                </div>
              )}

              {(formData.type === 'IMAGE' || formData.type === 'VIDEO') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Media URL
                    </label>
                    <input
                      type="url"
                      value={formData.mediaUrl as string || ''}
                      onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Alt Text
                    </label>
                    <input
                      type="text"
                      value={formData.mediaAlt as string || ''}
                      onChange={(e) => setFormData({ ...formData, mediaAlt: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
                    />
                  </div>
                </>
              )}
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
