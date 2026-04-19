import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell, Sector } from 'recharts';
import { MONTH_SHORT } from '../utils/constants';

const COLORS = ['#A8E6CF', '#FFDAB9', '#93C5FD', '#FBC4AB', '#D8B4FE', '#FCA5A5'];

function formatMonth(item) {
  return `${MONTH_SHORT[(item._id?.month || 1) - 1]} ${String(item._id?.year || '').slice(-2)}`;
}

export function RevenueChart({ data = [] }) {
  const chartData = data.map(d => ({ name: formatMonth(d), Revenue: d.total, Payments: d.count }));
  return (
    <div className="card">
      <h3 className="font-bold text-dark-grey mb-4">Revenue Trend</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v}`} />
          <Tooltip formatter={(v, n) => [n === 'Revenue' ? `₹${v}` : v, n]} />
          <Line type="monotone" dataKey="Revenue" stroke="#A8E6CF" strokeWidth={2.5} dot={{ fill: '#A8E6CF', r: 4 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="Payments" stroke="#FFDAB9" strokeWidth={2} strokeDasharray="5 5" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StudentGrowthChart({ data = [] }) {
  const chartData = data.map(d => ({ name: formatMonth(d), 'New Students': d.count }));
  return (
    <div className="card">
      <h3 className="font-bold text-dark-grey mb-4">Student Growth</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="New Students" fill="#A8E6CF" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FeeCollectionChart({ percent = 0, total = 0 }) {
  const pieData = [
    { name: 'Collected', value: percent },
    { name: 'Pending', value: 100 - percent },
  ];
  return (
    <div className="card text-center">
      <h3 className="font-bold text-dark-grey mb-4">Fee Collection (This Month)</h3>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value">
            {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
          </Pie>
          <Tooltip formatter={(v) => `${v}%`} />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-3xl font-extrabold text-dark-grey -mt-4">{percent}%</p>
      <p className="text-sm text-mid-grey">{total} students paid this month</p>
    </div>
  );
}

export function ClassBreakdownChart({ data = [] }) {
  const chartData = data.map(d => ({ name: `Cls ${d._id}`, Students: d.count }));
  return (
    <div className="card">
      <h3 className="font-bold text-dark-grey mb-4">Students per Class</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="Students" radius={[4, 4, 0, 0]}>
            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
