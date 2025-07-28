'use client';

import { useState, useEffect } from 'react';
import { Header } from './Header';
import { getApiUrl } from '@/lib/config';

interface HeaderWithLogoProps {
  currentCompetition?: {
    name: string;
    slug: string;
  };
  showBackToHome?: boolean;
}

async function getFutepediaImageSettings() {
  try {
    const apiUrl = getApiUrl();
    const fullUrl = `${apiUrl}/system-settings/futepedia-images`;
    
    const response = await fetch(fullUrl, { 
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return { headerLogoUrl: null };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    return { headerLogoUrl: null };
  }
}

export function HeaderWithLogo({ currentCompetition, showBackToHome = true }: HeaderWithLogoProps) {
  const [futepediaLogoUrl, setFutepediaLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const settings = await getFutepediaImageSettings();
        setFutepediaLogoUrl(settings.headerLogoUrl);
      } catch (error) {
        console.error('❌ Erro ao carregar logo da Futepédia:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLogo();
  }, []);

  // Renderizar o Header mesmo durante o loading, com fallback
  return (
    <Header
      currentCompetition={currentCompetition}
      showBackToHome={showBackToHome}
      futepediaLogoUrl={loading ? null : futepediaLogoUrl}
    />
  );
} 