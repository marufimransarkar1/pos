import { X, ChevronLeft, ChevronRight } from 'lucide-react';

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-6xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, color = 'blue', change }) {
  const colors = {
    blue:   { bg: 'bg-blue-50 dark:bg-blue-900/20',   icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' },
    green:  { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-900/20',  icon: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20',  icon: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400' },
    red:    { bg: 'bg-red-50 dark:bg-red-900/20',        icon: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className={`card p-5 ${c.bg}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.icon}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      {change !== undefined && (
        <p className={`text-xs mt-1 font-medium ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {change >= 0 ? '+' : ''}{change}% vs last period
        </p>
      )}
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
export function Table({ columns, data, loading, emptyMessage = 'No data found' }) {
  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-700">
            {columns.map((col) => (
              <th key={col.key} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
          {data.length === 0 ? (
            <tr><td colSpan={columns.length} className="text-center py-12 text-slate-400">{emptyMessage}</td></tr>
          ) : data.map((row, i) => (
            <tr key={row._id || i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export function Pagination({ page, pages, total, onPage }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
      <p className="text-sm text-slate-500">Total: <span className="font-medium text-slate-700 dark:text-slate-300">{total}</span></p>
      <div className="flex items-center gap-2">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">
          <ChevronLeft size={14} />
        </button>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{page} / {pages}</span>
        <button onClick={() => onPage(page + 1)} disabled={page >= pages} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
        <Icon size={32} className="text-slate-400" />
      </div>}
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

// ─── Search Input ─────────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-9"
      />
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, danger = true }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={() => { onConfirm(); onClose(); }} className={danger ? 'btn-danger' : 'btn-primary'}>Confirm</button>
      </div>
    </Modal>
  );
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const s = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-4', lg: 'w-12 h-12 border-4' };
  return <div className={`${s[size]} border-brand-600 border-t-transparent rounded-full animate-spin`} />;
}
