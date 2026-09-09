import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

export function Card({ children, className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border p-4 ${className}`}
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      {...rest}
    >
      {children}
    </div>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  full?: boolean;
}

export function Button({ variant = 'primary', full, className = '', children, ...rest }: ButtonProps) {
  const styles: Record<string, string> = {
    primary: 'text-white',
    secondary: '',
    ghost: 'bg-transparent',
    danger: 'text-white',
  };
  const bg: Record<string, string> = {
    primary: 'var(--brand)',
    secondary: 'var(--surface-2)',
    ghost: 'transparent',
    danger: 'var(--danger)',
  };
  return (
    <button
      className={`rounded-xl font-medium px-4 py-3 text-sm active:opacity-70 transition-opacity disabled:opacity-40 ${
        styles[variant]
      } ${full ? 'w-full' : ''} ${className}`}
      style={{ background: bg[variant] }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function PageHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 pt-5 pb-3">
      <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
        {title}
      </h1>
      {right}
    </div>
  );
}

export function EmptyState({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-14 px-6">
      <p className="font-medium" style={{ color: 'var(--text)' }}>
        {title}
      </p>
      {subtitle && (
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          {subtitle}
        </p>
      )}
      {action}
    </div>
  );
}

export function Pill({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'brand' | 'success' | 'warn' }) {
  const bg = {
    default: 'var(--surface-2)',
    brand: 'var(--brand-dim)',
    success: 'var(--success-dim)',
    warn: '#fbbf2426',
  }[tone];
  const color = {
    default: 'var(--text-dim)',
    brand: 'var(--brand)',
    success: 'var(--success)',
    warn: 'var(--warn)',
  }[tone];
  return (
    <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: bg, color }}>
      {children}
    </span>
  );
}
