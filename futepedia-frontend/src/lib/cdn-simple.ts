/**
 * Versão simplificada e robusta para CDN
 * Focada em estabilidade máxima para SSR
 */

const CDN_BASE = 'https://cdn.kmiza27.com';

export function getCdnImageUrl(originalUrl: string | null | undefined, type: 'team' | 'competition' | 'player' = 'team'): string {
  // Fallbacks por tipo
  const fallbacks = {
    team: '/default-team-logo.svg',
    competition: '/default-competition-logo.svg',
    player: '/default-player-photo.svg'
  };

  // Se não há URL, retornar fallback
  if (!originalUrl || originalUrl.trim() === '') {
    return fallbacks[type];
  }

  try {
    // Se já é CDN, usar diretamente
    if (originalUrl.includes('cdn.kmiza27.com')) {
      return originalUrl;
    }

    // Se é URL externa (http/https), manter
    if (originalUrl.startsWith('http')) {
      return originalUrl;
    }

    // Conversões específicas
    if (originalUrl.startsWith('/uploads/escudos/')) {
      const filename = originalUrl.split('/').pop();
      return `${CDN_BASE}/img/escudos/${filename}`;
    }

    if (originalUrl.startsWith('/img/')) {
      return `${CDN_BASE}${originalUrl}`;
    }

    // Se é só nome de arquivo
    if (!originalUrl.includes('/') && originalUrl.match(/\.(svg|png|jpg|jpeg)$/i)) {
      const folder = type === 'competition' ? 'logo-competition' : 
                     type === 'player' ? 'players' : 'escudos';
      return `${CDN_BASE}/img/${folder}/${originalUrl}`;
    }

    // Fallback: retornar original
    return originalUrl;
  } catch {
    // Em caso de qualquer erro, retornar fallback
    return fallbacks[type];
  }
} 