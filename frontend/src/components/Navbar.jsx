import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginDropOpen, setLoginDropOpen] = useState(false);
  const dropRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setLoginDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const goLogin = (role) => {
    setLoginDropOpen(false);
    setMenuOpen(false);
    navigate('/login', { state: { role } });
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-card' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="AGS Tutorial Logo" className="h-10 w-10 object-contain rounded-full" />
            <span className="font-bold text-lg text-dark-grey hidden sm:block">AGS Tutorial</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollTo('home')} className="text-dark-grey hover:text-pastel-green-dark font-medium transition-colors">Home</button>
            <button onClick={() => scrollTo('about')} className="text-dark-grey hover:text-pastel-green-dark font-medium transition-colors">About</button>
            <button onClick={() => scrollTo('contact')} className="text-dark-grey hover:text-pastel-green-dark font-medium transition-colors">Contact</button>

            {/* Login Dropdown */}
            <div className="relative" ref={dropRef}>
              <button
                id="login-dropdown-btn"
                onClick={() => setLoginDropOpen(!loginDropOpen)}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                Login Yourself
                <svg className={`w-4 h-4 transition-transform ${loginDropOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {loginDropOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden animate-slide-up">
                  {[['student','Student Login','👨‍🎓'],['teacher','Teacher Login','👩‍🏫'],['admin','Admin Login','🔐']].map(([role, label, icon]) => (
                    <button key={role} id={`login-${role}`} onClick={() => goLogin(role)}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-pastel-green/20 transition-colors text-sm text-dark-grey">
                      <span>{icon}</span>{label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile hamburger */}
          <button id="mobile-menu-btn" className="md:hidden p-2 rounded-lg hover:bg-pastel-green/20" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-6 h-6 text-dark-grey" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-white rounded-2xl shadow-card mb-2 p-4 animate-slide-up border border-gray-100">
            {['home','about','contact'].map(id => (
              <button key={id} onClick={() => scrollTo(id)}
                className="block w-full text-left px-4 py-3 rounded-xl hover:bg-pastel-green/20 font-medium text-dark-grey capitalize">
                {id}
              </button>
            ))}
            <div className="mt-2 border-t border-gray-100 pt-2">
              {[['student','👨‍🎓 Student Login'],['teacher','👩‍🏫 Teacher Login'],['admin','🔐 Admin Login']].map(([role, label]) => (
                <button key={role} onClick={() => goLogin(role)}
                  className="block w-full text-left px-4 py-3 rounded-xl hover:bg-pastel-green/20 text-sm text-dark-grey">
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
