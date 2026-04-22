import { useState, useEffect } from 'react';
import api from '../services/api';

export default function FeedbackSection() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', rating: 5, message: '' });
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    loadApprovedFeedback();
  }, []);

  const loadApprovedFeedback = async () => {
    try {
      const res = await api.get('/feedback/approved');
      setFeedbacks(res.data.feedbacks);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await api.post('/feedback', form);
      setStatus('success');
      setTimeout(() => {
        setShowModal(false);
        setStatus('idle');
        setForm({ name: '', rating: 5, message: '' });
      }, 3000);
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <section id="feedback" className="py-20 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12">
          <div>
            <span className="inline-block bg-pastel-yellow/50 text-dark-grey text-sm font-semibold px-4 py-1.5 rounded-full mb-4">Testimonials</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-dark-grey">What Parents & Students Say</h2>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-secondary mt-6 md:mt-0 shadow-sm">
            Leave Feedback
          </button>
        </div>

        {feedbacks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {feedbacks.map(f => (
              <div key={f._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="flex text-yellow-500 mb-4 text-sm">
                    {Array.from({length: 5}).map((_, i) => (
                      <span key={i} className={i < f.rating ? 'opacity-100' : 'opacity-30'}>★</span>
                    ))}
                  </div>
                  <p className="text-dark-grey italic text-sm mb-6 leading-relaxed">"{f.message}"</p>
                </div>
                <p className="font-bold text-dark-grey text-sm">— {f.name || 'Anonymous'}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-mid-grey">
            No feedback entries available yet. 
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay z-50">
          <div className="modal-box max-w-md w-full">
            {status === 'success' ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-dark-grey mb-2">Feedback Submitted!</h3>
                <p className="text-mid-grey text-sm">Thank you. Your feedback has been sent for review.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3 className="text-xl font-bold text-dark-grey mb-6">Leave Feedback</h3>
                
                <div className="mb-4">
                  <label className="label">Your Name (optional)</label>
                  <input className="input" placeholder="Anonymous" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                
                <div className="mb-4">
                  <label className="label">Rating</label>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(star => (
                      <button 
                        key={star} type="button" 
                        onClick={() => setForm({...form, rating: star})}
                        className={`text-3xl ${star <= form.rating ? 'text-yellow-500' : 'text-gray-200'} hover:scale-110 transition`}
                      >★</button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="label">Your Feedback *</label>
                  <textarea required rows={4} className="input resize-none" placeholder="Tell us about your experience..." value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1">Cancel</button>
                  <button type="submit" disabled={status==='loading'} className="btn-primary flex-1">Submit</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
