import { useState, useEffect } from 'react';
import { CLASSES, SECTION_B_CLASSES } from '../utils/constants';

export default function StudentForm({ initial = null, onSubmit, onClose }) {
  const [form, setForm] = useState({
    name: '', fatherName: '', motherName: '', phone: '',
    studentClass: '', section: 'A', admissionDate: new Date().toISOString().split('T')[0], ...initial
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const canHaveSectionB = SECTION_B_CLASSES.includes(form.studentClass);

  useEffect(() => {
    if (!canHaveSectionB) set('section', 'A');
  }, [form.studentClass]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Name is required.');
    if (!form.studentClass) return setError('Class is required.');
    if (!form.fatherName.trim() && !form.motherName.trim()) return setError('At least one parent name is required.');
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
          <h2 className="text-lg font-bold text-dark-grey">{initial?._id ? 'Edit Student' : 'Add New Student'}</h2>
          <button onClick={onClose} className="text-mid-grey hover:text-dark-grey text-2xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className="label">Full Name *</label>
            <input className="input" placeholder="Student's full name" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Father's Name</label>
              <input className="input" placeholder="Father's first name" value={form.fatherName} onChange={e => set('fatherName', e.target.value)} /></div>
            <div><label className="label">Mother's Name</label>
              <input className="input" placeholder="Mother's first name" value={form.motherName} onChange={e => set('motherName', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Phone</label>
              <input className="input" placeholder="Contact number" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div><label className="label">Admission Date</label>
              <input type="date" className="input" value={form.admissionDate} onChange={e => set('admissionDate', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Class *</label>
              <select className="input" value={form.studentClass} onChange={e => set('studentClass', e.target.value)} required>
                <option value="">Select class</option>
                {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select></div>
            <div><label className="label">Section</label>
              <select className="input" value={form.section} onChange={e => set('section', e.target.value)} disabled={!canHaveSectionB}>
                <option value="A">Section A</option>
                {canHaveSectionB && <option value="B">Section B</option>}
              </select>
              {!canHaveSectionB && <p className="text-xs text-mid-grey mt-1">Section B: Classes 4–8 only</p>}
            </div>
          </div>
          {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving…' : (initial?._id ? 'Update Student' : 'Add Student')}
            </button>
          </div>
          {!initial?._id && (
            <p className="text-xs text-mid-grey text-center bg-blue-50 p-3 rounded-xl">
              💡 Roll number, username & password will be auto-generated and shown after adding.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
