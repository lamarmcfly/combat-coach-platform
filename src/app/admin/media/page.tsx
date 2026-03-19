'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface MediaAsset {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl: string | null;
  alt: string | null;
  caption: string | null;
  tags: string[];
  folder: string;
  uploadedBy: string;
  createdAt: string;
}

type MediaTypeFilter = 'all' | 'photos' | 'videos';

export default function MediaLibraryPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaTypeFilter>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [total, setTotal] = useState(0);

  const folders = ['general', 'hero', 'courses', 'coaches', 'testimonials', 'logos'];

  useEffect(() => {
    fetchAssets();
  }, [selectedFolder, searchQuery]);

  async function fetchAssets() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedFolder) params.append('folder', selectedFolder);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/admin/media?${params}`);
      const data = await res.json();

      setAssets(data.assets || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this media asset?')) return;

    try {
      await fetch(`/api/admin/media/${id}`, { method: 'DELETE' });
      fetchAssets();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    return '📁';
  }

  const filteredAssets = assets.filter((asset) => {
    if (mediaTypeFilter === 'photos') return asset.mimeType.startsWith('image/');
    if (mediaTypeFilter === 'videos') return asset.mimeType.startsWith('video/');
    return true;
  });

  const photosCount = assets.filter((a) => a.mimeType.startsWith('image/')).length;
  const videosCount = assets.filter((a) => a.mimeType.startsWith('video/')).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Media Library</h1>
          <p className="text-gray-400 mt-2">
            Manage your images, videos, and other media assets
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>+ Add Media</Button>
      </div>

      {/* Media Type Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {([
          { key: 'all' as const, label: 'All Media', count: assets.length },
          { key: 'photos' as const, label: 'Photos', count: photosCount },
          { key: 'videos' as const, label: 'Videos', count: videosCount },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMediaTypeFilter(tab.key)}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              mediaTypeFilter === tab.key
                ? 'text-accent border-b-2 border-accent'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
          />
        </div>
        <select
          value={selectedFolder}
          onChange={(e) => setSelectedFolder(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
        >
          <option value="">All Folders</option>
          {folders.map((folder) => (
            <option key={folder} value={folder}>
              {folder.charAt(0).toUpperCase() + folder.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <p className="text-gray-400 text-sm">
        Showing {filteredAssets.length} of {total} assets
        {mediaTypeFilter !== 'all' && ` (filtered to ${mediaTypeFilter})`}
      </p>

      {/* Media Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading...</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-800">
          <p className="text-gray-400">
            {assets.length === 0
              ? 'No media assets found.'
              : `No ${mediaTypeFilter === 'photos' ? 'photos' : 'videos'} found.`}
          </p>
          <Button onClick={() => setShowAddModal(true)} className="mt-4">
            {assets.length === 0 ? 'Add Your First Media' : `Add ${mediaTypeFilter === 'photos' ? 'Photo' : 'Video'}`}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden group cursor-pointer hover:border-accent transition-colors"
              onClick={() => setSelectedAsset(asset)}
            >
              {/* Preview */}
              <div className="aspect-square bg-gray-800 relative">
                {asset.mimeType.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={asset.thumbnailUrl || asset.url}
                    alt={asset.alt || asset.filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    {getFileIcon(asset.mimeType)}
                  </div>
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(asset.url);
                    }}
                  >
                    Copy URL
                  </Button>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-white text-sm truncate" title={asset.originalName}>
                  {asset.originalName}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-gray-500 text-xs">
                    {formatFileSize(asset.size)}
                  </span>
                  <Badge variant="default">
                    {asset.folder}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Media Modal */}
      {showAddModal && (
        <AddMediaModal
          folders={folders}
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            setShowAddModal(false);
            fetchAssets();
          }}
        />
      )}

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          folders={folders}
          onClose={() => setSelectedAsset(null)}
          onDelete={() => {
            handleDelete(selectedAsset.id);
            setSelectedAsset(null);
          }}
          onSave={() => {
            setSelectedAsset(null);
            fetchAssets();
          }}
        />
      )}
    </div>
  );
}

function AddMediaModal({
  folders,
  onClose,
  onSave,
}: {
  folders: string[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [uploadMode, setUploadMode] = useState<'url' | 'mux-url' | 'mux-direct'>('url');
  const [formData, setFormData] = useState({
    url: '',
    filename: '',
    originalName: '',
    mimeType: 'image/jpeg',
    size: 0,
    alt: '',
    caption: '',
    folder: 'general',
  });
  const [saving, setSaving] = useState(false);
  const [muxUploadUrl, setMuxUploadUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      if (uploadMode === 'mux-url') {
        // Ingest video from URL via Mux
        const res = await fetch('/api/admin/media/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'url',
            url: formData.url,
            filename: formData.filename || formData.url.split('/').pop() || 'mux-video',
            folder: formData.folder,
            alt: formData.alt,
            caption: formData.caption,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          alert(data.error || 'Upload failed');
          return;
        }

        onSave();
      } else if (uploadMode === 'mux-direct') {
        // Get a direct upload URL from Mux
        setUploadProgress('Getting upload URL...');
        const res = await fetch('/api/admin/media/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'direct',
            filename: formData.filename || 'mux-upload',
            folder: formData.folder,
            alt: formData.alt,
            caption: formData.caption,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          alert(data.error || 'Failed to get upload URL');
          return;
        }

        const data = await res.json();
        setMuxUploadUrl(data.uploadUrl);
        setUploadProgress('Upload URL ready. Use the URL below to upload your video via PUT request.');
      } else {
        // Standard URL-based media creation
        await fetch('/api/admin/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            filename: formData.filename || formData.url.split('/').pop() || 'media',
            originalName: formData.originalName || formData.filename || 'media',
          }),
        });
        onSave();
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-lg">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Add Media</h2>
          <p className="text-gray-400 text-sm mt-1">
            Add images via URL or upload videos to Mux
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-gray-800">
          {[
            { key: 'url' as const, label: 'From URL' },
            { key: 'mux-url' as const, label: 'Mux (URL)' },
            { key: 'mux-direct' as const, label: 'Mux (Upload)' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setUploadMode(tab.key); setMuxUploadUrl(null); setUploadProgress(null); }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                uploadMode === tab.key
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {(uploadMode === 'url' || uploadMode === 'mux-url') && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                {uploadMode === 'mux-url' ? 'Video URL (for Mux ingestion) *' : 'Media URL *'}
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
                placeholder={uploadMode === 'mux-url' ? 'https://example.com/video.mp4' : 'https://example.com/image.jpg'}
                required
              />
            </div>
          )}

          {uploadMode === 'mux-direct' && muxUploadUrl && (
            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">{uploadProgress}</p>
              <code className="text-xs text-green-400 break-all">{muxUploadUrl}</code>
              <p className="text-xs text-gray-500 mt-2">
                Send a PUT request with your video file to this URL.
              </p>
            </div>
          )}

          {uploadMode === 'url' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Media Type
              </label>
              <select
                value={formData.mimeType}
                onChange={(e) => setFormData({ ...formData, mimeType: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
              >
                <option value="image/jpeg">Image (JPEG)</option>
                <option value="image/png">Image (PNG)</option>
                <option value="image/webp">Image (WebP)</option>
                <option value="image/gif">Image (GIF)</option>
                <option value="video/mp4">Video (MP4)</option>
                <option value="video/webm">Video (WebM)</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Folder
            </label>
            <select
              value={formData.folder}
              onChange={(e) => setFormData({ ...formData, folder: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
            >
              {folders.map((folder) => (
                <option key={folder} value={folder}>
                  {folder.charAt(0).toUpperCase() + folder.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Alt Text
            </label>
            <input
              type="text"
              value={formData.alt}
              onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
              placeholder="Description of the media"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Caption (optional)
            </label>
            <textarea
              value={formData.caption}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Processing...' : uploadMode === 'mux-direct' ? 'Get Upload URL' : 'Add Media'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssetDetailModal({
  asset,
  folders,
  onClose,
  onDelete,
  onSave,
}: {
  asset: MediaAsset;
  folders: string[];
  onClose: () => void;
  onDelete: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    alt: asset.alt || '',
    caption: asset.caption || '',
    folder: asset.folder,
    url: asset.url,
  });
  const [saving, setSaving] = useState(false);
  const [showReplaceUrl, setShowReplaceUrl] = useState(false);

  const isImage = asset.mimeType.startsWith('image/');
  const isVideo = asset.mimeType.startsWith('video/');
  const mediaLabel = isImage ? 'Photo' : isVideo ? 'Video' : 'File';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      await fetch(`/api/admin/media/${asset.id}`, {
        method: 'PATCH',
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{mediaLabel} Details</h2>
            <p className="text-xs text-gray-400 mt-1">Edit this {mediaLabel.toLowerCase()} independently</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-6">
          {/* Preview */}
          <div>
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={formData.url}
                alt={formData.alt || asset.filename}
                className="w-full rounded-lg"
              />
            ) : isVideo ? (
              <video src={formData.url} controls className="w-full rounded-lg" />
            ) : (
              <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center text-6xl">
                📁
              </div>
            )}

            {/* URL Copy / Replace */}
            <div className="mt-4 p-3 bg-gray-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">URL</p>
                <button
                  type="button"
                  onClick={() => setShowReplaceUrl(!showReplaceUrl)}
                  className="text-xs text-accent hover:text-accent-bright transition-colors"
                >
                  {showReplaceUrl ? 'Cancel' : `Replace ${mediaLabel}`}
                </button>
              </div>
              {showReplaceUrl ? (
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-accent"
                  placeholder={`Enter new ${mediaLabel.toLowerCase()} URL...`}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.url}
                    readOnly
                    className="flex-1 bg-transparent text-white text-sm truncate"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(formData.url)}
                  >
                    Copy
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Filename
              </label>
              <p className="text-white">{asset.originalName}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Type / Size
              </label>
              <p className="text-white">
                {asset.mimeType} • {(asset.size / 1024).toFixed(1)} KB
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Folder
              </label>
              <select
                value={formData.folder}
                onChange={(e) => setFormData({ ...formData, folder: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
              >
                {folders.map((folder) => (
                  <option key={folder} value={folder}>
                    {folder.charAt(0).toUpperCase() + folder.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Alt Text
              </label>
              <input
                type="text"
                value={formData.alt}
                onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Caption
              </label>
              <textarea
                value={formData.caption}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-accent"
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onDelete}
                className="text-red-500 hover:text-red-400"
              >
                Delete
              </Button>
              <div className="flex-1" />
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
