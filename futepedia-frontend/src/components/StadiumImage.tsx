'use client'

import { useState } from 'react';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { getStadiumImageUrl } from '@/lib/cdn';

interface StadiumImageProps {
  imageUrl?: string;
  name: string;
  className?: string;
}

export function StadiumImage({ imageUrl, name, className = '' }: StadiumImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!imageUrl || hasError) {
    return (
      <div className={`flex flex-col items-center justify-center h-full text-gray-500 bg-gray-100 ${className}`}>
        <MapPin className="h-12 w-12 mb-2 text-gray-400" />
        <span className="text-sm">Sem imagem disponível</span>
      </div>
    );
  }

  return (
    <Image 
      src={getStadiumImageUrl(imageUrl)} 
      alt={name} 
      fill
      className={`object-cover ${className}`}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      priority={false}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      onError={() => {
        console.warn('Failed to load stadium image:', imageUrl);
        setHasError(true);
      }}
    />
  );
} 