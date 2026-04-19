import { useState, useEffect } from 'react';
import api from '../services/api';

export default function AnnouncementsPanel({ canCreate = false }) {
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/announcements');
      setAnnouncements(res.data.announcements);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) return;
    setLoading(true);
    try {
      await api.post('/announcements', form);
      setForm({ title: '', content: '' });
      setShowForm(false);
      load();
    } catch (err) { alert(err.response?.data?.message || 'Failed to post'); }
    finally { setLoading(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    await api.delete(`/announcements/${id}`);
    setAnnouncements(a => a.filter(x => x._id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="section-title text-xl">Announcements</h3>
          <p className="section-subtitle">{announcements.length} announcements</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowForm(s => !s)} className="btn-primary text-sm px-4 py-2">
            {showForm ? '✕ Cancel' : '+ New Announcement'}
          </button>
        )}
      </div>

      {/* Create form */}
      {canCreate && showForm && (
        <form onSubmit={create} className="card mb-5 space-y-3">
          <div><label className="label">Title</label>
            <input className="input" placeholder="Announcement title" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
          <div><label className="label">Content</label>
            <textarea className="input resize-none" rows={4} placeholder="Announcement details…"
              value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required /></div>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Posting…' : 'Post Announcement'}</button>
        </form>
      )}

      {/* List */}
      {announcements.length === 0 ? (
        <div className="text-center py-12 text-mid-grey">No announcements yet.</div>
      ) : (
        <div className="space-y-4">
          {announcements.map(a => (
            <div key={a._id} className="card border-l-4 border-pastel-green animate-fade-in">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-dark-grey text-base mb-1">{a.title}</h4>
                  <p className="text-mid-grey text-sm leading-relaxed">{a.content}</p>
                  <p className="text-xs text-mid-grey mt-2">
                    By {a.createdBy?.name || 'Admin'} ({a.createdByRole}) · {new Date(a.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                {canCreate && (
                  <button onClick={() => remove(a._id)} className="btn-danger text-xs px-3 py-1.5 flex-shrink-0">Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
