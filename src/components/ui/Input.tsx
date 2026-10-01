'use client';
import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  isPhone?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, helperText, error, isPhone, id, ...props }, ref) => {
    const inputId = id || React.useId();
    
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-400">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {isPhone && (
            <div className="absolute left-3 text-slate-400 text-sm select-none">
              +258
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-[#0F0E14] text-slate-50 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-violet-600 h-10 ${
              isPhone ? 'pl-[52px]' : 'px-3'
            } ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-[#1E1B26] focus:border-violet-600'
            } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            {...props}
          />
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
Input.displayName = 'Input';
