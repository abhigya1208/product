import { useState } from 'react';
import api from '../services/api';

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      await api.post('/contact', form);
      setStatus('success');
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.message || 'Failed to send message. Please try again.');
    }
  };

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-14 items-start">
          {/* Left info */}
          <div>
            <span className="inline-block bg-pastel-green/50 text-dark-grey text-sm font-semibold px-4 py-1.5 rounded-full mb-4">Get In Touch</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-dark-grey mb-5">Contact Us</h2>
            <p className="text-mid-grey mb-8">Have a question or want to enrol your child? We'd love to hear from you. Fill in the form and we'll get back to you shortly.</p>
            <div className="flex flex-col gap-5">
              {[
                { icon: '📍', title: 'Address', value: 'A-353, Gali No 8, Part 2, Pusta 1, Sonia Vihar, Delhi' },
                { icon: '📞', title: 'Phone', value: '9839910481' },
                { icon: '✉️', title: 'Email', value: 'agstutorial050522@gmail.com' },
                { icon: '⏰', title: 'Timings', value: 'Mon–Sat: 7:00 AM – 8:00 PM' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="text-2xl w-10 flex-shrink-0">{item.icon}</div>
                  <div>
                    <p className="font-semibold text-dark-grey text-sm">{item.title}</p>
                    <p className="text-mid-grey text-sm">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right form */}
          <div className="card">
            {status === 'success' ? (
              <div className="py-8 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-dark-grey mb-2">Message Sent!</h3>
                <p className="text-mid-grey mb-6">Thank you for reaching out. We'll contact you within 24 hours.</p>
                <button onClick={() => setStatus('idle')} className="btn-primary">Send Another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Name *</label>
                    <input id="contact-name" className="input" placeholder="Your name" required
                      value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input id="contact-phone" className="input" placeholder="Mobile number"
                      value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input id="contact-email" type="email" className="input" placeholder="your@email.com" required
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="label">Message *</label>
                  <textarea id="contact-message" className="input resize-none" rows={5} placeholder="Tell us how we can help…" required
                    value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button id="contact-submit-btn" type="submit" className="btn-primary w-full" disabled={status === 'loading'}>
                  {status === 'loading' ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Sending…
                    </span>
                  ) : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
