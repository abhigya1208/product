import { useState, useRef } from 'react';
import api from '../services/api';
import { CLASSES, SECTION_B_CLASSES } from '../utils/constants';

// ── Helpers ──

/** Normalize class values from external data → schema-valid class + section */
function parseClassSection(raw) {
  if (!raw) return { studentClass: '', section: 'A' };
  const str = String(raw).trim().toUpperCase();

  // Handle U.K.G. / UKG variations
  if (str.match(/^U\.?K\.?G\.?$/)) return { studentClass: 'UKG', section: 'A' };
  if (str.match(/^L\.?K\.?G\.?$/)) return { studentClass: 'LKG', section: 'A' };
  if (str.match(/^NUR(SERY)?$/i)) return { studentClass: 'NUR', section: 'A' };

  // "6A" → class 6, section A  |  "7B" → class 7, section B
  const match = str.match(/^(\d{1,2})\s*([AB])?$/);
  if (match) {
    const cls = match[1];
    const sec = match[2] || 'A';
    if (CLASSES.includes(cls)) {
      // Validate section B
      if (sec === 'B' && !SECTION_B_CLASSES.includes(cls)) {
        return { studentClass: cls, section: 'A' }; // fallback
      }
      return { studentClass: cls, section: sec };
    }
  }

  return { studentClass: str, section: 'A' };
}

/** Parse date strings like "3/31/2026", "4/1/2026", "2026-04-01" etc */
function parseDate(raw) {
  if (!raw) return null;
  const str = String(raw).trim();
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d.toISOString();
  // Try M/D/YYYY
  const parts = str.split('/');
  if (parts.length === 3) {
    const [m, day, y] = parts;
    const d2 = new Date(y, m - 1, day);
    if (!isNaN(d2.getTime())) return d2.toISOString();
  }
  return null;
}

/** Normalize a phone number — keep only digits */
function normalizePhone(raw) {
  if (!raw) return '';
  return String(raw).replace(/[^0-9+]/g, '').trim();
}

/** Parse tab/comma-separated text into rows of objects */
function parseTabular(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  // Detect delimiter: tab or comma
  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(delimiter).map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const cells = line.split(delimiter).map(c => c.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cells[i] || ''; });
    return obj;
  });

  return { headers, rows };
}

// ── Column mapping from common header names → our schema ──

const COLUMN_ALIASES = {
  name: ['name', 'student name', 'student_name', 'studentname', 'full name'],
  fatherName: ['father name', 'father_name', 'fathername', 'father na', 'father\'s name', 'father', 'parent name'],
  studentClass: ['class', 'studentclass', 'student_class', 'grade'],
  phone: ['phone', 'contact', 'mobile', 'phone number', 'phone no', 'phone_number', 'parent contact'],
  rollNumber: ['roll number', 'rollnumber', 'roll_number', 'roll no', 'roll', 'roll numb', 'roll numbe'],
  admissionDate: ['enrolled date', 'enrolled d', 'enrollment date', 'admission date', 'admission_date', 'admissiondate', 'enrolled', 'date'],
  status: ['status'],
  siblings: ['siblings'],
  remarks: ['remarks', 'remark'],
  motherName: ['mother name', 'mother_name', 'mothername', 'mother\'s name', 'mother'],
};

function autoMapColumns(headers) {
  const mapping = {};
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    const idx = lowerHeaders.findIndex(h => aliases.some(a => h.includes(a)));
    if (idx !== -1) mapping[field] = headers[idx];
  }

  return mapping;
}

