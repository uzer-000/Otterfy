'use client';
import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, helperText, error, options, id, ...props }, ref) => {
    const selectId = id || React.useId();

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-slate-400">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={`w-full bg-[#0F0E14] text-slate-50 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-violet-600 h-10 px-3 appearance-none ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-[#1E1B26] focus:border-violet-600'
            } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value} className="bg-[#121016]">
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error ? (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        ) : helperText ? (
          <p className="text-sm text-slate-500 mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Select.displayName = 'Select';
