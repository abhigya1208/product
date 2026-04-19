import { useState, useEffect } from 'react';
import api from '../services/api';

const roleColors = { admin: 'badge-blue', teacher: 'badge-green', student: 'badge-yellow', system: 'badge-red' };

export default function LogViewer() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ action: '', role: '' });

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/logs', { params: { page: p, limit: 50, ...filter } });
      setLogs(res.data.logs);
      setTotal(res.data.total);
      setPage(p);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(1); }, [filter]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="section-title text-xl">Audit Logs</h3>
          <p className="section-subtitle">{total} total log entries</p>
        </div>
        <div className="flex gap-2">
          <input className="input max-w-[180px] text-sm" placeholder="Filter action…" value={filter.action}
            onChange={e => setFilter(f => ({ ...f, action: e.target.value }))} />
          <select className="input max-w-[130px] text-sm" value={filter.role}
            onChange={e => setFilter(f => ({ ...f, role: e.target.value }))}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 border-4 border-pastel-green border-t-transparent rounded-full" /></div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr>{['Time', 'User', 'Role', 'Action', 'IP'].map(h => <th key={h} className="table-th">{h}</th>)}</tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l._id} className="hover:bg-gray-50">
                    <td className="table-td text-xs text-mid-grey whitespace-nowrap">{new Date(l.createdAt).toLocaleString('en-IN')}</td>
                    <td className="table-td text-sm font-medium">{l.userName || 'System'}</td>
                    <td className="table-td"><span className={roleColors[l.role] || 'badge-blue'}>{l.role}</span></td>
                    <td className="table-td">
                      <span className="inline-block bg-gray-100 text-dark-grey text-xs px-2 py-0.5 rounded-full font-mono">{l.action}</span>
                    </td>
                    <td className="table-td text-xs text-mid-grey">{l.ipAddress || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-mid-grey">Page {page} of {Math.ceil(total / 50)}</p>
            <div className="flex gap-2">
              <button onClick={() => load(page - 1)} disabled={page <= 1} className="btn-outline text-sm px-4 py-1.5 disabled:opacity-40">← Prev</button>
              <button onClick={() => load(page + 1)} disabled={page >= Math.ceil(total / 50)} className="btn-outline text-sm px-4 py-1.5 disabled:opacity-40">Next →</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
