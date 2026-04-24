import { Link } from 'react-router-dom';

export default function Footer() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-dark-grey text-white pt-14 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="AGS Tutorial" className="h-12 w-12 object-contain rounded-xl bg-white p-1" />
              <div>
                <p className="font-bold text-lg">AGS Tutorial</p>
                <p className="text-gray-400 text-xs">Carving Future – One Student at a Time</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Quality coaching for Nursery to Class 12 in Sonia Vihar, Delhi. Trusted by 500+ families since 2022.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold text-pastel-green mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {['home','about','contact','locate'].map(id => (
                <li key={id}>
                  <button onClick={() => scrollTo(id)} className="text-gray-400 hover:text-white text-sm capitalize transition-colors">
                    {id === 'locate' ? 'Find Us' : id.charAt(0).toUpperCase() + id.slice(1)}
                  </button>
                </li>
              ))}
              <li><Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-pastel-green mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span>📍</span>
                <span>A-353, Gali No 8, Part 2, Pusta 1, Sonia Vihar, Delhi</span>
              </li>
              <li className="flex items-center gap-2">
                <span>📞</span>
                <a href="tel:9839910481" className="hover:text-white transition-colors">9839910481</a>
              </li>
              <li className="flex items-center gap-2">
                <span>✉️</span>
                <a href="mailto:agstutorial050522@gmail.com" className="hover:text-white transition-colors break-all">
                  agstutorial050522@gmail.com
                </a>
              </li>
            </ul>
            {/* Social media placeholders */}
            <div className="flex gap-3 mt-5">
              {[
                { label: 'Facebook', href: '#', icon: 'f' },
                { label: 'Instagram', href: 'https://www.instagram.com/agstutorial/', icon: '📸' },
                { label: 'WhatsApp', href: 'https://wa.me/919839910481', icon: '💬' },
              ].map((s) => (
                <a key={s.label} href={s.href} title={s.label} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-pastel-green hover:text-dark-grey flex items-center justify-center text-sm transition-all duration-200">
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-gray-400 text-xs">© {new Date().getFullYear()} AGS Tutorial. All rights reserved.</p>
          <Link to="/privacy" className="text-gray-400 hover:text-white text-xs transition-colors">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
}
