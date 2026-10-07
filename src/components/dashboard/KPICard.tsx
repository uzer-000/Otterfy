import { ReactNode } from 'react';
import { formatMZN } from '@/lib/utils';

interface KPICardProps {
  title: string;
  revenue: number;
  salesCount: number;
  percentChange: number;
  icon?: ReactNode;
}

export default function KPICard({ title, revenue, salesCount, percentChange, icon }: KPICardProps) {
  const isPositive = percentChange > 0;
  const isNegative = percentChange < 0;
  
  return (
    <div className="otter-widget-card rounded-2xl p-6 relative overflow-hidden group">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#94A3B8] text-sm font-semibold">{title}</h3>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
      
      {/* Revenue */}
      <div className="mb-3">
        <span className="text-3xl font-black text-[#F8FAFC] tracking-tight">
          {formatMZN(revenue)}
        </span>
      </div>
      
      {/* Footer details */}
      <div className="flex items-center justify-between text-xs pt-3 border-t border-[#1E1B26]/80">
        <span className="text-[#94A3B8] font-medium">{salesCount} {salesCount === 1 ? 'venda' : 'vendas'}</span>
        
        <span className={`
          inline-flex items-center space-x-1 font-semibold px-2 py-0.5 rounded-full text-[11px]
          ${isPositive 
            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' 
            : isNegative 
            ? 'text-red-400 bg-red-500/10 border border-red-500/20' 
            : 'text-[#64748B] bg-[#0F0E14] border border-[#1E1B26]'
          }
        `}>
          <span>{isPositive ? '↑' : isNegative ? '↓' : '•'}</span>
          <span>{percentChange === 0 ? '0%' : `${Math.abs(percentChange)}%`}</span>
        </span>
      </div>
    </div>
  );
}
