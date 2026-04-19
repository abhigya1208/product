import { useState } from 'react';
import api from '../services/api';

export default function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      return setMessage({ type: 'error', text: 'All fields are required.' });
    }
    if (form.newPassword.length < 4) {
      return setMessage({ type: 'error', text: 'New password must be at least 4 characters.' });
    }
    if (form.newPassword !== form.confirmPassword) {
      return setMessage({ type: 'error', text: 'New password and confirm password do not match.' });
    }
    if (form.currentPassword === form.newPassword) {
      return setMessage({ type: 'error', text: 'New password must be different from the current password.' });
    }

    setLoading(true);
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });
      setMessage({ type: 'success', text: res.data.message || 'Password changed successfully!' });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-md">
      <div className="mb-5">
        <h3 className="section-title text-xl">Change Password</h3>
        <p className="section-subtitle">Update your account password securely</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="label">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                name="currentPassword"
                value={form.currentPassword}
                onChange={handleChange}
                className="input pr-10"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mid-grey hover:text-dark-grey text-sm"
              >
                {showCurrent ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                className="input pr-10"
                placeholder="Enter new password (min 4 chars)"
              />
              <button
                type="button"
                onClick={() => setShowNew(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mid-grey hover:text-dark-grey text-sm"
              >
                {showNew ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              className="input"
              placeholder="Re-enter new password"
            />
          </div>

          {/* Status message */}
          {message.text && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.type === 'success' ? '✅ ' : '❌ '}{message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-sm"
          >
            {loading ? 'Changing Password…' : '🔒 Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
