import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import FeeTable from '../components/FeeTable';
import PaymentModal from '../components/PaymentModal';
import AnnouncementsPanel from '../components/AnnouncementsPanel';
import { downloadReceipt } from '../utils/pdf';
import { MONTH_NAMES } from '../utils/constants';
import ChangePassword from '../components/ChangePassword';
import SettingsPanel from '../components/SettingsPanel';
import ThemeToggler from '../components/ThemeToggler';

const NAV = [
  { id: 'dashboard',     label: 'My Fees',        icon: '💳' },
  { id: 'history',       label: 'Payment History', icon: '📜' },
  { id: 'announcements', label: 'Announcements',   icon: '📢' },
  { id: 'settings',      label: 'Settings',         icon: '⚙️' },
];

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab]           = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile]   = useState(null);
  const [feeStatus, setFeeStatus] = useState([]);
  const [payments, setPayments] = useState([]);
  const [payModal, setPayModal] = useState(false);

  const loadProfile = async () => {
    const res = await api.get('/student/profile');
    setProfile(res.data.student);
    setFeeStatus(res.data.feeStatus);
  };
  const loadPayments = async () => {
    const res = await api.get('/student/payments');
    setPayments(res.data.payments);
  };

  useEffect(() => {
    loadProfile();
    loadPayments();
  }, []);

  const totalDue = feeStatus.filter(f => !f.paid).reduce((s, f) => s + f.fee, 0);
  const nextUnpaid = feeStatus.find(f => !f.paid);

  const handleLogout = async () => { await logout(); navigate('/login'); };
  const switchTab = (t) => { setTab(t); setSidebarOpen(false); };

  return (
    <div className="flex h-screen bg-cream dark:bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
          <img src="/logo.png" alt="AGS" className="h-10 w-10 object-contain rounded-xl" />
          <div><p className="font-bold text-sm text-dark-grey dark:text-gray-100">AGS Tutorial</p><p className="text-xs text-mid-grey dark:text-gray-400">Student Portal</p></div>
        </div>

        {/* Profile card in sidebar */}
        {profile && (
          <div className="p-4 border-b border-gray-100 dark:border-slate-800">
            <div className="bg-pastel-green/20 dark:bg-pastel-green/10 rounded-2xl p-4 text-center">
              <div className="w-14 h-14 rounded-full bg-pastel-green/50 dark:bg-pastel-green/30 flex items-center justify-center text-2xl font-extrabold text-dark-grey dark:text-gray-100 mx-auto mb-2">
                {profile.name?.[0]?.toUpperCase()}
              </div>
              <p className="font-bold text-dark-grey dark:text-gray-100 text-sm">{profile.name}</p>
              <p className="text-xs text-mid-grey dark:text-gray-400 font-mono mt-0.5">{profile.rollNumber}</p>
              <div className="flex justify-center gap-2 mt-2">
                <span className="badge-green">Class {profile.studentClass}</span>
                <span className="badge-blue">Section {profile.section}</span>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(n => (
            <button key={n.id} onClick={() => switchTab(n.id)} className={`sidebar-link w-full ${tab === n.id ? 'active' : ''}`}>
              <span className="text-lg">{n.icon}</span><span className="text-sm">{n.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-slate-800">
          <button onClick={handleLogout} className="btn-danger w-full text-sm py-2">Logout</button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 flex-1">
            <button className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl" onClick={() => setSidebarOpen(true)}>
              <svg className="w-5 h-5 text-dark-grey dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div>
              <h2 className="text-lg font-bold text-dark-grey dark:text-gray-100">{NAV.find(n => n.id === tab)?.label}</h2>
              <p className="text-xs text-mid-grey dark:text-gray-400">Welcome back, {user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggler />
            {totalDue > 0 && (
              <button onClick={() => setPayModal(true)} className="btn-secondary text-sm px-5 py-2.5 flex items-center gap-2">
                💳 Pay Due ₹{totalDue}
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* ── FEE STATUS ── */}
          {tab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              {/* Profile summary */}
              {profile && (
                <div className="card">
                  <h3 className="font-bold text-dark-grey dark:text-gray-100 mb-4">My Profile</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    {[
                      ['Roll Number', profile.rollNumber],
                      ['Full Name', profile.name],
                      ["Father's Name", profile.fatherName || 'N/A'],
                      ["Mother's Name", profile.motherName || 'N/A'],
                      ['Class', `${profile.studentClass} – Section ${profile.section}`],
                      ['Admission Date', new Date(profile.admissionDate).toLocaleDateString('en-IN')],
                    ].map(([k, v]) => (
                      <div key={k} className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3">
                        <p className="text-xs text-mid-grey dark:text-gray-400 mb-0.5">{k}</p>
                        <p className="font-semibold text-dark-grey dark:text-gray-100">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Due alert */}
              {totalDue > 0 && nextUnpaid && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-905/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-red-700 dark:text-red-400 text-lg">⚠️ Fee Due: ₹{totalDue}</p>
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                      Earliest pending: {MONTH_NAMES[nextUnpaid.month - 1]} {nextUnpaid.year} – ₹{nextUnpaid.fee}
                    </p>
                  </div>
                  <button onClick={() => setPayModal(true)} className="btn-primary whitespace-nowrap">Pay Now via Razorpay</button>
                </div>
              )}

              {totalDue === 0 && feeStatus.length > 0 && (
                <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-905/30 rounded-2xl p-4 text-center">
                  <p className="text-green-700 dark:text-green-400 font-bold text-lg">🎉 All Fees Cleared!</p>
                  <p className="text-green-600 dark:text-green-400 text-sm">You have no pending dues. Great job!</p>
                </div>
              )}

              {/* Fee grid */}
              <div className="card">
                <h3 className="font-bold text-dark-grey dark:text-gray-100 mb-5">Month-wise Fee Status</h3>
                {profile && (
                  <FeeTable
                    student={profile}
                    feeStatus={feeStatus}
                    showPayButton={true}
                    onPayNow={() => setPayModal(true)}
                  />
                )}
              </div>
            </div>
          )}

          {/* ── PAYMENT HISTORY ── */}
          {tab === 'history' && (
            <div className="animate-fade-in">
              <div className="mb-5">
                <h3 className="section-title text-xl">Payment History</h3>
                <p className="section-subtitle">{payments.length} transactions</p>
              </div>
              {payments.length === 0 ? (
                <div className="text-center py-12 text-mid-grey dark:text-gray-400">No payments yet.</div>
              ) : (
                <div className="space-y-3">
                  {payments.map(p => (
                    <div key={p._id} className="card flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl ${p.type === 'online' ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-yellow-50 dark:bg-yellow-950/30'}`}>
                          {p.type === 'online' ? '💳' : '💵'}
                        </div>
                        <div>
                          <p className="font-semibold text-dark-grey dark:text-gray-100">{MONTH_NAMES[(p.month || 1) - 1]} {p.year}</p>
                          <p className="text-xs text-mid-grey dark:text-gray-400">
                            {p.type === 'online' ? `TxnID: ${p.razorpayPaymentId?.slice(-10) || 'N/A'}` : `Slip: ${p.slipNumber || 'N/A'}`}
                          </p>
                          <p className="text-xs text-mid-grey dark:text-gray-400">{new Date(p.paidAt).toLocaleDateString('en-IN')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-extrabold text-dark-grey dark:text-gray-100">₹{p.amount}</p>
                        <span className={p.type === 'online' ? 'badge-blue' : 'badge-yellow'}>{p.type}</span>
                        <div className="mt-2">
                          <button onClick={() => profile && downloadReceipt({ ...p, _id: p._id }, profile)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline">📄 Receipt</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'announcements' && <AnnouncementsPanel canCreate={false} />}
          {tab === 'settings' && <SettingsPanel />}
        </main>
      </div>

      {/* Payment Modal */}
      {payModal && profile && (
        <PaymentModal
          student={profile}
          onClose={() => setPayModal(false)}
          onSuccess={() => { loadProfile(); loadPayments(); }}
        />
      )}
    </div>
  );
}
