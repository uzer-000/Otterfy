import React from 'react';

export type BadgeVariant = 
  | 'pending'
  | 'approved'
  | 'success'
  | 'declined'
  | 'error'
  | 'refunded'
  | 'chargeback'
  | 'cancelled'
  | 'expired'
  | 'default';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge: React.FC<BadgeProps> = ({
  className = '',
  variant = 'default',
  children,
  ...props
}) => {
  const variants: Record<BadgeVariant, string> = {
    pending: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    approved: 'bg-green-500/10 text-green-500 border border-green-500/20',
    success: 'bg-green-500/10 text-green-500 border border-green-500/20',
    declined: 'bg-red-500/10 text-red-500 border border-red-500/20',
    error: 'bg-red-500/10 text-red-500 border border-red-500/20',
    refunded: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
    chargeback: 'bg-red-600/20 text-red-500 border border-red-600/30 font-semibold',
    cancelled: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
    expired: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
    default: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
