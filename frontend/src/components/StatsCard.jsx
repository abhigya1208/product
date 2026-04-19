export default function StatsCard({ icon, label, value, sub, color = 'green' }) {
  const colors = {
    green:  'bg-pastel-green/20 text-green-700',
    peach:  'bg-pastel-peach/30 text-orange-700',
    blue:   'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return (
    <div className="card flex items-center gap-4 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200">
      <div className={`w-12 h-12 rounded-2xl ${colors[color]} flex items-center justify-center text-2xl flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold text-dark-grey truncate">{value}</p>
        <p className="text-sm font-medium text-dark-grey truncate">{label}</p>
        {sub && <p className="text-xs text-mid-grey">{sub}</p>}
      </div>
    </div>
  );
}
