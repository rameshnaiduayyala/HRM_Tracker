import React from 'react';
import { Search } from 'lucide-react';

export default function FilterBar({
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filters = [], // [{ label: 'Dept', value, options: [{ label, value }], onChange }]
  statusOptions = [], // [{ label: 'All', value: 'ALL' }]
  statusValue,
  onStatusChange,
  className = '',
}) {
  return (
    <div className={`glass-card flex flex-wrap items-center gap-4 py-3 px-4 ${className}`}>
      {/* Search Input */}
      {onSearchChange && (
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-1.5 rounded-xl text-xs focus:outline-none focus:border-indigo-600 transition-all font-medium"
            style={{
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      )}

      {/* Select Dropdown Filters */}
      {filters.map((f, i) => (
        <div key={i} className="flex items-center gap-2">
          {f.label && (
            <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {f.label}:
            </label>
          )}
          <select
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            className="rounded-xl px-3 py-1.5 text-xs outline-none focus:border-indigo-600 transition-all font-medium cursor-pointer"
            style={{
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            {f.options.map((opt, optIdx) => (
              <option 
                key={optIdx} 
                value={opt.value}
                style={{
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                }}
              >
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {/* Status Toggle Pills */}
      {statusOptions.length > 0 && onStatusChange && (
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Status:
          </label>
          <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)' }}>
            {statusOptions.map((st) => (
              <button
                key={st.value}
                type="button"
                onClick={() => onStatusChange(st.value)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  statusValue === st.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'hover:bg-[var(--bg-card-alt)]'
                }`}
                style={{ color: statusValue === st.value ? '#ffffff' : 'var(--text-secondary)' }}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
