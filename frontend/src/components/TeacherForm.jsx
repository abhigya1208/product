import { useState } from 'react';

export default function TeacherForm({ initial = null, onSubmit, onClose }) {
  const [form, setForm] = useState({
    name: '', username: '', password: '', email: '', phone: '', ...initial
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.username.trim()) return setError('Name and username are required.');
    if (!initial?._id && !form.password.trim()) return setError('Password is required for new teachers.');
    setLoading(true); setError('');
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-dark-grey">{initial?._id ? 'Edit Teacher' : 'Add New Teacher'}</h2>
          <button onClick={onClose} className="text-mid-grey hover:text-dark-grey text-2xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className="label">Full Name *</label>
            <input className="input" placeholder="Teacher's full name" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Username *</label>
              <input className="input" placeholder="Login username" value={form.username} onChange={e => set('username', e.target.value)} required disabled={!!initial?._id}/>
              {initial?._id && <p className="text-xs text-mid-grey mt-1">Username cannot be changed</p>}
            </div>
            <div><label className="label">{initial?._id ? 'New Password (leave blank to keep)' : 'Password *'}</label>
              <input className="input" type="password" placeholder={initial?._id ? 'Leave blank to keep' : 'Set password'}
                value={form.password} onChange={e => set('password', e.target.value)} required={!initial?._id} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Email</label>
              <input className="input" type="email" placeholder="email@example.com" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div><label className="label">Phone</label>
              <input className="input" placeholder="Contact number" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
          </div>
          {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving…' : (initial?._id ? 'Update Teacher' : 'Add Teacher')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
