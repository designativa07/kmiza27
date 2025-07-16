/**
 * Configuração CDN - CDN Oficial funcionando!
 * Última atualização: 2025-06-19T00:31:40.752Z
 * URL CDN: https://cdn.kmiza27.com
 */

const CDN_BASE = 'https://cdn.kmiza27.com';

/**
 * Gera URL completa para imagem no CDN
 */
export function getCdnImageUrl(imagePath: string): string {
  try {
    // Se já é uma URL completa, retorna como está
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Remove barra inicial se existir
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    
    // Converte caminhos antigos para novos
    let finalPath = cleanPath;
    
    // /uploads/escudos/ -> /img/escudos/
    if (finalPath.startsWith('uploads/escudos/')) {
      finalPath = finalPath.replace('uploads/escudos/', 'img/escudos/');
    }
    
    // /img/ já está correto
    if (!finalPath.startsWith('img/')) {
      finalPath = `img/${finalPath}`;
    }
    
    return `${CDN_BASE}/${finalPath}`;
  } catch (error) {
    console.error('Erro ao gerar URL CDN:', error);
    return imagePath; // Fallback para URL original
  }
}

// Funções específicas para compatibilidade
export function getTeamLogoUrl(logoPath: string): string {
  if (!logoPath) return `${CDN_BASE}/img/escudos/default-team-logo.svg`;
  return getCdnImageUrl(logoPath);
}

export function getCompetitionLogoUrl(logoPath: string): string {
  if (!logoPath) return `${CDN_BASE}/img/logo-competition/default-competition-logo.svg`;
  return getCdnImageUrl(logoPath);
}

export function getPlayerImageUrl(imagePath: string): string {
  if (!imagePath) return `${CDN_BASE}/img/players/default-player-photo.svg`;
  return getCdnImageUrl(imagePath);
}

export function getFutepediaLogoUrl(logoPath: string | null | undefined): string {
  if (!logoPath) return '/kmiza27_logo30px.gif';
  return getCdnImageUrl(logoPath);
}

export function getFutepediaOgImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return '/kmiza27_logo30px.gif';
  // Para OG Images, assumir pasta og-images
  if (imagePath.startsWith('/') && !imagePath.startsWith('/img/')) {
    return `${CDN_BASE}/img/og-images${imagePath}`;
  }
  return getCdnImageUrl(imagePath);
}
