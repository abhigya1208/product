import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Counter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const duration = 1500;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function HeroSection() {
  const navigate = useNavigate();

  const stats = [
    { value: 500, suffix: '+', label: 'Students Enrolled' },
    { value: 4,   suffix: '+', label: 'Years of Excellence' },
    { value: 5,   suffix: '',  label: 'Expert Teachers' },
    { value: 98,  suffix: '%', label: 'Success Rate' },
  ];

  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 bg-gradient-to-br from-pastel-green/30 via-cream to-pastel-peach/30" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-pastel-green/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-64 h-64 bg-pastel-peach/30 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — text */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-pastel-green/40 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-dark-grey">Admissions Open 2026–27</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-dark-grey leading-tight mb-6">
              Carving Future –<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-500">
                One Student
              </span>{' '}
              at a Time
            </h1>
            <p className="text-lg text-mid-grey mb-8 max-w-md">
              AGS Tutorial provides quality education from Nursery to Class 12 in a nurturing, caring environment. 
              <span className="block mt-2 font-semibold text-green-600">100% passing result for board students since opening (2022)</span>
            </p>
            <div className="flex flex-wrap gap-4">
              <button id="hero-enroll-btn" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-primary text-base px-8 py-3">
                Enquire Now
              </button>
              <button id="hero-login-btn" onClick={() => navigate('/login')}
                className="btn-outline text-base px-8 py-3">
                Login Portal
              </button>
            </div>
          </div>

          {/* Right — logo + card */}
          <div className="flex flex-col items-center animate-fade-in">
            <div className="relative">
              <div className="w-56 h-56 bg-white rounded-3xl shadow-card flex items-center justify-center border-4 border-pastel-green/40">
                <img src="/logo.png" alt="AGS Tutorial" className="w-44 h-44 object-contain" />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-pastel-peach rounded-2xl px-4 py-2 shadow-card">
                <p className="text-xs font-semibold text-dark-grey">Est. 2022</p>
              </div>
              <div className="absolute -top-4 -left-4 bg-white rounded-2xl px-4 py-2 shadow-card">
                <p className="text-xs font-semibold text-green-600">✓ Trusted by 500+ Families</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="card text-center hover:shadow-card transition-all hover:-translate-y-1">
              <p className="text-3xl font-extrabold text-dark-grey mb-1">
                <Counter target={s.value} suffix={s.suffix} />
              </p>
              <p className="text-sm text-mid-grey font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
