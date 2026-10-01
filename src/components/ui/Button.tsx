'use client';
import React from 'react';
import { Spinner } from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  laserEffect?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      leftIcon,
      laserEffect = true,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isPrimaryWithLaser = variant === 'primary' && laserEffect;

    const baseStyles = isPrimaryWithLaser
      ? 'laser-button font-semibold text-white focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2 focus:ring-offset-[#08070C] disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-violet-900/20'
      : 'inline-flex items-center justify-center font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2 focus:ring-offset-[#08070C] disabled:opacity-50 disabled:pointer-events-none';
    
    const variants = {
      primary: isPrimaryWithLaser ? '' : 'bg-violet-600 text-white hover:bg-violet-700 border border-transparent shadow-lg shadow-violet-600/20',
      secondary: 'bg-[#121016] text-[#F8FAFC] border border-[#1E1B26] hover:bg-[#1A1820] hover:border-[#2D2838]',
      danger: 'bg-red-500 text-white hover:bg-red-600 border border-transparent',
      ghost: 'bg-transparent text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1A1820]',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${
          fullWidth ? 'w-full' : ''
        } ${className}`}
        {...props}
      >
        {isLoading && <Spinner size="sm" className="mr-2" />}
        {!isLoading && leftIcon && <span className="mr-2 flex items-center">{leftIcon}</span>}
        <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
      </button>
    );
  }
);
Button.displayName = 'Button';
export default Button;
