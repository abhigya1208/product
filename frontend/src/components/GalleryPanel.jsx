import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

export default function GalleryPanel() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Upload state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadPreviews, setUploadPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef(null);

  // Edit state
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });

  // Selection for bulk
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Preview lightbox
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const loadPhotos = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      const res = await api.get('/gallery', { params: { page: p, limit: 24 } });
      setPhotos(res.data.photos);
      setTotalPages(res.data.pages);
      setTotal(res.data.total);
      setPage(p);
    } catch (err) {
      console.error('Load gallery error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('/gallery/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Load stats error:', err);
    }
  }, []);

  useEffect(() => { loadPhotos(1); loadStats(); }, [loadPhotos, loadStats]);

  // File handling
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];

    const validFiles = files.filter(f => {
      if (!validTypes.includes(f.type)) {
        alert(`"${f.name}" is not a supported image type.`);
        return false;
      }
      if (f.size < 20 * 1024) {
        alert(`"${f.name}" is too small (min 20 KB).`);
        return false;
      }
      if (f.size > 1 * 1024 * 1024 * 1024) {
        alert(`"${f.name}" is too large (max 1 GB).`);
        return false;
      }
      return true;
    });

    setUploadFiles(prev => [...prev, ...validFiles]);

    // Generate previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadPreviews(prev => [...prev, {
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: ev.target.result,
          title: '',
          description: ''
        }]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeUploadFile = (index) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
    setUploadPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const updatePreviewMeta = (index, field, value) => {
    setUploadPreviews(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const handleUpload = async () => {
    if (uploadPreviews.length === 0) return;
    setUploading(true);
    setUploadProgress('Preparing upload…');

    try {
      const photosPayload = uploadPreviews.map(p => {
        // Extract base64 data from dataUrl (strip data:image/...;base64, prefix)
        const base64 = p.dataUrl.split(',')[1];
        return {
          imageData: base64,
          mimeType: p.type,
          fileSize: p.size,
          title: p.title,
          description: p.description
        };
      });

      setUploadProgress(`Uploading ${photosPayload.length} photo(s)…`);
      await api.post('/gallery/upload', { photos: photosPayload });

      setUploadProgress('Upload complete!');
      setUploadFiles([]);
      setUploadPreviews([]);
      setShowUpload(false);
      loadPhotos(1);
      loadStats();
    } catch (err) {
      console.error('Upload error:', err);
      alert(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  // Actions
  const togglePin = async (photo) => {
    try {
      await api.patch(`/gallery/${photo._id}/pin`);
      loadPhotos(page);
      loadStats();
    } catch (err) {
      console.error(err);
      alert('Failed to toggle pin.');
    }
  };

  const toggleVisibility = async (photo) => {
    try {
      await api.patch(`/gallery/${photo._id}/visibility`);
      loadPhotos(page);
      loadStats();
    } catch (err) {
      console.error(err);
      alert('Failed to toggle visibility.');
    }
  };

  const deletePhoto = async (id) => {
    try {
      await api.delete(`/gallery/${id}`);
      setDeleteConfirm(null);
      loadPhotos(page);
      loadStats();
    } catch (err) {
      console.error(err);
      alert('Failed to delete photo.');
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} photo(s)? This cannot be undone.`)) return;
    try {
      await api.post('/gallery/bulk-delete', { ids: Array.from(selectedIds) });
      setSelectedIds(new Set());
      setSelectMode(false);
      loadPhotos(1);
      loadStats();
    } catch (err) {
      console.error(err);
      alert('Failed to bulk delete.');
    }
  };

  const saveEdit = async () => {
    if (!editingPhoto) return;
    try {
      await api.put(`/gallery/${editingPhoto._id}`, editForm);
      setEditingPhoto(null);
      loadPhotos(page);
    } catch (err) {
      console.error(err);
      alert('Failed to update photo.');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === photos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(photos.map(p => p._id)));
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  return (
    <div className="animate-fade-in">
      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Total Photos', value: stats.total, icon: '📸', color: 'bg-green-50 dark:bg-green-950/30' },
            { label: 'Visible', value: stats.visible, icon: '👁️', color: 'bg-blue-50 dark:bg-blue-950/30' },
            { label: 'Hidden', value: stats.hidden, icon: '🙈', color: 'bg-yellow-50 dark:bg-yellow-950/30' },
            { label: 'Pinned', value: stats.pinned, icon: '📌', color: 'bg-orange-50 dark:bg-orange-950/30' },
            { label: 'Storage Used', value: formatSize(stats.totalSize), icon: '💾', color: 'bg-purple-50 dark:bg-purple-950/30' },
          ].map((s, i) => (
            <div key={i} className={`${s.color} rounded-2xl p-4 border border-gray-100 dark:border-slate-800`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{s.icon}</span>
                <span className="text-xs font-semibold text-mid-grey dark:text-gray-400 uppercase">{s.label}</span>
              </div>
              <p className="text-2xl font-extrabold text-dark-grey dark:text-white">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <h3 className="section-title text-xl">Gallery ({total})</h3>
        <div className="flex flex-wrap gap-2">
          {selectMode && (
            <>
              <button onClick={selectAll} className="btn-outline text-xs px-3 py-1.5">
                {selectedIds.size === photos.length ? 'Deselect All' : 'Select All'}
              </button>
              {selectedIds.size > 0 && (
                <button onClick={bulkDelete} className="btn-danger text-xs px-3 py-1.5">
                  🗑️ Delete ({selectedIds.size})
                </button>
              )}
            </>
          )}
          <button
            onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
            className={`btn-outline text-xs px-3 py-1.5 ${selectMode ? 'border-red-300 text-red-600 dark:text-red-400' : ''}`}
          >
            {selectMode ? '✕ Cancel' : '☑️ Select'}
          </button>
          <button onClick={() => setShowUpload(true)} className="btn-primary text-sm px-4 py-2">
            + Add Photos
          </button>
        </div>
      </div>

      {/* Photo Grid */}
      {loading && photos.length === 0 ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-pastel-green border-t-transparent"></div>
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 dark:border-slate-700 rounded-2xl">
          <div className="text-5xl mb-3 opacity-40">📷</div>
          <p className="text-mid-grey dark:text-gray-400 font-medium">No photos in gallery yet.</p>
          <button onClick={() => setShowUpload(true)} className="btn-primary text-sm px-4 py-2 mt-4">
            Upload First Photo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {photos.map(photo => (
            <div
              key={photo._id}
              className={`group relative rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                selectedIds.has(photo._id)
                  ? 'border-green-500 ring-2 ring-green-300 dark:ring-green-800'
                  : 'border-gray-100 dark:border-slate-800 hover:border-pastel-green'
              } ${!photo.isVisible ? 'opacity-50' : ''}`}
            >
              {/* Image */}
              <div
                className="aspect-square overflow-hidden cursor-pointer bg-gray-100 dark:bg-slate-800"
                onClick={() => selectMode ? toggleSelect(photo._id) : setPreviewPhoto(photo)}
              >
                <img
                  src={`data:${photo.mimeType};base64,${photo.imageData}`}
                  alt={photo.title || 'Gallery'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* Badges */}
              <div className="absolute top-2 left-2 flex gap-1">
                {photo.isPinned && (
                  <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">📌</span>
                )}
                {!photo.isVisible && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">Hidden</span>
                )}
              </div>

              {/* Select checkbox */}
              {selectMode && (
                <div className="absolute top-2 right-2">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${
                      selectedIds.has(photo._id)
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'bg-white/80 border-gray-300 dark:bg-slate-800/80 dark:border-slate-600'
                    }`}
                    onClick={(e) => { e.stopPropagation(); toggleSelect(photo._id); }}
                  >
                    {selectedIds.has(photo._id) && <span className="text-xs">✓</span>}
                  </div>
                </div>
              )}

              {/* Actions overlay */}
              {!selectMode && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                  <div className="flex gap-1.5 mb-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePin(photo); }}
                      className={`text-[10px] px-2 py-1 rounded-full font-semibold transition-colors ${
                        photo.isPinned
                          ? 'bg-yellow-400 text-yellow-900'
                          : 'bg-white/20 text-white hover:bg-white/40'
                      }`}
                      title={photo.isPinned ? 'Unpin' : 'Pin to top'}
                    >
                      📌 {photo.isPinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleVisibility(photo); }}
                      className={`text-[10px] px-2 py-1 rounded-full font-semibold transition-colors ${
                        photo.isVisible
                          ? 'bg-white/20 text-white hover:bg-white/40'
                          : 'bg-green-500/80 text-white'
                      }`}
                      title={photo.isVisible ? 'Hide' : 'Show'}
                    >
                      {photo.isVisible ? '🙈 Hide' : '👁️ Show'}
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPhoto(photo);
                        setEditForm({ title: photo.title || '', description: photo.description || '' });
                      }}
                      className="text-[10px] px-2 py-1 rounded-full bg-white/20 text-white hover:bg-white/40 font-semibold transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(photo._id); }}
                      className="text-[10px] px-2 py-1 rounded-full bg-red-500/70 text-white hover:bg-red-500 font-semibold transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                  {/* Info */}
                  {photo.title && (
                    <p className="text-white text-xs font-medium mt-2 truncate">{photo.title}</p>
                  )}
                  <p className="text-gray-300 text-[10px] mt-0.5">
                    {formatSize(photo.fileSize)} · {new Date(photo.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <p className="text-sm text-mid-grey dark:text-gray-400">Page {page} of {totalPages} · {total} photos</p>
          <div className="flex gap-2">
            <button onClick={() => loadPhotos(page - 1)} disabled={page <= 1} className="btn-outline text-sm px-4 py-1.5 disabled:opacity-40">← Prev</button>
            <button onClick={() => loadPhotos(page + 1)} disabled={page >= totalPages} className="btn-outline text-sm px-4 py-1.5 disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}

      {/* ═══ UPLOAD MODAL ═══ */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => !uploading && setShowUpload(false)}>
          <div className="modal-box max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800">
              <h3 className="font-bold text-dark-grey dark:text-gray-100 text-lg">Upload Photos</h3>
              <button onClick={() => !uploading && setShowUpload(false)} className="text-2xl text-mid-grey dark:text-gray-400 hover:text-dark-grey dark:hover:text-gray-200 leading-none">×</button>
            </div>
            <div className="p-5 space-y-4">
              {/* Drop zone */}
              <div
                className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl p-8 text-center cursor-pointer hover:border-pastel-green transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-pastel-green', 'bg-pastel-green/5'); }}
                onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove('border-pastel-green', 'bg-pastel-green/5'); }}
                onDrop={e => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-pastel-green', 'bg-pastel-green/5');
                  const dt = e.dataTransfer;
                  if (dt.files) {
                    handleFileSelect({ target: { files: dt.files } });
                  }
                }}
              >
                <div className="text-4xl mb-2 opacity-50">📁</div>
                <p className="text-mid-grey dark:text-gray-400 font-medium">Click or drag photos here</p>
                <p className="text-xs text-mid-grey dark:text-gray-500 mt-1">JPEG, PNG, GIF, WebP, BMP, SVG · 20 KB – 1 GB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,image/svg+xml"
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* Preview list */}
              {uploadPreviews.length > 0 && (
                <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                  {uploadPreviews.map((p, i) => (
                    <div key={i} className="flex gap-3 bg-gray-50 dark:bg-slate-800 rounded-xl p-3 items-start">
                      <img src={p.dataUrl} alt="" className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-dark-grey dark:text-gray-200 truncate">{p.name}</p>
                          <button
                            onClick={() => removeUploadFile(i)}
                            className="text-red-500 hover:text-red-700 text-xs font-bold ml-2 flex-shrink-0"
                            disabled={uploading}
                          >
                            ✕
                          </button>
                        </div>
                        <p className="text-[10px] text-mid-grey dark:text-gray-400">{formatSize(p.size)} · {p.type}</p>
                        <input
                          className="input text-xs py-1.5"
                          placeholder="Title (optional)"
                          value={p.title}
                          onChange={e => updatePreviewMeta(i, 'title', e.target.value)}
                          disabled={uploading}
                        />
                        <input
                          className="input text-xs py-1.5"
                          placeholder="Description (optional)"
                          value={p.description}
                          onChange={e => updatePreviewMeta(i, 'description', e.target.value)}
                          disabled={uploading}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload action */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <p className="text-sm text-mid-grey dark:text-gray-400">
                  {uploadPreviews.length} photo(s) ready
                  {uploadPreviews.length > 0 && ` · ${formatSize(uploadPreviews.reduce((acc, p) => acc + p.size, 0))}`}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowUpload(false); setUploadFiles([]); setUploadPreviews([]); }}
                    className="btn-outline text-sm px-4 py-2"
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading || uploadPreviews.length === 0}
                    className="btn-primary text-sm px-6 py-2 disabled:opacity-50"
                  >
                    {uploading ? uploadProgress : `Upload ${uploadPreviews.length} Photo(s)`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ EDIT MODAL ═══ */}
      {editingPhoto && (
        <div className="modal-overlay" onClick={() => setEditingPhoto(null)}>
          <div className="modal-box max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800">
              <h3 className="font-bold text-dark-grey dark:text-gray-100">Edit Photo</h3>
              <button onClick={() => setEditingPhoto(null)} className="text-2xl text-mid-grey dark:text-gray-400">×</button>
            </div>
            <div className="p-5 space-y-4">
              <img
                src={`data:${editingPhoto.mimeType};base64,${editingPhoto.imageData}`}
                alt=""
                className="w-full h-48 object-cover rounded-xl"
              />
              <div>
                <label className="label">Title</label>
                <input className="input" placeholder="Photo title" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows={3} placeholder="Photo description" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditingPhoto(null)} className="btn-outline flex-1">Cancel</button>
                <button onClick={saveEdit} className="btn-primary flex-1">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DELETE CONFIRM ═══ */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-dark-grey dark:text-gray-100 mb-2">Delete Photo?</h3>
              <p className="text-mid-grey dark:text-gray-400 text-sm mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="btn-outline flex-1">Cancel</button>
                <button onClick={() => deletePhoto(deleteConfirm)} className="btn-danger flex-1">Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PREVIEW LIGHTBOX ═══ */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xl"
            onClick={() => setPreviewPhoto(null)}
          >
            ✕
          </button>
          <div className="max-w-[90vw] max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <img
              src={`data:${previewPhoto.mimeType};base64,${previewPhoto.imageData}`}
              alt={previewPhoto.title || ''}
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
            <div className="mt-3 text-center">
              {previewPhoto.title && <p className="text-white font-semibold">{previewPhoto.title}</p>}
              <p className="text-gray-400 text-sm mt-1">
                {formatSize(previewPhoto.fileSize)} · {previewPhoto.mimeType.split('/')[1].toUpperCase()} · {new Date(previewPhoto.createdAt).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
