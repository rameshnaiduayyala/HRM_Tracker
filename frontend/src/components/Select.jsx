import React from 'react';

export default function Select({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#4b5568' }}>
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}
      <select
        required={required}
        disabled={disabled}
        value={value}
        onChange={onChange}
        className="w-full focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        style={{
          padding: '8px 12px',
          background: 'rgba(7,9,15,0.70)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          color: '#e2e8f0',
          fontSize: '12px',
          fontFamily: 'inherit',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%234b5568' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
          paddingRight: '30px',
          cursor: 'pointer',
        }}
        onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.60)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
        onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
