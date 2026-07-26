import React from 'react';

/**
 * Reusable Typography Component
 * Supports: Heading (h1, h2, h3, h4, h5, h6), Text (p, span), Label, Link
 */
export function Heading({
  level = 2,
  children,
  className = '',
  style = {},
  ...props
}) {
  const Tag = `h${level}`;
  const sizes = {
    1: 'text-3xl font-black tracking-tight',
    2: 'text-2xl font-black tracking-tight',
    3: 'text-xl font-bold tracking-tight',
    4: 'text-lg font-bold tracking-tight',
    5: 'text-base font-semibold',
    6: 'text-sm font-semibold',
  };

  return (
    <Tag
      className={`${sizes[level] || sizes[2]} ${className}`}
      style={{ color: 'var(--text-primary)', ...style }}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function Text({
  as: Tag = 'p',
  variant = 'secondary', // 'primary' | 'secondary' | 'muted' | 'tertiary'
  size = 'sm', // 'xs' | 'sm' | 'base' | 'lg'
  children,
  className = '',
  style = {},
  ...props
}) {
  const sizes = {
    xs: 'text-[11px]',
    sm: 'text-xs',
    base: 'text-sm',
    lg: 'text-base',
  };

  const colors = {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    muted: 'var(--text-muted)',
    tertiary: 'var(--text-tertiary)',
  };

  return (
    <Tag
      className={`${sizes[size] || sizes.sm} ${className}`}
      style={{ color: colors[variant] || colors.secondary, ...style }}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function Label({
  children,
  required = false,
  className = '',
  style = {},
  ...props
}) {
  return (
    <label
      className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${className}`}
      style={{ color: 'var(--text-secondary)', ...style }}
      {...props}
    >
      {children}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  );
}

export function Link({
  children,
  href,
  onClick,
  className = '',
  style = {},
  ...props
}) {
  return (
    <a
      href={href || '#'}
      onClick={onClick}
      className={`text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline transition ${className}`}
      style={{ ...style }}
      {...props}
    >
      {children}
    </a>
  );
}

export function Badge({
  children,
  variant = 'indigo', // 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet'
  className = '',
  ...props
}) {
  return (
    <span className={`badge badge-${variant} ${className}`} {...props}>
      {children}
    </span>
  );
}
