import { useState, useEffect } from 'react';
import api from '../services/api';

export default function SessionManager() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get('/admin/sessions');
      setSessions(res.data.sessions);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const terminate = async (id) => {
    if (!confirm('Terminate this session? That user will be logged out.')) return;
    await api.delete(`/admin/sessions/${id}`);
    setSessions(s => s.filter(x => x._id !== id));
  };

  const roleColors = { admin: 'badge-blue', teacher: 'badge-green', student: 'badge-yellow' };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="section-title text-xl">Active Sessions</h3>
          <p className="section-subtitle">{sessions.length} users currently logged in</p>
        </div>
        <button onClick={load} className="btn-outline text-sm px-4 py-2">🔄 Refresh</button>
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 border-4 border-pastel-green border-t-transparent rounded-full" /></div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 text-mid-grey">No active sessions found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                {['User', 'Role', 'Login Time', 'Last Activity', 'IP', 'Action'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="table-td">
                    <p className="font-medium text-dark-grey">{s.userId?.name || 'Unknown'}</p>
                    <p className="text-xs text-mid-grey">{s.userId?.username}</p>
                  </td>
                  <td className="table-td"><span className={roleColors[s.role] || 'badge-blue'}>{s.role}</span></td>
                  <td className="table-td text-xs text-mid-grey">{new Date(s.loginTime).toLocaleString('en-IN')}</td>
                  <td className="table-td text-xs text-mid-grey">{new Date(s.lastActivity).toLocaleString('en-IN')}</td>
                  <td className="table-td text-xs text-mid-grey">{s.ipAddress || 'N/A'}</td>
                  <td className="table-td">
                    <button onClick={() => terminate(s._id)} className="btn-danger text-xs px-3 py-1.5">
                      🚫 Terminate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
