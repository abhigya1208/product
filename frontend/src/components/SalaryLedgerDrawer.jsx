import { useState, useEffect } from 'react';
import api from '../services/api';
import { MONTH_NAMES } from '../utils/constants';

export default function SalaryLedgerDrawer({ isOpen, onCloseDrawer, teacher }) {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadLedger = async () => {
    if (!teacher) return;
    setLoading(true);
    try {
      const res = await api.get('/admin/salary/ledger', { params: { teacherId: teacher._id } });
      setLedger(res.data.ledger || []);
    } catch (err) {
      console.error('Load ledger error:', err);
    } finally {
      setLoading(false);
    }
  };

  // load when drawer opens or teacher changes
  useEffect(() => {
    if (isOpen && teacher) loadLedger();
  }, [isOpen, teacher]);

  return (
    isOpen && (
      <div className="fixed inset-0 flex justify-end z-50">
        <div className="w-full max-w-md bg-white h-full shadow-xl overflow-y-auto animate-slide-left">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 className="font-bold text-dark-grey">Salary Ledger - {teacher?.name}</h3>
            <button onClick={onCloseDrawer} className="text-2xl text-mid-grey">×</button>
          </div>
          <div className="p-5">
            {loading ? (
              <p className="text-mid-grey">Loading ledger...</p>
            ) : (
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr>
                    {['Month', 'Year', 'Amount (₹)', 'Status'].map(h => (
                      <th key={h} className="table-th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="table-td">{MONTH_NAMES[entry.month - 1] || entry.month}</td>
                      <td className="table-td">{entry.year}</td>
                      <td className="table-td font-bold">₹{entry.amount?.toLocaleString()}</td>
                      <td className="table-td">
                        {entry.status === 'paid' ? (
                          <span className="badge-green">Paid</span>
                        ) : (
                          <span className="badge-yellow">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {ledger.length === 0 && (
                    <tr><td colSpan={4} className="table-td text-center text-mid-grey py-8">No ledger entries.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
        {/* backdrop */}
        <div className="fixed inset-0 bg-black/40" onClick={onCloseDrawer}></div>
      </div>
    )
  );
}
