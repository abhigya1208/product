import { useState, useEffect } from 'react';
import { MONTH_NAMES, FEE_STRUCTURE } from '../utils/constants';
import api from '../services/api';
import { downloadReceipt } from '../utils/pdf';

export default function PaymentModal({ student, onClose, onSuccess }) {
  const now = new Date();
  const [mode, setMode]         = useState('current'); // current | advance
  const [month, setMonth]       = useState(now.getMonth() + 1);
  const [year, setYear]         = useState(now.getFullYear());
  const [fee, setFee]           = useState(0);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [razorReady, setRazorReady] = useState(false);

  // Advance month config
  const advMonth = month === 12 ? 1 : month + 1;
  const advYear  = month === 12 ? year + 1 : year;

  const selectedMonth = mode === 'advance' ? advMonth : month;
  const selectedYear  = mode === 'advance' ? advYear  : year;

  // Load Razorpay script
  useEffect(() => {
    if (document.getElementById('razorpay-script')) { setRazorReady(true); return; }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setRazorReady(true);
    document.body.appendChild(script);
  }, []);

  // Fetch fee amount for chosen month
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/student/fee-amount', { params: { month: selectedMonth, year: selectedYear } });
        setFee(res.data.fee);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load fee amount.');
        setFee(0);
      }
    };
    if (student) load();
  }, [student, selectedMonth, selectedYear]);

  const handlePay = async () => {
    if (!student || fee === 0) return;
    setLoading(true); setError('');
    try {
      // Get Razorpay key
      const keyRes = await api.get('/payments/razorpay-key');
      if (!keyRes.data.configured) {
        setError('Online payments are not configured yet. Please contact admin or pay offline.');
        setLoading(false); return;
      }

      // Create order
      const orderRes = await api.post('/payments/create-order', {
        studentId: student._id,
        months: [{ month: selectedMonth, year: selectedYear }]
      });

      const { orderId, amount, currency, key } = orderRes.data;

      const options = {
        key,
        amount: amount * 100,
        currency,
        name: 'AGS Tutorial',
        description: `Fee for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`,
        image: '/logo.png',
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/payments/verify', {
              ...response,
              studentId: student._id,
              months: [{ month: selectedMonth, year: selectedYear }]
            });
            const payment = verifyRes.data.payments[0];
            // Download receipt
            downloadReceipt({ ...payment, _id: payment._id, paidAt: new Date() }, student);
            onSuccess();
            onClose();
          } catch (verErr) {
            setError(verErr.response?.data?.message || 'Payment verification failed.');
          }
        },
        prefill: { name: student.name, contact: student.phone || '' },
        theme: { color: '#A8E6CF' },
        modal: { ondismiss: () => setLoading(false) }
      };

      if (!window.Razorpay) { setError('Razorpay failed to load. Check internet connection.'); setLoading(false); return; }
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Payment initiation failed.');
    } finally { setLoading(false); }
  };

  if (!student) return null;
  const defaultFee = FEE_STRUCTURE[student.studentClass] || 0;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-sm">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-dark-grey">Pay Fee</h2>
          <button onClick={onClose} className="text-mid-grey hover:text-dark-grey text-2xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-5">
          {/* Student info */}
          <div className="bg-pastel-green/20 rounded-xl p-4">
            <p className="font-semibold text-dark-grey">{student.name}</p>
            <p className="text-sm text-mid-grey">Roll: {student.rollNumber} · Class {student.studentClass}</p>
          </div>

          {/* Month mode tabs */}
          <div>
            <label className="label mb-2">Payment Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[['current', 'Current Month'], ['advance', 'Advance (Next Month)']].map(([m, l]) => (
                <button key={m} onClick={() => setMode(m)}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${mode === m ? 'border-pastel-green bg-pastel-green/20 text-dark-grey' : 'border-gray-200 hover:border-gray-300'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Month display */}
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-sm text-mid-grey mb-1">Paying for</p>
            <p className="text-xl font-bold text-dark-grey">{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</p>
          </div>

          {/* Fee amount */}
          <div className="flex items-center justify-between bg-pastel-peach/30 rounded-xl p-4">
            <div>
              <p className="text-sm text-mid-grey">Amount Due</p>
              {student.discount > 0 && <p className="text-xs text-green-600">Discount applied: ₹{student.discount}</p>}
            </div>
            <p className="text-2xl font-extrabold text-dark-grey">₹{fee || defaultFee}</p>
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}

          {!razorReady && <p className="text-xs text-mid-grey text-center">Loading payment gateway…</p>}

          <button onClick={handlePay} disabled={loading || !razorReady || !!error}
            className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? (
              <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>Processing…</>
            ) : `Pay ₹${fee || defaultFee} via Razorpay`}
          </button>
          <p className="text-xs text-center text-mid-grey">🔒 Secured by Razorpay · UPI, Cards, Net Banking accepted</p>
        </div>
      </div>
    </div>
  );
}
