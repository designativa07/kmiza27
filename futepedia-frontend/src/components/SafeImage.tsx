'use client';

import { useState } from 'react';
import { getTeamLogoUrl, getCompetitionLogoUrl, getPlayerImageUrl } from '@/lib/cdn-simple';

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  type?: 'team' | 'competition' | 'player';
  fallbackSrc?: string;
}

export default function SafeImage({ 
  src, 
  alt, 
  className = '', 
  type = 'team',
  fallbackSrc 
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(() => {
    if (!src) {
      return fallbackSrc || (type === 'team' ? '/default-team-logo.svg' : 
                           type === 'competition' ? '/default-competition-logo.svg' : 
                           '/default-player-photo.svg');
    }

    // Converter URL baseado no tipo
    switch (type) {
      case 'team':
        return getTeamLogoUrl(src);
      case 'competition':
        return getCompetitionLogoUrl(src);
      case 'player':
        return getPlayerImageUrl(src);
      default:
        return src;
    }
  });

  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      const defaultFallback = fallbackSrc || (type === 'team' ? '/default-team-logo.svg' : 
                                             type === 'competition' ? '/default-competition-logo.svg' : 
                                             '/default-player-photo.svg');
      setImgSrc(defaultFallback);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
} 