import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className = '',
  padding = 'md',
  hoverEffect = false,
  children,
  ...props
}) => {
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`bg-[#121016] border border-[#1E1B26] rounded-xl transition-colors ${
        hoverEffect ? 'hover:bg-[#1A1820]' : ''
      } ${className}`}
      {...props}
    >
      <div className={paddings[padding]}>{children}</div>
    </div>
  );
};

interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  description,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex flex-col space-y-1.5 mb-6 ${className}`} {...props}>
      <h3 className="font-semibold leading-none tracking-tight text-[#F8FAFC]">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[#94A3B8]">{description}</p>
      )}
    </div>
  );
};
