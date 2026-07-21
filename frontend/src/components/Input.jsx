import React from 'react';

export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-medium text-[var(--text-primary)]">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 bg-[var(--bg-canvas)] border border-[var(--border-base)] text-white text-sm rounded-lg focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
        {...props}
      />
    </div>
  );
}




