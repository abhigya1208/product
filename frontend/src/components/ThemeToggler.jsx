import { useTheme } from '../context/ThemeContext';

export default function ThemeToggler({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`relative w-10 h-10 rounded-xl bg-pastel-peach/30 dark:bg-slate-800 border border-pastel-peach/40 dark:border-slate-700 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 shadow-soft hover:shadow-card group overflow-hidden ${className}`}
      aria-label="Toggle Theme"
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
    >
      {/* Background slide hover effect */}
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-pastel-green to-pastel-peach opacity-0 group-hover:opacity-10 transition-opacity duration-300" />

      {/* Sun Icon (visible in dark mode) */}
      <svg
        className={`w-5 h-5 text-amber-400 absolute transition-all duration-500 transform ${
          isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-90 opacity-0'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
        />
      </svg>

      {/* Moon Icon (visible in light mode) */}
      <svg
        className={`w-5 h-5 text-slate-700 dark:text-gray-300 absolute transition-all duration-500 transform ${
          isDark ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    </button>
  );
}
