import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleConfig = {
  admin:   { label: 'Admin',   icon: '🔐', color: 'border-purple-300 bg-purple-50 dark:border-purple-900/50 dark:bg-purple-950/20',   activeColor: 'border-purple-500 bg-purple-100 dark:border-purple-400 dark:bg-purple-900/30' },
  teacher: { label: 'Teacher', icon: '👩‍🏫', color: 'border-blue-300 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/20',   activeColor: 'border-blue-500 bg-blue-100 dark:border-blue-400 dark:bg-blue-900/30' },
  student: { label: 'Student', icon: '👨‍🎓', color: 'border-green-300 bg-green-50 dark:border-green-900/50 dark:bg-green-950/20', activeColor: 'border-green-500 bg-green-100 dark:border-green-400 dark:bg-green-900/30' },
};

export default function LoginPage() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { login, user } = useAuth();

  const [role, setRole]         = useState(location.state?.role || 'student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin')   navigate('/admin',   { replace: true });
      if (user.role === 'teacher') navigate('/teacher', { replace: true });
      if (user.role === 'student') navigate('/student', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login(username.trim(), password, role);
      if (loggedUser.role === 'admin')   navigate('/admin',   { replace: true });
      if (loggedUser.role === 'teacher') navigate('/teacher', { replace: true });
      if (loggedUser.role === 'student') navigate('/student', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-green/30 via-cream to-pastel-peach/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      {/* Back link */}
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-dark-grey dark:text-gray-300 hover:text-pastel-green-dark dark:hover:text-pastel-green transition-colors font-medium text-sm">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Home
      </Link>

      <div className="w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="AGS Tutorial" className="h-16 w-16 object-contain mx-auto mb-4 rounded-2xl shadow-card dark:shadow-none" />
          <h1 className="text-2xl font-extrabold text-dark-grey dark:text-white">AGS Tutorial Portal</h1>
          <p className="text-mid-grey dark:text-gray-400 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="card">
          {/* Role selector */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {Object.entries(roleConfig).map(([rKey, rVal]) => (
              <button key={rKey} id={`role-${rKey}`}
                onClick={() => { setRole(rKey); setError(''); }}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all duration-200 ${role === rKey ? rVal.activeColor : 'border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700'}`}>
                <span className="text-2xl">{rVal.icon}</span>
                <span className="text-xs font-semibold text-dark-grey dark:text-gray-200">{rVal.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">
                {role === 'student' ? 'Roll Number (Username)' : 'Username'}
              </label>
              <input id="login-username" className="input" placeholder={role === 'student' ? 'Your roll number' : 'Username'} required
                value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input id="login-password" className="input pr-12" type={showPwd ? 'text' : 'password'}
                  placeholder="Enter password" required
                  value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mid-grey dark:text-gray-400 hover:text-dark-grey dark:hover:text-gray-200">
                  {showPwd ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {role === 'student' && (
              <p className="text-xs text-mid-grey dark:text-gray-300 bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 border border-blue-100 dark:border-blue-900/50">
                💡 Your username is your Roll Number and your default password is: <strong>ParentFirstName@ags</strong>
              </p>
            )}

            {error && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 rounded-xl p-3 text-sm">
                <span>⚠️</span> {error}
              </div>
            )}

            <button id="login-submit-btn" type="submit" disabled={loading}
              className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2">
              {loading ? (
                <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg> Signing in…</>
              ) : `Sign In as ${roleConfig[role].label}`}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-mid-grey dark:text-gray-500 mt-6">
          © {new Date().getFullYear()} AGS Tutorial · <Link to="/privacy" className="underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
