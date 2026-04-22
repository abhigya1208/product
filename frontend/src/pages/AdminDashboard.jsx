import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import StatsCard from '../components/StatsCard';
import { RevenueChart, StudentGrowthChart, FeeCollectionChart, ClassBreakdownChart } from '../components/Charts';
import StudentForm from '../components/StudentForm';
import BulkImport from '../components/BulkImport';
import TeacherForm from '../components/TeacherForm';
import SessionManager from '../components/SessionManager';
import LogViewer from '../components/LogViewer';
import ExportButton from '../components/ExportButton';
import AnnouncementsPanel from '../components/AnnouncementsPanel';
import ChatInterface from '../components/ChatInterface';
import FeeTable from '../components/FeeTable';
import { FEE_STRUCTURE, CLASSES, MONTH_NAMES } from '../utils/constants';
import { useSocket } from '../context/SocketContext';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'students',  label: 'Students',  icon: '👨‍🎓' },
  { id: 'teachers',  label: 'Teachers',  icon: '👩‍🏫' },
  { id: 'payments',  label: 'Payments',  icon: '💳' },
  { id: 'announcements', label: 'Announcements', icon: '📢' },
  { id: 'feedback',  label: 'Feedback',  icon: '⭐' },
  { id: 'enquiries', label: 'Enquiries', icon: '📩' },
  { id: 'sessions',  label: 'Sessions',  icon: '🔐' },
  { id: 'logs',      label: 'Logs',      icon: '📋' },
  { id: 'chat',      label: 'Chat',      icon: '💬' },
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dashboard data
  const [stats, setStats] = useState(null);

  // Students
  const [students, setStudents] = useState([]);
  const [studentTotal, setStudentTotal] = useState(0);
  const [studentPage, setStudentPage] = useState(1);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [credsModal, setCredsModal] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentFeeData, setStudentFeeData] = useState(null);

  // Teachers
  const [teachers, setTeachers] = useState([]);
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [editTeacher, setEditTeacher] = useState(null);

  // Payments
  const [payments, setPayments] = useState([]);
  const [paymentTotal, setPaymentTotal] = useState(0);
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentType, setPaymentType] = useState('');

  // Offline payment
  const [offlineModal, setOfflineModal] = useState(null);
  const [offlineForm, setOfflineForm] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), slipNumber: '' });

  // Discount modal
  const [discountModal, setDiscountModal] = useState(null);
  const [discountForm, setDiscountForm] = useState({ discount: 0, discountStartMonth: '' });

  // Enquiries
  const [enquiries, setEnquiries] = useState([]);
  const [unreadEnquiries, setUnreadEnquiries] = useState(0);

  // Feedback
  const [feedbacks, setFeedbacks] = useState([]);

  const loadStats = async () => {
    const res = await api.get('/admin/dashboard');
    setStats(res.data);
  };

  const loadStudents = async (p = 1) => {
    const res = await api.get('/admin/students', { params: { page: p, limit: 20, search: studentSearch, studentClass: studentClassFilter, archived: showArchived } });
    setStudents(res.data.students);
    setStudentTotal(res.data.total);
    setStudentPage(p);
  };

  const loadTeachers = async () => {
    const res = await api.get('/admin/teachers');
    setTeachers(res.data.teachers);
  };

  const loadPayments = async (p = 1) => {
    const res = await api.get('/payments', { params: { page: p, limit: 20, search: paymentSearch, type: paymentType } });
    setPayments(res.data.payments);
    setPaymentTotal(res.data.total);
    setPaymentPage(p);
  };

  const loadEnquiries = async () => {
    try {
      const res = await api.get('/contact');
      setEnquiries(res.data.contacts);
      setUnreadEnquiries(res.data.contacts.filter(e => e.status === 'Unread').length);
    } catch(err) {
      console.error(err);
    }
  };

  const loadFeedbacks = async () => {
    try {
      const res = await api.get('/feedback/admin');
      setFeedbacks(res.data.feedbacks);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (tab === 'dashboard') loadStats();
    if (tab === 'students') loadStudents(1);
    if (tab === 'teachers') loadTeachers();
    if (tab === 'payments') loadPayments(1);
    if (tab === 'enquiries') loadEnquiries();
    if (tab === 'feedback') loadFeedbacks();
  }, [tab]);

  // Initial load for enquiries badge
  useEffect(() => {
    loadEnquiries();
    
    if (socket) {
      const handleNewEnquiry = (newEnquiry) => {
        setUnreadEnquiries(prev => prev + 1);
        if (tab === 'enquiries') {
          setEnquiries(prev => [newEnquiry, ...prev]);
        }
      };
      socket.on('new_enquiry', handleNewEnquiry);
      return () => socket.off('new_enquiry', handleNewEnquiry);
    }
  }, [socket, tab]);

  useEffect(() => {
    if (tab === 'students') {
      const t = setTimeout(() => loadStudents(1), 400);
      return () => clearTimeout(t);
    }
  }, [studentSearch, studentClassFilter, showArchived]);

  useEffect(() => {
    if (tab === 'payments') {
      const t = setTimeout(() => loadPayments(1), 400);
      return () => clearTimeout(t);
    }
  }, [paymentSearch, paymentType]);

  // ── Student actions ──
  const addStudent = async (form) => {
    const res = await api.post('/admin/students', form);
    setCredsModal(res.data.credentials);
    setShowStudentForm(false);
    loadStudents(1);
  };
  const updateStudent = async (form) => {
    await api.put(`/admin/students/${editStudent._id}`, form);
    setEditStudent(null);
    loadStudents(studentPage);
  };
  const deleteStudent = async () => {
    if (!deleteConfirm) return;
    await api.delete(`/admin/students/${deleteConfirm}`);
    setDeleteConfirm(null);
    loadStudents(1);
  };
  const archiveStudent = async (s) => {
    await api.put(`/admin/students/${s._id}`, { isArchived: !s.isArchived });
    loadStudents(studentPage);
  };
  const openStudentDetail = async (s) => {
    const res = await api.get(`/admin/students/${s._id}`);
    setSelectedStudent(res.data.student);
    setStudentFeeData(res.data.feeStatus);
  };

  // ── Teacher actions ──
  const addTeacher = async (form) => {
    await api.post('/admin/teachers', form);
    setShowTeacherForm(false);
    loadTeachers();
  };
  const updateTeacher = async (form) => {
    const payload = { ...form };
    if (!payload.password) delete payload.password;
    await api.put(`/admin/teachers/${editTeacher._id}`, payload);
    if (form.password) await api.put(`/admin/teachers/${editTeacher._id}/reset-password`, { newPassword: form.password });
    setEditTeacher(null);
    loadTeachers();
  };
  const deleteTeacher = async (id) => {
    if (!window.confirm('Delete this teacher?')) return;
    await api.delete(`/admin/teachers/${id}`);
    loadTeachers();
  };

  // ── Offline payment ──
  const markOffline = async (e) => {
    e.preventDefault();
    await api.post('/teacher/payments/offline', { studentId: offlineModal._id, ...offlineForm });
    setOfflineModal(null);
    if (selectedStudent?._id === offlineModal._id) openStudentDetail(selectedStudent);
  };

  // ── Discount ──
  const saveDiscount = async (e) => {
    e.preventDefault();
    await api.put(`/admin/students/${discountModal._id}`, discountForm);
    setDiscountModal(null);
    loadStudents(studentPage);
  };

  // ── Enquiry actions ──
  const updateEnquiryStatus = async (id, status) => {
    try {
      await api.patch(`/contact/${id}/status`, { status });
      setEnquiries(prev => prev.map(e => e._id === id ? { ...e, status } : e));
      if (status === 'Read' || status === 'Resolved') {
        const wasUnread = enquiries.find(e => e._id === id)?.status === 'Unread';
        if (wasUnread) setUnreadEnquiries(Math.max(0, unreadEnquiries - 1));
      }
    } catch(err) {
      console.error(err);
    }
  };

  // ── Feedback actions ──
  const toggleFeedbackApproval = async (id, currentStatus) => {
    try {
      await api.patch(`/feedback/admin/${id}/approve`, { isApproved: !currentStatus });
      loadFeedbacks();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteFeedback = async (id) => {
    if (!window.confirm('Delete this feedback permanently?')) return;
    try {
      await api.delete(`/feedback/admin/${id}`);
      loadFeedbacks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const switchTab = (t) => { setTab(t); setSidebarOpen(false); };

  return (
    <div className="flex h-screen bg-cream overflow-hidden">
      {/* Sidebar */}
      <>
        {/* Overlay for mobile */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          {/* Logo */}
          <div className="p-5 border-b border-gray-100 flex items-center gap-3">
            <img src="/logo.png" alt="AGS" className="h-10 w-10 object-contain rounded-xl" />
            <div>
              <p className="font-bold text-sm text-dark-grey">AGS Tutorial</p>
              <p className="text-xs text-mid-grey capitalize">Admin Portal</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {NAV.map(n => (
              <button key={n.id} onClick={() => switchTab(n.id)}
                className={`sidebar-link w-full relative ${tab === n.id ? 'active' : ''}`}>
                <span className="text-lg">{n.icon}</span>
                <span className="text-sm">{n.label}</span>
                {n.id === 'enquiries' && unreadEnquiries > 0 && (
                  <span className="absolute right-4 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadEnquiries}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-pastel-peach flex items-center justify-center font-bold text-dark-grey">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-dark-grey truncate">{user?.name}</p>
                <p className="text-xs text-mid-grey">Administrator</p>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-danger w-full text-sm py-2">Logout</button>
          </div>
        </aside>
      </>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 hover:bg-gray-100 rounded-xl" onClick={() => setSidebarOpen(true)}>
              <svg className="w-5 h-5 text-dark-grey" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h2 className="text-lg font-bold text-dark-grey">{NAV.find(n => n.id === tab)?.label}</h2>
              <p className="text-xs text-mid-grey">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tab === 'students' && <ExportButton endpoint="/admin/export/students" filename="students.xlsx" label="Export Students" />}
            {tab === 'payments' && <ExportButton endpoint="/admin/export/payments" filename="payments.xlsx" label="Export Payments" />}
            {tab === 'logs' && <ExportButton endpoint="/admin/export/logs" filename="logs.xlsx" label="Export Logs" />}
          </div>
        </header>

        {/* Scroll area */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* ── DASHBOARD TAB ── */}
          {tab === 'dashboard' && stats && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard icon="👨‍🎓" label="Total Students" value={stats.summary.totalStudents} color="green" />
                <StatsCard icon="💰" label="Total Collection" value={`₹${stats.summary.totalCollection.toLocaleString()}`} color="peach" />
                <StatsCard icon="📅" label="Today's Collection" value={`₹${stats.summary.todayCollection.toLocaleString()}`} sub={`${stats.summary.todayPaymentsCount} payments`} color="blue" />
                <StatsCard icon="📊" label="Fee Collection" value={`${stats.summary.feeCollectionPercent}%`} sub="This month" color="purple" />
              </div>
              <div className="grid lg:grid-cols-2 gap-6">
                <RevenueChart data={stats.revenueTrend} />
                <StudentGrowthChart data={stats.studentGrowth} />
              </div>
              <div className="grid lg:grid-cols-3 gap-6">
                <FeeCollectionChart percent={stats.summary.feeCollectionPercent} total={stats.summary.feeCollectionPercent * stats.summary.totalStudents / 100 | 0} />
                <div className="lg:col-span-2"><ClassBreakdownChart data={stats.classBreakdown} /></div>
              </div>
            </div>
          )}

          {/* ── STUDENTS TAB ── */}
          {tab === 'students' && (
            <div className="animate-fade-in">
              {/* Student detail drawer */}
              {selectedStudent && (
                <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
                  <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-xl animate-slide-up">
                    <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
                      <div>
                        <h3 className="font-bold text-dark-grey">{selectedStudent.name}</h3>
                        <p className="text-sm text-mid-grey">{selectedStudent.rollNumber} · Class {selectedStudent.studentClass}-{selectedStudent.section}</p>
                      </div>
                      <button onClick={() => setSelectedStudent(null)} className="text-2xl text-mid-grey hover:text-dark-grey leading-none">×</button>
                    </div>
                    <div className="p-5 space-y-5">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {[["Father's Name", selectedStudent.fatherName], ["Mother's Name", selectedStudent.motherName], ["Phone", selectedStudent.phone], ["Admission", new Date(selectedStudent.admissionDate).toLocaleDateString('en-IN')], ["Monthly Fee", `₹${selectedStudent.monthlyFeeOverride || FEE_STRUCTURE[selectedStudent.studentClass] || 0}`], ["Discount", selectedStudent.discount > 0 ? `₹${selectedStudent.discount}/month` : 'None']].map(([k, v]) => (
                          <div key={k} className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-mid-grey">{k}</p><p className="font-semibold text-dark-grey">{v || 'N/A'}</p></div>
                        ))}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => { setOfflineModal(selectedStudent); setSelectedStudent(null); }} className="btn-secondary text-sm px-3 py-2">💵 Mark Offline Payment</button>
                        <button onClick={() => { setDiscountModal(selectedStudent); setDiscountForm({ discount: selectedStudent.discount || 0, discountStartMonth: selectedStudent.discountStartMonth || '' }); setSelectedStudent(null); }} className="btn-outline text-sm px-3 py-2">🏷️ Give Discount</button>
                        <button onClick={() => { setEditStudent(selectedStudent); setSelectedStudent(null); }} className="btn-outline text-sm px-3 py-2">✏️ Edit</button>
                      </div>
                      <h4 className="font-semibold text-dark-grey">Fee Status</h4>
                      <FeeTable student={selectedStudent} feeStatus={studentFeeData || []} showPayButton={false} />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <h3 className="section-title text-xl">Students ({studentTotal})</h3>
                <div className="flex flex-wrap gap-2 items-center">
                  <input className="input max-w-[200px] text-sm" placeholder="Search…" value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
                  <select className="input max-w-[130px] text-sm" value={studentClassFilter} onChange={e => setStudentClassFilter(e.target.value)}>
                    <option value="">All Classes</option>
                    {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                  <label className="flex items-center gap-1.5 text-sm text-mid-grey cursor-pointer">
                    <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
                    Archived
                  </label>
                  <button onClick={() => setShowBulkImport(true)} className="btn-secondary text-sm px-4 py-2">📥 Import</button>
                  <button onClick={() => setShowStudentForm(true)} className="btn-primary text-sm px-4 py-2">+ Add Student</button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr>{['Roll No', 'Name', 'Class', 'Father', 'Phone', 'Status', 'Actions'].map(h=><th key={h} className="table-th">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openStudentDetail(s)}>
                        <td className="table-td font-mono text-xs">{s.rollNumber}</td>
                        <td className="table-td font-medium">{s.name}</td>
                        <td className="table-td"><span className="badge-green">Cls {s.studentClass}-{s.section}</span></td>
                        <td className="table-td text-sm text-mid-grey">{s.fatherName || 'N/A'}</td>
                        <td className="table-td text-sm">{s.phone || 'N/A'}</td>
                        <td className="table-td">{s.isArchived ? <span className="badge-red">Archived</span> : <span className="badge-green">Active</span>}</td>
                        <td className="table-td" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1">
                            <button onClick={() => setEditStudent(s)} className="text-xs btn-outline px-2 py-1">Edit</button>
                            <button onClick={() => archiveStudent(s)} className="text-xs btn-outline px-2 py-1">{s.isArchived ? 'Restore' : 'Archive'}</button>
                            <button onClick={() => setDeleteConfirm(s._id)} className="text-xs btn-danger px-2 py-1">Del</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && <tr><td colSpan={7} className="table-td text-center text-mid-grey py-8">No students found.</td></tr>}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-mid-grey">Showing {students.length} of {studentTotal}</p>
                <div className="flex gap-2">
                  <button onClick={() => loadStudents(studentPage - 1)} disabled={studentPage <= 1} className="btn-outline text-sm px-4 py-1.5 disabled:opacity-40">← Prev</button>
                  <button onClick={() => loadStudents(studentPage + 1)} disabled={students.length < 20} className="btn-outline text-sm px-4 py-1.5 disabled:opacity-40">Next →</button>
                </div>
              </div>
            </div>
          )}

          {/* ── TEACHERS TAB ── */}
          {tab === 'teachers' && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-5">
                <h3 className="section-title text-xl">Teachers ({teachers.length})</h3>
                <button onClick={() => setShowTeacherForm(true)} className="btn-primary text-sm px-4 py-2">+ Add Teacher</button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {teachers.map(t => (
                  <div key={t._id} className="card hover:shadow-card transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-pastel-peach/50 flex items-center justify-center text-xl font-bold text-dark-grey">{t.name[0]}</div>
                      <div>
                        <p className="font-semibold text-dark-grey">{t.name}</p>
                        <p className="text-sm text-mid-grey">{t.username}</p>
                      </div>
                    </div>
                    {t.phone && <p className="text-sm text-mid-grey mb-1">📞 {t.phone}</p>}
                    {t.email && <p className="text-sm text-mid-grey mb-3">✉️ {t.email}</p>}
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => setEditTeacher(t)} className="btn-outline text-xs px-3 py-1.5 flex-1">Edit</button>
                      <button onClick={() => deleteTeacher(t._id)} className="btn-danger text-xs px-3 py-1.5 flex-1">Delete</button>
                    </div>
                  </div>
                ))}
                {teachers.length === 0 && <div className="col-span-3 text-center py-12 text-mid-grey">No teachers yet. Add one!</div>}
              </div>
            </div>
          )}

          {/* ── PAYMENTS TAB ── */}
          {tab === 'payments' && (
            <div className="animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <h3 className="section-title text-xl">Payments ({paymentTotal})</h3>
                <div className="flex gap-2 flex-wrap">
                  <input className="input max-w-[200px] text-sm" placeholder="Search student…" value={paymentSearch} onChange={e => setPaymentSearch(e.target.value)} />
                  <select className="input max-w-[130px] text-sm" value={paymentType} onChange={e => setPaymentType(e.target.value)}>
                    <option value="">All Types</option>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr>{['Student', 'Class', 'Month', 'Amount', 'Type', 'Date', 'Slip/TxnID'].map(h=><th key={h} className="table-th">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p._id} className="hover:bg-gray-50">
                        <td className="table-td">
                          <p className="font-medium">{p.studentId?.name}</p>
                          <p className="text-xs text-mid-grey font-mono">{p.studentId?.rollNumber}</p>
                        </td>
                        <td className="table-td"><span className="badge-green">Cls {p.studentId?.studentClass}</span></td>
                        <td className="table-td text-sm">{MONTH_NAMES[(p.month||1)-1].slice(0,3)} {p.year}</td>
                        <td className="table-td font-bold">₹{p.amount}</td>
                        <td className="table-td"><span className={p.type === 'online' ? 'badge-blue' : 'badge-yellow'}>{p.type}</span></td>
                        <td className="table-td text-xs text-mid-grey">{new Date(p.paidAt).toLocaleDateString('en-IN')}</td>
                        <td className="table-td text-xs font-mono text-mid-grey">{p.slipNumber || p.razorpayPaymentId?.slice(-8) || 'N/A'}</td>
                      </tr>
                    ))}
                    {payments.length === 0 && <tr><td colSpan={7} className="table-td text-center text-mid-grey py-8">No payments found.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-mid-grey">Showing {payments.length} of {paymentTotal}</p>
                <div className="flex gap-2">
                  <button onClick={() => loadPayments(paymentPage - 1)} disabled={paymentPage <= 1} className="btn-outline text-sm px-4 py-1.5 disabled:opacity-40">← Prev</button>
                  <button onClick={() => loadPayments(paymentPage + 1)} disabled={payments.length < 20} className="btn-outline text-sm px-4 py-1.5 disabled:opacity-40">Next →</button>
                </div>
              </div>
            </div>
          )}

          {/* ── ENQUIRIES TAB ── */}
          {tab === 'enquiries' && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-5">
                <h3 className="section-title text-xl">Enquiries ({enquiries.length})</h3>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr>{['Status', 'Date', 'Name', 'Contact', 'Message', 'Actions'].map(h=><th key={h} className="table-th">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {enquiries.map(e => (
                      <tr key={e._id} className={e.status === 'Unread' ? 'bg-blue-50/30 font-semibold' : 'hover:bg-gray-50'}>
                        <td className="table-td">
                          {e.status === 'Unread' && <span className="badge-red">Unread</span>}
                          {e.status === 'Read' && <span className="badge-blue">Read</span>}
                          {e.status === 'Resolved' && <span className="badge-green">Resolved</span>}
                        </td>
                        <td className="table-td text-xs text-mid-grey">
                          {new Date(e.createdAt).toLocaleString('en-IN', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}
                        </td>
                        <td className="table-td">{e.name}</td>
                        <td className="table-td text-xs">
                          {e.email}<br/>
                          <span className="text-mid-grey">{e.phone || 'No phone'}</span>
                        </td>
                        <td className="table-td text-sm min-w-[250px] whitespace-normal">
                          {e.message}
                        </td>
                        <td className="table-td">
                          <select 
                            className="input text-xs py-1" 
                            value={e.status || 'Unread'} 
                            onChange={(ev) => updateEnquiryStatus(e._id, ev.target.value)}
                          >
                            <option value="Unread">Unread</option>
                            <option value="Read">Mark Read</option>
                            <option value="Resolved">Resolve</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {enquiries.length === 0 && <tr><td colSpan={6} className="table-td text-center py-8">No enquiries found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'announcements' && <AnnouncementsPanel canCreate={true} />}

          {/* ── FEEDBACK TAB ── */}
          {tab === 'feedback' && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-5">
                <h3 className="section-title text-xl">Feedback Overview ({feedbacks.length})</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {feedbacks.map(f => (
                  <div key={f._id} className="card flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-dark-grey">{f.name || 'Anonymous'}</span>
                        <div className="flex text-yellow-500">
                          {Array.from({length: 5}).map((_, i) => (
                            <span key={i} className={i < f.rating ? 'opacity-100' : 'opacity-30'}>★</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-mid-grey text-sm mb-4 line-clamp-4">{f.message}</p>
                    </div>
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                      <button 
                        onClick={() => toggleFeedbackApproval(f._id, f.isApproved)} 
                        className={`text-xs px-3 py-1.5 rounded-full flex-1 ${f.isApproved ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'}`}
                      >
                        {f.isApproved ? 'Revoke Approval' : 'Approve Publicly'}
                      </button>
                      <button 
                        onClick={() => deleteFeedback(f._id)}
                        className="text-xs px-3 py-1.5 rounded-full text-gray-500 border border-gray-200 hover:bg-gray-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {feedbacks.length === 0 && (
                  <div className="col-span-full text-center py-10 text-mid-grey border border-dashed border-gray-200 rounded-xl">
                    No feedback received yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'sessions' && <SessionManager />}
          {tab === 'logs' && <LogViewer />}
          {tab === 'chat' && <ChatInterface />}
        </main>
      </div>

      {/* Modals */}
      {deleteConfirm && (
        <div className="modal-overlay z-50">
          <div className="modal-box max-w-sm">
            <div className="p-6 text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-dark-grey mb-2">Delete Student?</h3>
              <p className="text-mid-grey text-sm mb-6">This action cannot be undone. All related data including user account and sessions will be removed permanently.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="btn-outline flex-1">Cancel</button>
                <button onClick={deleteStudent} className="btn-danger flex-1">Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showBulkImport && <BulkImport onClose={() => setShowBulkImport(false)} onSuccess={() => loadStudents(1)} />}
      {showStudentForm && <StudentForm onSubmit={addStudent} onClose={() => setShowStudentForm(false)} />}
      {editStudent && <StudentForm initial={editStudent} onSubmit={updateStudent} onClose={() => setEditStudent(null)} />}
      {showTeacherForm && <TeacherForm onSubmit={addTeacher} onClose={() => setShowTeacherForm(false)} />}
      {editTeacher && <TeacherForm initial={editTeacher} onSubmit={updateTeacher} onClose={() => setEditTeacher(null)} />}

      {/* Credentials modal */}
      {credsModal && (
        <div className="modal-overlay">
          <div className="modal-box max-w-sm">
            <div className="p-6 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-dark-grey mb-2">Student Added!</h3>
              <p className="text-mid-grey text-sm mb-5">Share these login credentials with the student/parent:</p>
              <div className="bg-pastel-green/20 rounded-xl p-4 space-y-2 text-left mb-5">
                <div className="flex justify-between"><span className="text-sm text-mid-grey">Username (Roll No)</span><span className="font-mono font-bold text-dark-grey">{credsModal.username}</span></div>
                <div className="flex justify-between"><span className="text-sm text-mid-grey">Password</span><span className="font-mono font-bold text-dark-grey">{credsModal.password}</span></div>
              </div>
              <p className="text-xs text-orange-600 mb-5">⚠️ The student should change their password after first login.</p>
              <button onClick={() => setCredsModal(null)} className="btn-primary w-full">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Offline payment modal */}
      {offlineModal && (
        <div className="modal-overlay">
          <div className="modal-box max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-dark-grey">Mark Offline Payment</h3>
              <button onClick={() => setOfflineModal(null)} className="text-2xl text-mid-grey">×</button>
            </div>
            <form onSubmit={markOffline} className="p-5 space-y-4">
              <div className="bg-pastel-green/20 rounded-xl p-3">
                <p className="font-medium text-dark-grey">{offlineModal.name}</p>
                <p className="text-sm text-mid-grey">Roll: {offlineModal.rollNumber}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Month</label>
                  <select className="input" value={offlineForm.month} onChange={e => setOfflineForm(f => ({ ...f, month: +e.target.value }))}>
                    {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div><label className="label">Year</label>
                  <input type="number" className="input" value={offlineForm.year} onChange={e => setOfflineForm(f => ({ ...f, year: +e.target.value }))} /></div>
              </div>
              <div><label className="label">Slip Number *</label>
                <input className="input" placeholder="Cash slip number" required value={offlineForm.slipNumber} onChange={e => setOfflineForm(f => ({ ...f, slipNumber: e.target.value }))} /></div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setOfflineModal(null)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Mark Paid</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discount modal */}
      {discountModal && (
        <div className="modal-overlay">
          <div className="modal-box max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-dark-grey">Give Discount</h3>
              <button onClick={() => setDiscountModal(null)} className="text-2xl text-mid-grey">×</button>
            </div>
            <form onSubmit={saveDiscount} className="p-5 space-y-4">
              <div className="bg-pastel-green/20 rounded-xl p-3">
                <p className="font-medium text-dark-grey">{discountModal.name}</p>
                <p className="text-sm text-mid-grey">Class {discountModal.studentClass} · Default Fee: ₹{FEE_STRUCTURE[discountModal.studentClass]}</p>
              </div>
              <div><label className="label">Discount Amount (₹/month)</label>
                <input type="number" className="input" min="0" value={discountForm.discount} onChange={e => setDiscountForm(f => ({ ...f, discount: +e.target.value }))} required /></div>
              <div><label className="label">Effective From (YYYY-MM)</label>
                <input type="month" className="input" value={discountForm.discountStartMonth} onChange={e => setDiscountForm(f => ({ ...f, discountStartMonth: e.target.value }))} /></div>
              <p className="text-xs text-mid-grey bg-blue-50 p-3 rounded-xl">Discount applies from the selected month onwards to current and future months only.</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setDiscountModal(null)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Save Discount</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
