'use client';

import { useState } from 'react';
import { Trophy, Shield } from 'lucide-react';

interface ImageWithFallbackProps {
  src: string | null;
  alt: string;
  fallbackType?: 'competition' | 'team';
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export default function ImageWithFallback({
  src,
  alt,
  fallbackType = 'team',
  className = '',
  size = 'md'
}: ImageWithFallbackProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  if (!src || src === '' || imageError) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 ${className}`}>
        {fallbackType === 'competition' ? (
          <Trophy className={`${iconSizes[size]} text-gray-400`} />
        ) : (
          <Shield className={`${iconSizes[size]} text-gray-400`} />
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${sizeClasses[size]} object-contain rounded-lg ${className}`}
      onError={() => setImageError(true)}
    />
  );
} 