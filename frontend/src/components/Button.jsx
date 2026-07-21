import React from 'react';
import { RefreshCw } from 'lucide-react';

const VARIANTS = {
  primary: {
    base: 'text-white font-semibold shadow-glow-indigo',
    style: {
      background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%)',
      backgroundSize: '200% 100%',
      border: '1px solid rgba(99,102,241,0.40)',
    },
    hoverStyle: {
      boxShadow: '0 0 20px rgba(99,102,241,0.40), 0 4px 12px rgba(0,0,0,0.35)',
      transform: 'translateY(-1px)',
    },
  },
  secondary: {
    base: 'font-medium',
    style: {
      background: 'var(--bg-card)',
      border: '1px solid var(--border-muted)',
      color: 'var(--text-secondary)',
    },
    hoverStyle: {
      background: 'var(--bg-card-alt)',
      color: 'var(--text-primary)',
      borderColor: 'var(--border-base)',
    },
  },
  danger: {
    base: 'font-medium',
    style: {
      background: 'rgba(244,63,94,0.08)',
      border: '1px solid rgba(244,63,94,0.22)',
      color: '#f43f5e',
    },
    hoverStyle: {
      background: 'rgba(244,63,94,0.15)',
      borderColor: 'rgba(244,63,94,0.35)',
    },
  },
  ghost: {
    base: 'font-medium',
    style: {
      background: 'transparent',
      border: '1px solid transparent',
      color: 'var(--text-muted)',
    },
    hoverStyle: {
      background: 'var(--bg-card-alt)',
      color: 'var(--text-primary)',
    },
  },
};

export default function Button({
  children,
  type     = 'button',
  variant  = 'primary',
  loading  = false,
  disabled = false,
  className = '',
  onClick,
  style: customStyle = {},
  ...props
}) {
  const [hovered, setHovered] = React.useState(false);
  const v = VARIANTS[variant] || VARIANTS.primary;

  const mergedStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '10px',
    fontSize: '12px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
    outline: 'none',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    ...v.style,
    ...(hovered && !disabled && !loading ? v.hoverStyle : {}),
    ...customStyle,
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`${v.base} ${className}`}
      style={mergedStyle}
      {...props}
    >
      {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
}




