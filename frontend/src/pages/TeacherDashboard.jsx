import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import StudentForm from '../components/StudentForm';
import FeeTable from '../components/FeeTable';
import AnnouncementsPanel from '../components/AnnouncementsPanel';
import ChatInterface from '../components/ChatInterface';
import ChangePassword from '../components/ChangePassword';
import StatsCard from '../components/StatsCard';
import SettingsPanel from '../components/SettingsPanel';
import ThemeToggler from '../components/ThemeToggler';
import { CLASSES, MONTH_NAMES, FEE_STRUCTURE } from '../utils/constants';

const NAV = [
  { id: 'dashboard',     label: 'Dashboard',     icon: '📊' },
  { id: 'students',      label: 'Students',      icon: '👨‍🎓' },
  { id: 'pending',       label: 'Pending Fees',  icon: '⚠️' },
  { id: 'earnings',      label: 'My Earnings',   icon: '💰' },
  { id: 'announcements', label: 'Announcements', icon: '📢' },
  { id: 'chat',          label: 'Chat',          icon: '💬' },
  { id: 'settings',      label: 'Settings',      icon: '⚙️' },
];

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab]           = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [stats, setStats]               = useState(null);
  const [students, setStudents]         = useState([]);
  const [studentTotal, setStudentTotal] = useState(0);
  const [studentPage, setStudentPage]   = useState(1);
  const [studentSearch, setStudentSearch] = useState('');
  const [classFilter, setClassFilter]   = useState('');
  const [pending, setPending]           = useState([]);
  const [pendingTotal, setPendingTotal] = useState(0);

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [editStudent, setEditStudent]       = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentFeeData, setStudentFeeData]   = useState([]);
  const [credsModal, setCredsModal]           = useState(null);

  // Offline payment
  const [offlineModal, setOfflineModal] = useState(null);
  const [offlineForm, setOfflineForm]   = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), slipNumber: '' });
  const [offlineLoading, setOfflineLoading] = useState(false);
  const [offlineError, setOfflineError] = useState('');

  const loadStats = async () => {
    const res = await api.get('/teacher/dashboard');
    setStats(res.data);
  };
  const loadStudents = async (p = 1) => {
    const res = await api.get('/teacher/students', { params: { page: p, limit: 20, search: studentSearch, studentClass: classFilter } });
    setStudents(res.data.students);
    setStudentTotal(res.data.total);
    setStudentPage(p);
  };
  const loadPending = async () => {
    const res = await api.get('/teacher/pending-fees');
    setPending(res.data.pendingFees);
    setPendingTotal(res.data.total);
  };
  const openStudentDetail = async (s) => {
    const res = await api.get(`/teacher/students/${s._id}`);
    setSelectedStudent(res.data.student);
    setStudentFeeData(res.data.feeStatus);
  };

  useEffect(() => {
    if (tab === 'dashboard') loadStats();
    if (tab === 'students') loadStudents(1);
    if (tab === 'pending') loadPending();
  }, [tab]);

  useEffect(() => {
    if (tab === 'students') {
      const t = setTimeout(() => loadStudents(1), 400);
      return () => clearTimeout(t);
    }
  }, [studentSearch, classFilter]);

  const addStudent = async (form) => {
    const res = await api.post('/teacher/students', form);
    setCredsModal(res.data.credentials);
    setShowAddStudent(false);
    loadStudents(1);
  };
  const updateStudent = async (form) => {
    await api.put(`/teacher/students/${editStudent._id}`, form);
    setEditStudent(null);
    loadStudents(studentPage);
  };
  const markOffline = async (e) => {
    e.preventDefault();
    setOfflineLoading(true);
    setOfflineError('');
    try {
      await api.post('/teacher/payments/offline', { studentId: offlineModal._id, ...offlineForm });
      setOfflineModal(null);
      loadPending();
      if (selectedStudent?._id === offlineModal._id) openStudentDetail(selectedStudent);
    } catch (err) {
      setOfflineError(err.response?.data?.message || 'Failed to record payment.');
    } finally { setOfflineLoading(false); }
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };
  const switchTab = (t) => { setTab(t); setSidebarOpen(false); };

  return (
    <div className="flex h-screen bg-cream dark:bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
          <img src="/logo.png" alt="AGS" className="h-10 w-10 object-contain rounded-xl" />
          <div><p className="font-bold text-sm text-dark-grey dark:text-gray-100">AGS Tutorial</p><p className="text-xs text-mid-grey dark:text-gray-400">Teacher Portal</p></div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(n => (
            <button key={n.id} onClick={() => switchTab(n.id)} className={`sidebar-link w-full ${tab === n.id ? 'active' : ''}`}>
              <span className="text-lg">{n.icon}</span><span className="text-sm">{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-pastel-green/50 dark:bg-pastel-green/30 flex items-center justify-center font-bold text-dark-grey dark:text-gray-100">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="min-w-0"><p className="text-sm font-semibold text-dark-grey dark:text-gray-100 truncate">{user?.name}</p><p className="text-xs text-mid-grey dark:text-gray-400">Teacher</p></div>
          </div>
          <button onClick={handleLogout} className="btn-danger w-full text-sm py-2">Logout</button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl" onClick={() => setSidebarOpen(true)}>
              <svg className="w-5 h-5 text-dark-grey dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div>
              <h2 className="text-lg font-bold text-dark-grey dark:text-gray-100">{NAV.find(n => n.id === tab)?.label}</h2>
              <p className="text-xs text-mid-grey dark:text-gray-400">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <div>
            <ThemeToggler />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* ── DASHBOARD ── */}
          {tab === 'dashboard' && stats && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatsCard icon="👨‍🎓" label="Total Students" value={stats.totalStudents} color="green" />
                <StatsCard icon="✅" label="Paid This Month" value={stats.paidThisMonth} color="blue" />
                <StatsCard icon="⚠️" label="Pending Fees" value={stats.pendingThisMonth} color="peach" />
              </div>
              <div className="card">
                <h3 className="font-bold text-dark-grey dark:text-gray-100 mb-4">Students by Class</h3>
                <div className="flex flex-wrap gap-2">
                  {(stats.classBreakdown || []).map(c => (
                    <div key={c._id} className="bg-pastel-green/20 dark:bg-pastel-green/10 rounded-xl px-4 py-2 text-center">
                      <p className="text-lg font-bold text-dark-grey dark:text-gray-100">{c.count}</p>
                      <p className="text-xs text-mid-grey dark:text-gray-400">Class {c._id}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STUDENTS ── */}
          {tab === 'students' && (
            <div className="animate-fade-in">
              {selectedStudent && (
                <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
                  <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full overflow-y-auto shadow-xl dark:shadow-black/50">
                    <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
                      <div><h3 className="font-bold text-dark-grey dark:text-gray-100">{selectedStudent.name}</h3><p className="text-sm text-mid-grey dark:text-gray-400">{selectedStudent.rollNumber}</p></div>
                      <button onClick={() => setSelectedStudent(null)} className="text-2xl text-mid-grey dark:text-gray-400 dark:hover:text-gray-200">×</button>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {[["Father's Name", selectedStudent.fatherName], ["Phone", selectedStudent.phone], ["Class", `${selectedStudent.studentClass}-${selectedStudent.section}`], ["Admission", new Date(selectedStudent.admissionDate).toLocaleDateString('en-IN')]].map(([k, v]) => (
                          <div key={k} className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3"><p className="text-xs text-mid-grey dark:text-gray-400">{k}</p><p className="font-semibold text-dark-grey dark:text-gray-100">{v || 'N/A'}</p></div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setOfflineModal(selectedStudent); }} className="btn-secondary text-sm px-3 py-2">💵 Mark Offline Payment</button>
                        <button onClick={() => { setEditStudent(selectedStudent); setSelectedStudent(null); }} className="btn-outline text-sm px-3 py-2">✏️ Edit</button>
                      </div>
                      <h4 className="font-semibold text-dark-grey dark:text-gray-100">Fee Status</h4>
                      <FeeTable student={selectedStudent} feeStatus={studentFeeData} showPayButton={false} />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <h3 className="section-title text-xl">All Students ({studentTotal})</h3>
                <div className="flex flex-wrap gap-2">
                  <input className="input max-w-[200px] text-sm" placeholder="Search…" value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
                  <select className="input max-w-[120px] text-sm" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
                    <option value="">All Classes</option>
                    {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                  <button onClick={() => setShowAddStudent(true)} className="btn-primary text-sm px-4 py-2">+ Add Student</button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-800">
                <table className="w-full min-w-[600px]">
                  <thead><tr>{['Roll No', 'Name', 'Class', 'Father', 'Phone', 'Action'].map(h => <th key={h} className="table-th">{h}</th>)}</tr></thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/60 cursor-pointer" onClick={() => openStudentDetail(s)}>
                        <td className="table-td font-mono text-xs">{s.rollNumber}</td>
                        <td className="table-td font-medium">{s.name}</td>
                        <td className="table-td"><span className="badge-green">Cls {s.studentClass}-{s.section}</span></td>
                        <td className="table-td text-sm text-mid-grey dark:text-gray-400">{s.fatherName || 'N/A'}</td>
                        <td className="table-td text-sm">{s.phone || 'N/A'}</td>
                        <td className="table-td" onClick={e => e.stopPropagation()}>
                          <button onClick={() => { setOfflineModal(s); }} className="text-xs btn-secondary px-3 py-1.5">💵 Pay</button>
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && <tr><td colSpan={6} className="table-td text-center text-mid-grey dark:text-gray-400 py-8">No students found.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-mid-grey dark:text-gray-400">Showing {students.length} of {studentTotal}</p>
                <div className="flex gap-2">
                  <button onClick={() => loadStudents(studentPage - 1)} disabled={studentPage <= 1} className="btn-outline text-sm px-4 py-1.5 disabled:opacity-40">← Prev</button>
                  <button onClick={() => loadStudents(studentPage + 1)} disabled={students.length < 20} className="btn-outline text-sm px-4 py-1.5 disabled:opacity-40">Next →</button>
                </div>
              </div>
            </div>
          )}

          {/* ── PENDING FEES ── */}
          {tab === 'pending' && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="section-title text-xl">Pending Fees</h3>
                  <p className="section-subtitle">{pendingTotal} students haven't paid this month</p>
                </div>
                <button onClick={loadPending} className="btn-outline text-sm px-4 py-2">🔄 Refresh</button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pending.map(s => (
                  <div key={s._id} className="card border-l-4 border-red-300">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-dark-grey dark:text-gray-100">{s.name}</p>
                        <p className="text-xs text-mid-grey dark:text-gray-400 font-mono">{s.rollNumber}</p>
                        <span className="badge-green mt-1">Class {s.studentClass}-{s.section}</span>
                      </div>
                      <p className="text-xl font-extrabold text-red-600">₹{s.pendingFee}</p>
                    </div>
                    {s.fatherName && <p className="text-xs text-mid-grey dark:text-gray-400 mb-1">Father: {s.fatherName}</p>}
                    {s.phone && <p className="text-xs text-mid-grey dark:text-gray-400 mb-3">📞 {s.phone}</p>}
                    <button onClick={() => setOfflineModal(s)} className="btn-secondary w-full text-sm py-2">💵 Mark as Paid</button>
                  </div>
                ))}
                {pending.length === 0 && (
                  <div className="col-span-3 text-center py-16">
                    <div className="text-5xl mb-3">🎉</div>
                    <p className="text-lg font-bold text-dark-grey dark:text-gray-100 mb-1">All fees collected!</p>
                    <p className="text-mid-grey dark:text-gray-400 text-sm">All students have paid for this month.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'announcements' && <AnnouncementsPanel canCreate={true} />}
          {tab === 'chat' && <ChatInterface />}
          {tab === 'settings' && <SettingsPanel />}
        </main>
      </div>

      {/* Modals */}
      {showAddStudent && <StudentForm onSubmit={addStudent} onClose={() => setShowAddStudent(false)} />}
      {editStudent && <StudentForm initial={editStudent} onSubmit={updateStudent} onClose={() => setEditStudent(null)} />}

      {credsModal && (
        <div className="modal-overlay">
          <div className="modal-box max-w-sm">
            <div className="p-6 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-dark-grey dark:text-gray-100 mb-4">Student Added!</h3>
              <div className="bg-pastel-green/20 dark:bg-pastel-green/10 rounded-xl p-4 space-y-2 text-left mb-4">
                <div className="flex justify-between"><span className="text-sm text-mid-grey dark:text-gray-400">Username</span><span className="font-mono font-bold dark:text-gray-100">{credsModal.username}</span></div>
                <div className="flex justify-between"><span className="text-sm text-mid-grey dark:text-gray-400">Password</span><span className="font-mono font-bold dark:text-gray-100">{credsModal.password}</span></div>
              </div>
              <button onClick={() => setCredsModal(null)} className="btn-primary w-full">Done</button>
            </div>
          </div>
        </div>
      )}

      {offlineModal && (
        <div className="modal-overlay">
          <div className="modal-box max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800">
              <h3 className="font-bold text-dark-grey dark:text-gray-100">Mark Offline Payment</h3>
              <button onClick={() => { setOfflineModal(null); setOfflineError(''); }} className="text-2xl text-mid-grey dark:text-gray-400">×</button>
            </div>
            <form onSubmit={markOffline} className="p-5 space-y-4">
              <div className="bg-pastel-green/20 dark:bg-pastel-green/10 rounded-xl p-3">
                <p className="font-medium text-dark-grey dark:text-gray-100">{offlineModal.name}</p>
                <p className="text-sm text-mid-grey dark:text-gray-400">Fee: ₹{offlineModal.pendingFee || FEE_STRUCTURE[offlineModal.studentClass]}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Month</label>
                  <select className="input" value={offlineForm.month} onChange={e => setOfflineForm(f => ({ ...f, month: +e.target.value }))}>
                    {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select></div>
                <div><label className="label">Year</label>
                  <input type="number" className="input" value={offlineForm.year} onChange={e => setOfflineForm(f => ({ ...f, year: +e.target.value }))} /></div>
              </div>
              <div><label className="label">Slip Number *</label>
                <input className="input" placeholder="Cash slip number" required value={offlineForm.slipNumber} onChange={e => setOfflineForm(f => ({ ...f, slipNumber: e.target.value }))} /></div>
              {offlineError && <p className="text-red-500 text-sm">{offlineError}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => { setOfflineModal(null); setOfflineError(''); }} className="btn-outline flex-1">Cancel</button>
                <button type="submit" disabled={offlineLoading} className="btn-primary flex-1">{offlineLoading ? 'Saving…' : 'Mark Paid'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
