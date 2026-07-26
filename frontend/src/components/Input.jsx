import React from 'react';
import { Label } from './Typography';

export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  className = '',
  style = {},
  ...props
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <Label required={required}>{label}</Label>}
      <input
        type={type}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={onChange}
        className="w-full px-3 py-2 rounded-xl text-sm font-medium transition focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: 'var(--bg-canvas)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-primary)',
          ...style,
        }}
        {...props}
      />
    </div>
  );
}




