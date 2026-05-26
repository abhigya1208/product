import { useState, useEffect } from 'react';
import api from '../services/api';
import { MONTH_NAMES } from '../utils/constants';

export default function SalaryPaymentModal({ isOpen, onClose, teacher, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const handlePay = async (e) => {
    e.preventDefault();
    if (!teacher) return;
    setLoading(true);
    try {
      await api.post('/admin/salary/pay', {
        teacherId: teacher._id,
        amount: parseFloat(amount),
        month,
        year,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Salary payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reset fields when opened
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setMonth(new Date().getMonth() + 1);
      setYear(new Date().getFullYear());
    }
  }, [isOpen]);

  return (
    isOpen && (
      <div className="modal-overlay z-50">
        <div className="modal-box max-w-md">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 className="font-bold text-dark-grey">Pay Salary to {teacher?.name}</h3>
            <button onClick={onClose} className="text-2xl text-mid-grey">×</button>
          </div>
          <form onSubmit={handlePay} className="p-5 space-y-4">
            <div>
              <label className="label">Amount (₹)</label>
              <input
                type="number"
                className="input"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Month</label>
                <select className="input" value={month} onChange={e => setMonth(+e.target.value)}>
                  {MONTH_NAMES.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Year</label>
                <input
                  type="number"
                  className="input"
                  value={year}
                  onChange={e => setYear(+e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Processing…' : 'Pay'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  );
}
