'use client';

import React from 'react';

interface CrescentSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CrescentSpinner: React.FC<CrescentSpinnerProps> = ({ 
  className = '', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  // Using the smooth Tailwind spinner approach - rounded circle with border
  // This creates a smooth, continuous spinning animation like the original
  // border-b-2 shows only the bottom border, creating a crescent effect as it spins
  return (
    <div 
      className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-transparent border-b-white dark:border-b-white ${className}`}
    />
  );
};