function mapRowToStudent(row, mapping) {
  const get = (field) => {
    const col = mapping[field];
    return col ? (row[col] || '').trim() : '';
  };

  const { studentClass, section } = parseClassSection(get('studentClass'));
  const statusRaw = get('status').toLowerCase();
  const isArchived = statusRaw === 'archived' || statusRaw === 'inactive';

  return {
    name: get('name'),
    fatherName: get('fatherName'),
    motherName: get('motherName'),
    phone: normalizePhone(get('phone')),
    studentClass,
    section,
    rollNumber: get('rollNumber'),
    admissionDate: parseDate(get('admissionDate')),
    isArchived,
    siblings: get('siblings'),
    remarks: get('remarks'),
    _status: isArchived ? 'Archived' : 'Active',
    _valid: !!get('name') && !!studentClass && CLASSES.includes(studentClass),
    _error: !get('name') ? 'Name missing' : !studentClass ? 'Class missing' : !CLASSES.includes(studentClass) ? `Invalid class "${studentClass}"` : '',
  };
}

// ── Main Component ──

export default function BulkImport({ onClose, onSuccess }) {
  const [step, setStep] = useState('input'); // input → preview → importing → done
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [mapping, setMapping] = useState({});
  const [headers, setHeaders] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef(null);

  // Handle file upload (CSV only — simple text parse)
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRawText(ev.target.result);
    };
    reader.readAsText(file);
  };

  // Parse and preview
  const handlePreview = () => {
    const { headers: h, rows } = parseTabular(rawText);
    if (rows.length === 0) return alert('No data rows found. Ensure the first row is headers.');
    setHeaders(h);
    const autoMap = autoMapColumns(h);
    setMapping(autoMap);
    const mapped = rows.map(r => mapRowToStudent(r, autoMap));
    setParsedData(mapped);
    setStep('preview');
  };

  // Re-map when mapping changes
  const updateMapping = (field, colName) => {
    const newMap = { ...mapping, [field]: colName || undefined };
    setMapping(newMap);
    const { rows } = parseTabular(rawText);
    const mapped = rows.map(r => mapRowToStudent(r, newMap));
    setParsedData(mapped);
  };

  // Do the actual import
  const handleImport = async () => {
    const validRows = parsedData.filter(r => r._valid);
    if (validRows.length === 0) return alert('No valid rows to import.');

    setImporting(true);
    setStep('importing');
    setProgress(0);

    try {
      const payload = validRows.map(r => ({
        name: r.name,
        fatherName: r.fatherName,
        motherName: r.motherName,
        phone: r.phone,
        studentClass: r.studentClass,
        section: r.section,
        rollNumber: r.rollNumber || undefined,
        admissionDate: r.admissionDate || undefined,
        isArchived: r.isArchived,
      }));

      const res = await api.post('/admin/students/bulk-import', { students: payload });
      setImportResult(res.data);
      setStep('done');
    } catch (err) {
      setImportResult({ error: err.response?.data?.message || 'Import failed.' });
      setStep('done');
    } finally {
      setImporting(false);
    }
  };

  const validCount = parsedData.filter(r => r._valid).length;
  const invalidCount = parsedData.filter(r => !r._valid).length;

  return (
    <div className="modal-overlay">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="font-bold text-dark-grey text-lg">📥 Bulk Import Students</h3>
            <p className="text-xs text-mid-grey mt-0.5">
              {step === 'input' && 'Paste your data or upload a CSV file'}
              {step === 'preview' && `Preview — ${validCount} valid, ${invalidCount} invalid`}
              {step === 'importing' && 'Importing students…'}
              {step === 'done' && 'Import complete'}
            </p>
          </div>
          <button onClick={onClose} className="text-2xl text-mid-grey hover:text-dark-grey leading-none">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ── STEP 1: Input ── */}
          {step === 'input' && (
            <div className="space-y-4">
              {/* Fee notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                <p className="font-semibold mb-1">ℹ️ Important: Fees will NOT be marked as paid</p>
                <p>All imported students will have unpaid/pending fee status. Fee payments must be recorded manually via the admin or teacher dashboard.</p>
              </div>

              <div>
                <label className="label">Paste table data (tab or comma separated)</label>
                <textarea
                  className="input min-h-[200px] font-mono text-xs leading-relaxed"
                  placeholder={`Name\tFather Name\tClass\tPhone\tEnrolled Date\nRahul\tMr. Sharma\t6A\t9876543210\t3/31/2026`}
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-mid-grey">— or —</span>
                <button onClick={() => fileRef.current?.click()} className="btn-outline text-sm px-4 py-2">
                  📄 Upload CSV File
                </button>
                <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" className="hidden" onChange={handleFile} />
              </div>

              <div className="bg-gray-50 rounded-xl p-4 text-xs text-mid-grey space-y-1">
                <p className="font-semibold text-dark-grey mb-2">Expected columns (auto-detected):</p>
                <p>• <b>Name</b> (required) — Student name</p>
                <p>• <b>Father Name</b> — Father's name (used for password)</p>
                <p>• <b>Class</b> (required) — e.g. "6A", "UKG", "10"</p>
                <p>• <b>Phone</b> — Contact number</p>
                <p>• <b>Roll Number</b> — Custom roll number (auto-generated if blank)</p>
                <p>• <b>Enrolled Date</b> — Admission date (M/D/YYYY or YYYY-MM-DD)</p>
                <p>• <b>Status</b> — "Active" or "Archived"</p>
              </div>
            </div>
          )}

          {/* ── STEP 2: Preview ── */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Column mapping */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-dark-grey mb-3">Column Mapping — adjust if needed:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {['name', 'fatherName', 'motherName', 'studentClass', 'phone', 'rollNumber', 'admissionDate', 'status'].map(field => (
                    <div key={field}>
                      <label className="text-xs text-mid-grey capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                      <select
                        className="input text-xs py-1.5 mt-1"
                        value={mapping[field] || ''}
                        onChange={e => updateMapping(field, e.target.value)}
                      >
                        <option value="">— Skip —</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fee notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <span className="text-lg leading-none mt-0.5">⚠️</span>
                <div className="text-sm text-amber-800">
                  <p className="font-semibold">No fees will be marked as paid.</p>
                  <p className="text-xs mt-0.5">All {validCount} students will be imported with fully unpaid fee status.</p>
                </div>
              </div>

              {/* Summary */}
              <div className="flex gap-3">
                <div className="bg-green-50 rounded-xl px-4 py-2 text-center flex-1">
                  <p className="text-xl font-bold text-green-700">{validCount}</p>
                  <p className="text-xs text-green-600">Ready to import</p>
                </div>
                {invalidCount > 0 && (
                  <div className="bg-red-50 rounded-xl px-4 py-2 text-center flex-1">
                    <p className="text-xl font-bold text-red-700">{invalidCount}</p>
                    <p className="text-xs text-red-600">Will be skipped</p>
                  </div>
                )}
              </div>

              {/* Preview table */}
              <div className="overflow-x-auto rounded-xl border border-gray-100 max-h-[350px]">
                <table className="w-full min-w-[600px] text-xs">
                  <thead className="sticky top-0">
                    <tr>
                      <th className="table-th">#</th>
                      <th className="table-th">Status</th>
                      <th className="table-th">Name</th>
                      <th className="table-th">Father</th>
                      <th className="table-th">Class</th>
                      <th className="table-th">Section</th>
                      <th className="table-th">Phone</th>
                      <th className="table-th">Roll No</th>
                      <th className="table-th">Enrolled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((r, i) => (
                      <tr key={i} className={r._valid ? 'hover:bg-gray-50' : 'bg-red-50/50'}>
                        <td className="table-td text-mid-grey">{i + 1}</td>
                        <td className="table-td">
                          {r._valid
                            ? <span className="badge-green">✓ Valid</span>
                            : <span className="badge-red" title={r._error}>✗ {r._error}</span>
                          }
                        </td>
                        <td className="table-td font-medium">{r.name || '—'}</td>
                        <td className="table-td">{r.fatherName || '—'}</td>
                        <td className="table-td">{r.studentClass || '—'}</td>
                        <td className="table-td">{r.section}</td>
                        <td className="table-td">{r.phone || '—'}</td>
                        <td className="table-td font-mono">{r.rollNumber || <span className="text-mid-grey italic">auto</span>}</td>
                        <td className="table-td">{r.admissionDate ? new Date(r.admissionDate).toLocaleDateString('en-IN') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── STEP 3: Importing ── */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-5xl mb-4 animate-bounce">📥</div>
              <p className="text-lg font-semibold text-dark-grey mb-2">Importing {validCount} students…</p>
              <p className="text-sm text-mid-grey">Please wait, this may take a moment.</p>
              <div className="w-64 bg-gray-200 rounded-full h-2 mt-6">
                <div className="bg-pastel-green h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          )}

          {/* ── STEP 4: Done ── */}
          {step === 'done' && importResult && (
            <div className="space-y-5">
              {importResult.error ? (
                <div className="text-center py-10">
                  <div className="text-5xl mb-4">❌</div>
                  <p className="text-lg font-bold text-red-700 mb-2">Import Failed</p>
                  <p className="text-sm text-red-600">{importResult.error}</p>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <div className="text-5xl mb-4">🎉</div>
                    <p className="text-lg font-bold text-dark-grey">Import Complete!</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-green-700">{importResult.summary?.success || 0}</p>
                      <p className="text-xs text-green-600 mt-1">Imported</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-red-700">{importResult.summary?.failed || 0}</p>
                      <p className="text-xs text-red-600 mt-1">Failed</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-blue-700">{importResult.summary?.skipped || 0}</p>
                      <p className="text-xs text-blue-600 mt-1">Skipped (duplicate)</p>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                    ⚠️ All fees for imported students are set to <b>Unpaid</b>. Mark payments manually.
                  </div>

                  {/* Credentials list */}
                  {importResult.credentials && importResult.credentials.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-dark-grey mb-2">Login credentials generated:</p>
                      <div className="overflow-x-auto rounded-xl border border-gray-100 max-h-[250px]">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0">
                            <tr>
                              <th className="table-th">Name</th>
                              <th className="table-th">Username (Roll No)</th>
                              <th className="table-th">Password</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importResult.credentials.map((c, i) => (
                              <tr key={i} className="hover:bg-gray-50">
                                <td className="table-td">{c.name}</td>
                                <td className="table-td font-mono font-bold">{c.username}</td>
                                <td className="table-td font-mono font-bold">{c.password}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Errors */}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-red-700 mb-2">Errors:</p>
                      <div className="bg-red-50 rounded-xl p-3 text-xs text-red-600 max-h-[150px] overflow-y-auto space-y-1">
                        {importResult.errors.map((e, i) => (
                          <p key={i}>Row {e.row}: {e.name} — {e.error}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex justify-between items-center flex-shrink-0">
          {step === 'input' && (
            <>
              <button onClick={onClose} className="btn-outline text-sm px-5 py-2">Cancel</button>
              <button onClick={handlePreview} disabled={!rawText.trim()} className="btn-primary text-sm px-5 py-2 disabled:opacity-50">
                Preview Data →
              </button>
            </>
          )}
          {step === 'preview' && (
            <>
              <button onClick={() => setStep('input')} className="btn-outline text-sm px-5 py-2">← Back</button>
              <button onClick={handleImport} disabled={validCount === 0} className="btn-primary text-sm px-5 py-2 disabled:opacity-50">
                📥 Import {validCount} Students
              </button>
            </>
          )}
          {step === 'importing' && (
            <p className="text-sm text-mid-grey w-full text-center">Processing…</p>
          )}
          {step === 'done' && (
            <>
              <div />
              <button onClick={() => { onSuccess?.(); onClose(); }} className="btn-primary text-sm px-5 py-2">
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
