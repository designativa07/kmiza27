# 🎥 Guia de Embed de Vídeo - Futepedia

## 📋 Visão Geral

O **Futepedia** agora suporta **embed automático de vídeos** diretamente na página da partida! Quando uma partida tem links de transmissão (YouTube, Vimeo, Twitch), os usuários podem assistir ao vivo sem sair do site.

## ✨ Funcionalidades

### 🎯 **Player Inline**
- **YouTube**: Embed automático com player responsivo
- **Vimeo**: Suporte completo para vídeos do Vimeo
- **Twitch**: Player integrado para streams do Twitch
- **Globoplay**: Link direto com mensagem explicativa (não suporta embed)
- **Outros serviços**: Link direto para serviços não suportados

### 🎨 **Interface Moderna**
- Vídeo visível por padrão (não precisa clicar para ver)
- Botão "Ocultar" compacto posicionado abaixo do vídeo à direita
- Player inline responsivo (não abre modal)
- Design responsivo para mobile e desktop
- Ícones intuitivos para diferentes tipos de transmissão
- Layout otimizado com card de transmissão em largura total
- Controles organizados no footer do player
- **Botão "+LINK"** para adicionar múltiplas transmissões dinamicamente
- **Gerenciamento de links** com opção de remoção individual
- **Formulário inline** para adicionar novos links de transmissão

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

## Como Usar

### 1. **Adicionar Links de Transmissão (Formulários Administrativos)**

Para adicionar múltiplos links de transmissão a uma partida, use os formulários administrativos:

- **ADICIONAR JOGO**: Acesse o painel admin → Jogos → "+ Adicionar Jogo"
- **EDITAR JOGO**: Acesse o painel admin → Jogos → Clique em "Editar" em qualquer jogo

No campo **"LINK direto para transmissão"**:

1. **Digite URLs diretamente**: Cole uma ou mais URLs separadas por vírgula
   ```
   https://www.youtube.com/watch?v=..., https://globoplay.globo.com/tv-globo/ao-vivo/6120663/
   ```

2. **Use o botão +LINK**: Clique no botão azul "+LINK" ao lado do campo para adicionar URLs uma por vez
   - O sistema mostrará um prompt para inserir a nova URL
   - Cada URL será adicionada à lista existente

3. **Visualize os links**: Os links aparecerão como "chips" abaixo do campo de input
   - Cada chip mostra a URL completa
   - Use o botão "X" vermelho para remover links individuais

4. **Salve o jogo**: Clique em "Salvar" para persistir as alterações

### 2. **Visualizar Transmissões na Página da Partida**

Após salvar, os links aparecerão automaticamente na página pública da partida:

- **YouTube, Vimeo, Twitch**: Players embutidos funcionais
- **Globoplay**: Card especial com link direto (devido a restrições de direitos autorais)
- **Outros links**: Botões de acesso direto

### 3. **Formatos de Dados Suportados**

O sistema aceita múltiplos formatos para `broadcast_channels`:

```json
// String única
"https://www.youtube.com/watch?v=..."

// Array de strings
["https://www.youtube.com/watch?v=...", "https://globoplay.globo.com/..."]

// String com vírgulas (formato do formulário)
"https://www.youtube.com/watch?v=..., https://globoplay.globo.com/..."
```

## Interface Moderna

### **Formulários Administrativos**
- ✅ Botão **+LINK** azul ao lado do campo de transmissão
- ✅ **Chips visuais** para cada URL adicionada
- ✅ Botões **X** para remoção individual
- ✅ **Placeholder** sugerindo múltiplos links
- ✅ **Processamento automático** de vírgulas para arrays

### **Página Pública da Partida**
- ✅ **Sem botão +LINK** (funcionalidade apenas administrativa)
- ✅ **Players embutidos** para YouTube, Vimeo, Twitch
- ✅ **Card especial** para Globoplay com explicação
- ✅ **Layout responsivo** ocupando toda a largura disponível
- ✅ **Botão "Ocultar"** reposicionado abaixo do vídeo

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

### **Globoplay**
```typescript
"https://globoplay.globo.com/tv-globo/ao-vivo/6120663/"
"https://globoplay.globo.com/programa/ID_DO_PROGRAMA"
"https://globoplay.globo.com/novela/ID_DA_NOVELA"
```

> **⚠️ Limitação**: O Globoplay não permite embed direto devido à política de segurança `X-Frame-Options: sameorigin`. Em vez disso, mostra um card informativo com link direto para o serviço.

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
1. **Página da Partida** (`/jogos/1031`):
   - Acesse uma partida com `broadcast_channels` preenchido
   - Verifique se o vídeo já está visível na seção "Transmissão"
   - Teste o botão "Ocultar" (compacto, à direita, abaixo do vídeo)
   - Confirme que o card de transmissão ocupa toda a largura disponível
   - Teste em diferentes tamanhos de tela
   - Verifique o card especial do Globoplay (não permite embed)

2. **Formulário Administrativo**:
   - Acesse o painel admin → Jogos → "+ Adicionar Jogo"
   - Na seção "Transmissão", teste o botão **"+LINK"** azul
   - Adicione múltiplas URLs (YouTube, Globoplay, etc.)
   - Verifique se os links aparecem como chips removíveis
   - Teste a remoção de links individuais com o botão **"X"**
   - Salve o jogo e verifique se os links funcionam na página da partida

3. **Funcionalidade "+LINK" na Página da Partida**:
   - Clique no botão "+LINK" na seção "Assistir ao Vivo Online"
   - Adicione uma nova URL de transmissão
   - Verifique se o novo player aparece
   - Teste a remoção de links individuais

## 🚀 Próximos Passos

### **Melhorias Futuras**
- [ ] Suporte a mais plataformas (Facebook Live, Instagram Live, Band TV)
- [ ] Player com controles personalizados
- [ ] Cache de vídeos para melhor performance
- [ ] Analytics de visualização
- [ ] Qualidade de vídeo configurável
- [ ] Suporte a mais canais brasileiros (SBT, Record, etc.)

### **Integrações**
- [ ] API do YouTube para metadados
- [ ] Webhooks para status ao vivo
- [ ] Notificações push para início de transmissão

## 📚 Referências

- [YouTube Embed API](https://developers.google.com/youtube/iframe_api)
- [Vimeo Player API](https://developer.vimeo.com/player/sdk)
- [Twitch Embed](https://dev.twitch.tv/docs/embed)
- [Globoplay](https://globoplay.globo.com/)
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
