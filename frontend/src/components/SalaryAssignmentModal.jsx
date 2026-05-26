import { useState } from 'react';
import api from '../services/api';
import { CLASSES } from '../utils/constants';

export default function SalaryAssignmentModal({ isOpen, onClose, onSuccess }) {
  const [teacherId, setTeacherId] = useState('');
  const [classId, setClassId] = useState('');
  const [subject, setSubject] = useState('');
  const [session, setSession] = useState('2026-27');
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);

  // Load teachers on mount
  const loadTeachers = async () => {
    try {
      const res = await api.get('/admin/teachers');
      setTeachers(res.data.teachers);
    } catch (e) {
      console.error('Load teachers error', e);
    }
  };

  // Load teachers when modal opens
  if (isOpen && teachers.length === 0) {
    loadTeachers();
  }

  const handleAssign = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/teachers/assign', { teacherId, classId, subject, session });
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Assign error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    isOpen && (
      <div className="modal-overlay z-50">
        <div className="modal-box max-w-md">
          <h3 className="font-bold text-lg mb-4">Assign Class to Teacher</h3>
          <form onSubmit={handleAssign} className="space-y-4">
            <div>
              <label className="label">Teacher</label>
              <select className="input" value={teacherId} onChange={e => setTeacherId(e.target.value)} required>
                <option value="">Select Teacher</option>
                {teachers.map(t => (
                  <option key={t._id} value={t._id}>{t.name} ({t.username})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Class</label>
              <select className="input" value={classId} onChange={e => setClassId(e.target.value)} required>
                <option value="">Select Class</option>
                {CLASSES.map(c => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Subject (optional)</label>
              <input className="input" type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" />
            </div>
            <div>
              <label className="label">Session</label>
              <input className="input" type="text" value={session} onChange={e => setSession(e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving…' : 'Assign'}</button>
            </div>
          </form>
        </div>
      </div>
    )
  );
}
