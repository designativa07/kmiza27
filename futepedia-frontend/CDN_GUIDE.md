# 🖼️ Guia de Uso do CDN - Futepedia

## 📋 Visão Geral

O **Futepedia** agora utiliza o CDN `cdn.kmiza27.com` para servir todas as imagens de forma otimizada e rápida.

## 🔗 URLs do CDN

### Base URL
```
https://cdn.kmiza27.com
```

### Estrutura de Pastas
```
cdn.kmiza27.com/
├── img/
│   ├── escudos/           # Escudos dos times
│   ├── logo-competition/  # Logos das competições  
│   └── players/           # Fotos dos jogadores (futuro)
```

## 🛠️ Como Usar

### 1. Importar Utilitários
```typescript
import { getTeamLogoUrl, getCompetitionLogoUrl, getPlayerImageUrl, handleImageError } from '@/lib/cdn';
```

### 2. Escudos de Times
```tsx
<img 
  src={getTeamLogoUrl(team.logo_url)} 
  alt={team.name}
  className="h-8 w-8 object-contain"
  onError={(e) => handleImageError(e, '/default-team-logo.svg')}
/>
```

### 3. Logos de Competições
```tsx
<img 
  src={getCompetitionLogoUrl(competition.logo_url)} 
  alt={competition.name}
  className="h-10 w-10 object-contain"
  onError={(e) => handleImageError(e, '/default-competition-logo.svg')}
/>
```

### 4. Fotos de Jogadores
```tsx
<img 
  src={getPlayerImageUrl(player.image_url)} 
  alt={player.name}
  className="h-full w-full object-cover"
  onError={(e) => handleImageError(e, '/default-player-photo.svg')}
/>
```

## 🔄 Conversão Automática de URLs

A função `getTeamLogoUrl()` converte automaticamente:

| Entrada | Saída |
|---------|-------|
| `/uploads/escudos/botafogo.svg` | `https://cdn.kmiza27.com/img/escudos/botafogo.svg` |
| `/img/escudos/flamengo.png` | `https://cdn.kmiza27.com/img/escudos/flamengo.png` |
| `botafogo.svg` | `https://cdn.kmiza27.com/img/escudos/botafogo.svg` |
| `https://cdn.kmiza27.com/...` | Mantém a URL original |

## 📁 Imagens de Fallback

O sistema inclui **imagens SVG** de fallback para casos onde a imagem não carrega:

- **Times**: `/default-team-logo.svg` - Escudo genérico
- **Competições**: `/default-competition-logo.svg` - Logo com estrela
- **Jogadores**: `/default-player-photo.svg` - Silhueta de pessoa

## 🧪 Teste do CDN

Execute o script de teste para verificar se o CDN está funcionando:

```bash
node test-cdn.js
```

### Exemplo de Saída:
```
🧪 Testando URLs do CDN...

✅ https://cdn.kmiza27.com/img/escudos/botafogo.svg
   Status: 200
   Content-Type: image/svg+xml

✅ https://cdn.kmiza27.com/img/logo-competition/brasileirao.png
   Status: 200
   Content-Type: image/png

📊 Resultado: 5/5 URLs funcionando
🎉 Todos os testes passaram! CDN está funcionando.
```

## 📂 Estrutura de Arquivos Atualizada

### Componentes Atualizados:
- ✅ `src/app/page.tsx` - Página inicial
- ✅ `src/app/[competitionSlug]/jogos/page.tsx` - Página de jogos
- ✅ `src/app/time/[teamId]/page.tsx` - Página do time
- ✅ `src/components/StandingsTable.tsx` - Tabela de classificação
- ✅ `src/components/RoundMatches.tsx` - Partidas por rodada
- ✅ `src/components/TopScorersTable.tsx` - Tabela de artilheiros

### Novos Arquivos:
- ✅ `src/lib/cdn.ts` - Utilitários do CDN
- ✅ `public/default-team-logo.svg` - Fallback escudos
- ✅ `public/default-competition-logo.svg` - Fallback competições
- ✅ `public/default-player-photo.svg` - Fallback jogadores
- ✅ `test-cdn.js` - Script de teste

## 🚀 Deploy

Após as modificações, faça o deploy:

```bash
# Build local (opcional)
npm run build

# Deploy no EasyPanel será automático via Git
```

## 🔍 Debugging

### Verificar URLs no DevTools:
1. Abra **F12** → **Network**
2. Filtre por **Images**
3. Verifique se as URLs começam com `https://cdn.kmiza27.com`

### Logs no Console:
```javascript
// No navegador, teste uma URL:
fetch('https://cdn.kmiza27.com/img/escudos/botafogo.svg')
  .then(r => console.log('Status:', r.status))
  .catch(e => console.error('Erro:', e))
```

## ⚡ Performance

### Benefícios do CDN:
- **Cache Global**: Imagens servidas de servidores próximos ao usuário
- **Compressão**: Otimização automática de imagens
- **HTTP/2**: Carregamento paralelo mais eficiente
- **Fallback**: Imagens de backup em caso de erro

### Métricas Esperadas:
- ⚡ **Tempo de carregamento**: 50-200ms
- 📦 **Cache Hit Rate**: >90%
- 🔄 **Fallback Rate**: <5%

---

## 🎯 Próximos Passos

1. **Upload de Imagens**: Implementar upload direto para o CDN
2. **Otimização**: WebP/AVIF para navegadores modernos  
3. **Lazy Loading**: Carregamento sob demanda
4. **Progressive Images**: Placeholder → Baixa qualidade → Alta qualidade

---

**✅ CDN Configurado e Funcionando!**
Todas as imagens do Futepedia agora são servidas via `cdn.kmiza27.com` com fallbacks automáticos. 