# ❤️ Funcionalidade de Time Favorito

## 📋 Visão Geral

Implementamos uma funcionalidade completa para que usuários possam definir seu time favorito via WhatsApp e receber resumos personalizados com informações sobre último jogo, próximo jogo e classificação na competição.

## 🚀 Funcionalidades Implementadas

### 1. **Definir Time Favorito**
- **Comando:** `CMD_DEFINIR_TIME_FAVORITO`
- **Ação:** Permite ao usuário escolher seu time favorito
- **Fluxo:** Usuário seleciona o comando → Digita o nome do time → Sistema confirma e salva

### 2. **Resumo do Time Favorito**
- **Comando:** `CMD_MEU_TIME_FAVORITO`
- **Ação:** Exibe resumo completo do time favorito incluindo:
  - 🏁 Último jogo
  - ⚽ Próximo jogo
  - 📊 Classificação na competição
  - 💡 Dicas de comandos específicos

### 3. **Alterar Time Favorito**
- **Comando:** `CMD_ALTERAR_TIME_FAVORITO`
- **Ação:** Permite trocar o time favorito por outro
- **Fluxo:** Usuário seleciona o comando → Digita o novo time → Sistema confirma e atualiza

### 4. **Remover Time Favorito**
- **Comando:** `CMD_REMOVER_TIME_FAVORITO`
- **Ação:** Remove o time favorito do usuário
- **Confirmação:** Sistema confirma a remoção

## 📱 Como Usar no WhatsApp

### Para Usuários:
1. **Definir Time Favorito:**
   - Digite "menu" ou use o botão do menu
   - Selecione "❤️ Definir Time Favorito"
   - Digite o nome do time (ex: Flamengo, Palmeiras, Corinthians)

2. **Ver Resumo do Time:**
   - Digite "menu" ou use o botão do menu
   - Selecione "📊 Resumo do Meu Time"
   - Receba informações completas do seu time

3. **Alterar Time:**
   - Digite "menu" ou use o botão do menu
   - Selecione "🔄 Alterar Time Favorito"
   - Digite o nome do novo time

4. **Remover Time:**
   - Digite "menu" ou use o botão do menu
   - Selecione "❌ Remover Time Favorito"
   - Confirme a remoção

## 🔧 Implementação Técnica

### Backend (`backend/src/chatbot/chatbot.service.ts`)

#### Novos Comandos Adicionados:
```typescript
// Comandos para gerenciar time favorito
case 'CMD_DEFINIR_TIME_FAVORITO':
  await this.setUserConversationState(phoneNumber, 'waiting_team_for_favorite');
  return '❤️ Qual é o seu time favorito?\n\nPor favor, digite o nome do time (ex: Flamengo, Palmeiras, Corinthians):';

case 'CMD_MEU_TIME_FAVORITO':
  return await this.getFavoriteTeamSummary(phoneNumber);

case 'CMD_ALTERAR_TIME_FAVORITO':
  await this.setUserConversationState(phoneNumber, 'waiting_team_for_favorite');
  return '🔄 Qual será seu novo time favorito?\n\nPor favor, digite o nome do time:';

case 'CMD_REMOVER_TIME_FAVORITO':
  return await this.removeFavoriteTeam(phoneNumber);
```

#### Novos Estados de Conversa:
```typescript
case 'waiting_team_for_favorite':
  response = await this.setFavoriteTeam(phoneNumber, message);
  break;
```

#### Funções Implementadas:
- `getFavoriteTeamSummary()`: Gera resumo completo do time favorito
- `setFavoriteTeam()`: Define ou altera o time favorito
- `removeFavoriteTeam()`: Remove o time favorito

### Menu WhatsApp (`backend/src/modules/whatsapp-menu/whatsapp-menu.service.ts`)

#### Nova Seção Adicionada:
```typescript
{
  title: '❤️ Meu Time Favorito',
  rows: [
    { id: 'CMD_DEFINIR_TIME_FAVORITO', title: '❤️ Definir Time Favorito', description: 'Escolher seu time favorito' },
    { id: 'CMD_MEU_TIME_FAVORITO', title: '📊 Resumo do Meu Time', description: 'Ver resumo do seu time favorito' },
    { id: 'CMD_ALTERAR_TIME_FAVORITO', title: '🔄 Alterar Time Favorito', description: 'Trocar seu time favorito' },
    { id: 'CMD_REMOVER_TIME_FAVORITO', title: '❌ Remover Time Favorito', description: 'Remover time favorito' }
  ]
}
```

### Entidade User (`backend/src/entities/user.entity.ts`)

#### Campo Atualizado:
```typescript
@ManyToOne(() => Team, { nullable: true })
@JoinColumn({ name: 'favorite_team_id' })
favorite_team: Team | null;
```

## 🧪 Scripts de Teste

### 1. Testar Funcionalidade:
```bash
cd backend
node scripts/test-favorite-team.js
```

### 2. Adicionar ao Menu:
```bash
cd backend
node scripts/add-favorite-team-menu.js
```

### 3. Resetar Menu (Recomendado):
```bash
cd backend
node scripts/reset-menu-with-favorite-team.js
```

## 📊 Resumo Personalizado

O resumo do time favorito inclui:

1. **🏁 Último Jogo:**
   - Data e horário
   - Times participantes
   - Placar final
   - Competição

2. **⚽ Próximo Jogo:**
   - Data e horário
   - Times participantes
   - Local do jogo
   - Competição

3. **📊 Classificação:**
   - Posição na tabela
   - Pontos
   - Jogos disputados
   - Saldo de gols

4. **💡 Dicas:**
   - Comandos específicos para mais informações
   - Links para detalhes completos

## 🔄 Fluxo de Dados

```
Usuário → WhatsApp → Chatbot → Processamento → Banco de Dados
   ↓
Resposta ← Resumo Personalizado ← Busca de Dados ← Times/Jogos
```

## 🎯 Benefícios

1. **Experiência Personalizada:** Usuários recebem informações específicas do seu time
2. **Facilidade de Uso:** Interface intuitiva via menu WhatsApp
3. **Informações Completas:** Resumo com último jogo, próximo jogo e classificação
4. **Flexibilidade:** Possibilidade de alterar ou remover time favorito
5. **Integração:** Funciona perfeitamente com o sistema existente

## 🚀 Próximos Passos

1. **Testar em Produção:** Verificar funcionamento com usuários reais
2. **Métricas:** Acompanhar uso da funcionalidade
3. **Melhorias:** Adicionar mais informações ao resumo (estatísticas, escalação, etc.)
4. **Notificações:** Implementar alertas para jogos do time favorito

---

**✅ Funcionalidade implementada e pronta para uso!** 