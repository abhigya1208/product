import { MONTH_NAMES, FEE_STRUCTURE } from '../utils/constants';
import { downloadReceipt } from '../utils/pdf';
import api from '../services/api';

export default function FeeTable({ student, feeStatus = [], onPayNow, showPayButton = false }) {
  if (!student || !feeStatus.length) {
    return <p className="text-mid-grey text-sm text-center py-8">No fee records found.</p>;
  }

  const handleDownload = async (paymentId) => {
    try {
      const res = await api.get(`/payments/${paymentId}/receipt`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url;
      a.download = `receipt_${paymentId}.pdf`; a.click();
    } catch (e) {
      // fallback: generate client-side
      const status = feeStatus.find(f => f.paymentId === paymentId);
      downloadReceipt({ _id: paymentId, month: status?.month, year: status?.year, amount: status?.amount, type: status?.type, paidAt: status?.paidAt }, student);
    }
  };

  const totalDue = feeStatus.filter(f => !f.paid).reduce((s, f) => s + f.fee, 0);
  const totalPaid = feeStatus.filter(f => f.paid).reduce((s, f) => s + f.amount, 0);

  return (
    <div>
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total Months', value: feeStatus.length, color: 'bg-blue-50 text-blue-700' },
          { label: 'Paid', value: feeStatus.filter(f => f.paid).length, color: 'bg-green-50 text-green-700' },
          { label: 'Pending', value: feeStatus.filter(f => !f.paid).length, color: 'bg-red-50 text-red-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`${color} rounded-xl p-3 text-center`}>
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Total dues */}
      {totalDue > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-5 flex justify-between items-center">
          <div>
            <p className="text-sm font-semibold text-red-700">Total Pending Amount</p>
            <p className="text-xs text-red-500 mt-0.5">Please clear dues at the earliest</p>
          </div>
          <p className="text-2xl font-extrabold text-red-700">₹{totalDue}</p>
        </div>
      )}

      {/* Month grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {feeStatus.map((status, i) => (
          <div key={i}
            className={`rounded-xl p-4 border-2 transition-all ${status.paid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-start justify-between mb-1">
              <p className="text-xs font-semibold text-mid-grey">{MONTH_NAMES[status.month - 1].slice(0, 3)} {status.year}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${status.paid ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                {status.paid ? '✓ Paid' : '✗ Due'}
              </span>
            </div>
            <p className="text-lg font-bold text-dark-grey mb-2">₹{status.paid ? status.amount : status.fee}</p>
            {status.paid ? (
              <div className="space-y-1.5">
                <p className="text-xs text-green-700">{status.type === 'online' ? '💳 Online' : '💵 Cash'}</p>
                {status.paymentId && (
                  <button onClick={() => handleDownload(status.paymentId)}
                    className="text-xs text-blue-600 hover:underline w-full text-left">
                    📄 Download Receipt
                  </button>
                )}
              </div>
            ) : (
              showPayButton && onPayNow && (
                <button onClick={() => onPayNow(status)}
                  className="w-full text-xs btn-primary py-1.5 px-2.5">
                  Pay Now
                </button>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
