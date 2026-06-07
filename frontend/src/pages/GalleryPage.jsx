import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';

export default function GalleryPage() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const observerRef = useRef(null);

  const loadPhotos = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      const res = await api.get('/gallery/public', { params: { page: p, limit: 24 } });
      if (p === 1) {
        setPhotos(res.data.photos);
      } else {
        setPhotos(prev => [...prev, ...res.data.photos]);
      }
      setHasMore(p < res.data.pages);
      setPage(p);
    } catch (err) {
      console.error('Load gallery error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPhotos(1); }, [loadPhotos]);

  // Infinite scroll observer
  const lastPhotoRef = useCallback(node => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadPhotos(page + 1);
      }
    });
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore, page, loadPhotos]);

  // Keyboard navigation in lightbox
  useEffect(() => {
    if (selectedPhoto === null) return;
    const handler = (e) => {
      if (e.key === 'Escape') { setSelectedPhoto(null); setSelectedIndex(-1); }
      if (e.key === 'ArrowRight' && selectedIndex < photos.length - 1) {
        setSelectedIndex(i => i + 1);
        setSelectedPhoto(photos[selectedIndex + 1]);
      }
      if (e.key === 'ArrowLeft' && selectedIndex > 0) {
        setSelectedIndex(i => i - 1);
        setSelectedPhoto(photos[selectedIndex - 1]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedPhoto, selectedIndex, photos]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (selectedPhoto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedPhoto]);

  const openLightbox = (photo, index) => {
    setSelectedPhoto(photo);
    setSelectedIndex(index);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-slate-950">
      <Navbar />

      {/* Hero banner */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pastel-green/20 via-cream to-pastel-peach/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
        <div className="absolute top-10 right-20 w-60 h-60 bg-pastel-green/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-pastel-peach/20 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-pastel-green/40 dark:bg-green-950/20 rounded-full px-4 py-1.5 mb-4">
            <span className="text-lg">📸</span>
            <span className="text-sm font-medium text-dark-grey dark:text-gray-200">Our Memories</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-dark-grey dark:text-white mb-4">
            Photo{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-500 dark:from-green-400 dark:to-teal-400">
              Gallery
            </span>
          </h1>
          <p className="text-lg text-mid-grey dark:text-gray-400 max-w-2xl mx-auto">
            Glimpses of life at AGS Tutorial — events, celebrations, classroom moments, and more.
          </p>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {photos.length === 0 && !loading ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4 opacity-40">📷</div>
              <h3 className="text-xl font-bold text-dark-grey dark:text-gray-200 mb-2">No photos yet</h3>
              <p className="text-mid-grey dark:text-gray-400">Check back soon — we're curating our best moments!</p>
            </div>
          ) : (
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
              {photos.map((photo, index) => {
                const isLast = index === photos.length - 1;
                return (
                  <div
                    key={photo._id}
                    ref={isLast ? lastPhotoRef : null}
                    className="break-inside-avoid group relative cursor-pointer rounded-2xl overflow-hidden shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1"
                    onClick={() => openLightbox(photo, index)}
                  >
                    <img
                      src={`data:${photo.mimeType};base64,${photo.imageData}`}
                      alt={photo.title || 'Gallery photo'}
                      className="w-full h-auto object-cover block transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      {photo.title && (
                        <p className="text-white font-semibold text-sm truncate">{photo.title}</p>
                      )}
                      {photo.isPinned && (
                        <span className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow">📌 Pinned</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Loading Spinner */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-pastel-green border-t-transparent"></div>
                <span className="text-mid-grey dark:text-gray-400 font-medium">Loading photos…</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => { setSelectedPhoto(null); setSelectedIndex(-1); }}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xl transition-colors"
            onClick={(e) => { e.stopPropagation(); setSelectedPhoto(null); setSelectedIndex(-1); }}
          >
            ✕
          </button>

          {/* Nav arrows */}
          {selectedIndex > 0 && (
            <button
              className="absolute left-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-2xl transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(i => i - 1);
                setSelectedPhoto(photos[selectedIndex - 1]);
              }}
            >
              ‹
            </button>
          )}
          {selectedIndex < photos.length - 1 && (
            <button
              className="absolute right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-2xl transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(i => i + 1);
                setSelectedPhoto(photos[selectedIndex + 1]);
              }}
            >
              ›
            </button>
          )}

          {/* Image */}
          <div
            className="max-w-[90vw] max-h-[85vh] relative animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`data:${selectedPhoto.mimeType};base64,${selectedPhoto.imageData}`}
              alt={selectedPhoto.title || 'Gallery photo'}
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
            {/* Photo info bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent rounded-b-xl p-4">
              <div className="flex items-end justify-between">
                <div>
                  {selectedPhoto.title && (
                    <p className="text-white font-semibold text-lg">{selectedPhoto.title}</p>
                  )}
                  {selectedPhoto.description && (
                    <p className="text-gray-300 text-sm mt-1">{selectedPhoto.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 text-gray-400 text-xs">
                  <span>{formatSize(selectedPhoto.fileSize)}</span>
                  <span>{new Date(selectedPhoto.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="text-white/50">{selectedIndex + 1} / {photos.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
