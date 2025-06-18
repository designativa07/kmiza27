# Solução: Erro 500 (SSR) no Futepedia

## Problema Identificado
O site estava apresentando **erro 500 (Internal Server Error)** devido a problemas de **Server-Side Rendering (SSR)** causados pela integração do CDN.

## Causa Raiz
1. **Função `handleImageError`**: Estava sendo importada em Server Components, mas continha código do cliente (`event.currentTarget`)
2. **Hydration Mismatch**: Diferenças entre renderização no servidor e cliente
3. **Tratamento de Erro Inadequado**: Funções CDN não tinham proteção contra erros no SSR

## Soluções Implementadas

### 1. Corrigida Função `handleImageError`
```typescript
// ANTES (problemático)
export function handleImageError(event: React.SyntheticEvent<HTMLImageElement>, fallbackSrc: string) {
  const target = event.currentTarget; // ❌ Problemático no SSR
  if (target.src !== fallbackSrc) {
    target.src = fallbackSrc;
  }
}

// DEPOIS (compatível com SSR)
export function handleImageError(event: any, fallbackSrc: string): void {
  if (isServer) return; // ✅ Verifica se está no servidor
  
  try {
    const target = event?.currentTarget || event?.target;
    if (target && target.src !== fallbackSrc) {
      target.src = fallbackSrc;
    }
  } catch (error) {
    console.warn('Erro ao definir fallback de imagem:', error);
  }
}
```

### 2. Adicionado Try-Catch nas Funções CDN
```typescript
export function getTeamLogoUrl(logoUrl: string | null | undefined): string {
  try {
    // Lógica de conversão...
    return convertedUrl;
  } catch (error) {
    if (isServer) {
      console.warn('Erro na função getTeamLogoUrl:', error);
    }
    return '/default-team-logo.svg';
  }
}
```

### 3. Removido `onError` de Server Components
```typescript
// ANTES (problemático em Server Components)
<img 
  src={getTeamLogoUrl(team.logo_url)} 
  alt="Logo"
  onError={(e) => handleImageError(e, '/fallback.svg')} // ❌
/>

// DEPOIS (seguro para SSR)
<img 
  src={getCdnImageUrl(team.logo_url, 'team')} 
  alt="Logo"
  // ✅ Sem onError no servidor
/>
```

### 4. Criada Versão Simplificada do CDN
Arquivo `src/lib/cdn-simple.ts` com:
- ✅ Uma única função robusta: `getCdnImageUrl()`
- ✅ Tratamento de erro completo
- ✅ Fallbacks automáticos
- ✅ Compatibilidade total com SSR

## Status da Correção
- ✅ **Server Components** agora são seguros
- ✅ **Funções CDN** com proteção de erro
- ✅ **Fallbacks automáticos** funcionando
- ✅ **Hydration mismatch** resolvido

## Uso Recomendado
```typescript
import { getCdnImageUrl } from '@/lib/cdn-simple';

// Para escudos de times
<img src={getCdnImageUrl(team.logo_url, 'team')} alt="Time" />

// Para logos de competições  
<img src={getCdnImageUrl(competition.logo_url, 'competition')} alt="Competição" />

// Para fotos de jogadores
<img src={getCdnImageUrl(player.image_url, 'player')} alt="Jogador" />
```

## Resultado
O site deve voltar a funcionar normalmente sem erros 500, mantendo a funcionalidade completa do CDN. 