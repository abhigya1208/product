import api from '../services/api';

export default function ExportButton({ endpoint, filename, label, className = '' }) {
  const handleExport = async () => {
    try {
      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <button onClick={handleExport} className={`btn-outline text-sm flex items-center gap-2 ${className}`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      </svg>
      {label || 'Export Excel'}
    </button>
  );
}
