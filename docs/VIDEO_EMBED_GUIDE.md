# 🎥 Guia de Embed de Vídeo - Futepedia

## 📋 Visão Geral

O **Futepedia** agora suporta **embed automático de vídeos** diretamente na página da partida! Quando uma partida tem links de transmissão (YouTube, Vimeo, Twitch), os usuários podem assistir ao vivo sem sair do site.

## ✨ Funcionalidades

### 🎯 **Player Inline**
- **YouTube**: Embed automático com player responsivo
- **Vimeo**: Suporte completo para vídeos do Vimeo
- **Twitch**: Player integrado para streams do Twitch
- **Outros serviços**: Link direto para serviços não suportados

### 🎨 **Interface Moderna**
- Vídeo visível por padrão (não precisa clicar para ver)
- Botão "Ocultar" compacto posicionado abaixo do vídeo à direita
- Player inline responsivo (não abre modal)
- Design responsivo para mobile e desktop
- Ícones intuitivos para diferentes tipos de transmissão
- Layout otimizado com card de transmissão em largura total
- Controles organizados no footer do player

## 🛠️ Como Implementar

### 1. **Estrutura de Dados**
A funcionalidade usa o campo `broadcast_channels` na tabela `matches`:

```sql
-- Exemplo de dados
UPDATE matches 
SET broadcast_channels = '["https://www.youtube.com/watch?v=VIDEO_ID"]'
WHERE id = 1031;
```

### 2. **Componentes Criados**
- `InlineVideoPlayer.tsx` - Player de vídeo inline
- `MatchBroadcastSection.tsx` - Seção organizada de transmissão
- `VideoPlayer.tsx` - Player com modal (alternativa)

### 3. **Integração na Página**
A página `jogos/[matchId]/page.tsx` foi atualizada para usar:

```tsx
<MatchBroadcastSection
  broadcasts={match.broadcasts}
  broadcastChannels={match.broadcast_channels}
  homeTeamName={match.home_team.name}
  awayTeamName={match.away_team.name}
/>
```

## 📱 Como Usar

### **Para Usuários Finais**
1. Acesse a página de uma partida (ex: `/jogos/1031`)
2. Na seção "Transmissão", o vídeo já estará visível por padrão
3. Clique no botão "Ocultar" (à direita, abaixo do vídeo) para esconder
4. Clique em "MOSTRAR TRANSMISSÃO" para exibir novamente

### **Para Administradores**
1. Adicione links de transmissão no campo `broadcast_channels`
2. Suporte para múltiplos links (array JSON)
3. Links são automaticamente detectados e convertidos para embed

## 🔧 Suporte a URLs

### **YouTube**
```typescript
// Formatos suportados:
"https://www.youtube.com/watch?v=VIDEO_ID"
"https://youtu.be/VIDEO_ID"
"https://youtube.com/watch?v=VIDEO_ID&t=30s"
```

### **Vimeo**
```typescript
"https://vimeo.com/VIDEO_ID"
"https://player.vimeo.com/video/VIDEO_ID"
```

### **Twitch**
```typescript
"https://www.twitch.tv/videos/VIDEO_ID"
"https://twitch.tv/videos/VIDEO_ID"
```

## 🎨 Personalização

### **Estilos CSS**
Os componentes usam Tailwind CSS e podem ser personalizados:

```tsx
// Cores do botão
className="bg-gradient-to-r from-purple-600 to-blue-600"

// Tamanho do player
style={{ paddingBottom: '56.25%' }} // 16:9 aspect ratio
```

### **Ícones**
Usa Lucide React para ícones consistentes:
- `Play` - Botão de play
- `X` - Botão de fechar
- `ExternalLink` - Link externo
- `Globe` - Transmissão online
- `Tv` - Canais de TV

## 🧪 Testando

### **Script de Teste**
Execute o script para adicionar um link de teste:

```bash
cd scripts
node test-video-embed.js
```

### **Verificação Manual**
1. Acesse uma partida com `broadcast_channels` preenchido
2. Verifique se o vídeo já está visível na seção "Transmissão"
3. Teste o botão "Ocultar" (compacto, à direita, abaixo do vídeo)
4. Confirme que o card de transmissão ocupa toda a largura disponível
5. Teste em diferentes tamanhos de tela

## 🚀 Próximos Passos

### **Melhorias Futuras**
- [ ] Suporte a mais plataformas (Facebook Live, Instagram Live)
- [ ] Player com controles personalizados
- [ ] Cache de vídeos para melhor performance
- [ ] Analytics de visualização
- [ ] Qualidade de vídeo configurável

### **Integrações**
- [ ] API do YouTube para metadados
- [ ] Webhooks para status ao vivo
- [ ] Notificações push para início de transmissão

## 📚 Referências

- [YouTube Embed API](https://developers.google.com/youtube/iframe_api)
- [Vimeo Player API](https://developer.vimeo.com/player/sdk)
- [Twitch Embed](https://dev.twitch.tv/docs/embed)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/)

## 🤝 Contribuição

Para contribuir com melhorias:
1. Teste a funcionalidade existente
2. Identifique áreas de melhoria
3. Crie um PR com suas mudanças
4. Mantenha a consistência com o design atual

---

**🎉 A funcionalidade está pronta para uso!** Os usuários agora podem assistir transmissões ao vivo diretamente no Futepedia.
