import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 border border-dashed border-[#1E1B26] rounded-xl bg-[#121016]/50 ${className}`}>
      <div className="text-slate-500 mb-4 bg-[#1A1820] p-4 rounded-full">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-[#F8FAFC] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[#94A3B8] max-w-sm mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};
