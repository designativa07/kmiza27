'use client';

import { useState } from 'react';
import { User } from 'lucide-react';

interface PlayerImageProps {
  src: string | null;
  alt: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function PlayerImage({ src, alt, className = '', size = 'md' }: PlayerImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
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
        <User className={`${iconSizes[size]} text-gray-500`} />
      </div>
    );
  }

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {imageLoading && (
        <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center`}>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${sizeClasses[size]} rounded-full object-cover ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
} 