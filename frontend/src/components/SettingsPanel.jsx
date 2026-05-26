import { useState } from 'react';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function SettingsPanel() {
  const { theme, setThemeExplicitly } = useTheme();
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
      return setMessage({ type: 'error', text: 'New password must be different from current password.' });
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
    <div className="animate-fade-in space-y-8 max-w-4xl">
      {/* Page Header */}
      <div>
        <h3 className="section-title text-xl">Account Settings</h3>
        <p className="section-subtitle">Customize your visual interface and manage your security settings</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column — Theme Selection */}
        <div className="card h-fit">
          <h4 className="font-bold text-dark-grey dark:text-white text-lg mb-2">🎨 Interface Appearance</h4>
          <p className="text-xs text-mid-grey dark:text-gray-400 mb-6">Choose how the portal looks on your device</p>

          <div className="grid grid-cols-2 gap-4">
            {/* Light Mode Selector */}
            <button
              onClick={() => setThemeExplicitly('light')}
              className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all duration-300 ${
                theme === 'light'
                  ? 'border-pastel-green bg-white shadow-soft font-semibold scale-102 ring-4 ring-pastel-green/20'
                  : 'border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 opacity-70 hover:opacity-100'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center text-2xl shadow-inner">
                ☀️
              </div>
              <div>
                <p className="text-sm text-dark-grey dark:text-gray-200">Light Mode</p>
                <p className="text-[10px] text-mid-grey dark:text-gray-400 mt-0.5">Classic clean look</p>
              </div>
            </button>

            {/* Dark Mode Selector */}
            <button
              onClick={() => setThemeExplicitly('dark')}
              className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all duration-300 ${
                theme === 'dark'
                  ? 'border-pastel-green bg-slate-900 shadow-soft font-semibold scale-102 ring-4 ring-pastel-green/20'
                  : 'border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 opacity-70 hover:opacity-100'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-slate-850 text-indigo-400 flex items-center justify-center text-2xl shadow-inner border border-slate-700">
                🌙
              </div>
              <div>
                <p className="text-sm text-dark-grey dark:text-gray-200">Dark Mode</p>
                <p className="text-[10px] text-mid-grey dark:text-gray-400 mt-0.5">Easy on the eyes</p>
              </div>
            </button>
          </div>
        </div>

        {/* Right Column — Password Change */}
        <div className="card">
          <h4 className="font-bold text-dark-grey dark:text-white text-lg mb-2">🔒 Security & Password</h4>
          <p className="text-xs text-mid-grey dark:text-gray-400 mb-6">Change your portal access password regularly</p>

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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mid-grey hover:text-dark-grey text-sm dark:hover:text-gray-200"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mid-grey hover:text-dark-grey text-sm dark:hover:text-gray-200"
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
                placeholder="Confirm your new password"
              />
            </div>

            {/* Status message */}
            {message.text && (
              <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
                message.type === 'success'
                  ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900'
                  : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900'
              }`}>
                {message.type === 'success' ? '✅ ' : '❌ '}{message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
            >
              {loading ? 'Changing Password…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
