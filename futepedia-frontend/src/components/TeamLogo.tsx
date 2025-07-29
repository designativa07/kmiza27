'use client';

import { useState } from 'react';
import { Shield } from 'lucide-react';

interface TeamLogoProps {
  src: string | null;
  alt: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function TeamLogo({ src, alt, className = '', size = 'md' }: TeamLogoProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-5 w-5',
    lg: 'h-8 w-8'
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  // Se não há src ou houve erro, mostrar fallback
  if (!src || imageError) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center ${className}`}>
        <Shield className={`${iconSizes[size]} text-gray-500`} />
      </div>
    );
  }

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {imageLoading && (
        <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center`}>
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${sizeClasses[size]} object-contain ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
} 