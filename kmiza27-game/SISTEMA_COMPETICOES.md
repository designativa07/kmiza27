# 🏆 Sistema de Competições - kmiza27-game

## 📋 **Visão Geral**

O sistema de competições permite que usuários criem times e participem de diferentes tipos de campeonatos, desde competições contra a IA até partidas diretas contra outros jogadores.

## 🏗️ **Estrutura Hierárquica**

```
Série A (Tier 1) - Elite do Futebol
    ↓ (Rebaixamento)
Série B (Tier 2) - Segunda Divisão
    ↓ (Rebaixamento)
Série C (Tier 3) - Terceira Divisão
    ↓ (Rebaixamento)
Série D (Tier 4) - Divisão de Entrada
```

## 🎮 **Tipos de Competições**

### **1. Competições PvE (Player vs Environment)**
- **Série D**: Competição contra times da IA
- **Série C**: Mistura de times reais e IA
- **Características**:
  - Progressão mais previsível
  - Diferentes níveis de dificuldade
  - Ideal para novos jogadores

### **2. Competições PvP (Player vs Player)**
- **Série B**: Competição acirrada entre jogadores
- **Série A**: Elite do futebol
- **Características**:
  - Competição direta entre usuários
  - Rankings e estatísticas em tempo real
  - Maior desafio e recompensa

## ⚽ **Partidas Diretas**

### **Tipos de Partidas**

1. **Jogo Único (Single Match)**
   - Partida única entre dois times
   - Resultado final determina o vencedor
   - Ideal para amistosos ou eliminatórias simples

2. **Ida e Volta (Home & Away)**
   - Duas partidas entre os mesmos times
   - Soma dos gols determina o vencedor
   - Regra do gol fora de casa (se aplicável)
   - Ideal para eliminatórias ou confrontos importantes

### **Sistema de Convites**

- **Criação**: Usuário cria partida e envia convite
- **Aceitação**: Adversário pode aceitar ou recusar
- **Mensagens**: Possibilidade de incluir mensagem personalizada
- **Expiração**: Convites expiram em 7 dias

## 📊 **Sistema de Estatísticas**

### **Estatísticas Gerais do Time**
- Total de partidas
- Vitórias, empates, derrotas
- Gols marcados e sofridos
- Jogos sem sofrer gols (clean sheets)
- Sequências de vitórias e invencibilidade

### **Estatísticas de Confronto Direto**
- Histórico entre dois times específicos
- Vitórias de cada time
- Empates
- Total de confrontos
- Data do último confronto

## 🗄️ **Estrutura do Banco de Dados**

### **Tabelas Principais**

1. **`game_competitions`**
   - Informações das competições
   - Tipo (PvP/PvE), nível, vagas

2. **`game_competition_teams`**
   - Times inscritos em competições
   - Pontuação, posição, estatísticas

3. **`game_direct_matches`**
   - Partidas diretas entre usuários
   - Resultados, tipo de partida

4. **`game_match_invites`**
   - Sistema de convites
   - Status, mensagens, expiração

5. **`game_team_stats`**
   - Estatísticas gerais dos times
   - Histórico de performance

6. **`game_head_to_head`**
   - Estatísticas de confrontos diretos
   - Histórico entre times específicos

## 🔄 **Sistema de Promoção/Rebaixamento**

### **Regras**
- **Série D → Série C**: 4 times promovidos
- **Série C → Série B**: 4 times promovidos, 4 rebaixados
- **Série B → Série A**: 4 times promovidos, 4 rebaixados
- **Série A**: 4 times rebaixados (sem promoção)

### **Critérios de Desempate**
1. Pontos
2. Saldo de gols
3. Gols marcados
4. Confronto direto

## 🎯 **Funcionalidades Implementadas**

### **Backend**
- ✅ Módulo de competições completo
- ✅ Sistema de partidas diretas
- ✅ Sistema de convites
- ✅ Estatísticas automáticas
- ✅ Triggers para atualização de posições
- ✅ Funções para promoção/rebaixamento

### **Frontend**
- ✅ Interface de gerenciamento de competições
- ✅ Criação de partidas diretas
- ✅ Sistema de convites
- ✅ Visualização de estatísticas
- ✅ Simulação de partidas

### **API**
- ✅ Endpoints para competições
- ✅ Endpoints para partidas diretas
- ✅ Endpoints para convites
- ✅ Endpoints para estatísticas

## 🚀 **Como Usar**

### **1. Criar um Time**
```typescript
// Criar time via API
const team = await gameApi.createTeam({
  name: "Meu Time FC",
  stadium_capacity: 15000,
  colors: { primary: "#FF0000", secondary: "#FFFFFF" }
});
```

### **2. Inscrever em Competição**
```typescript
// Inscrever em Série D (PvE)
await gameApi.registerTeamInCompetition(teamId, competitionId);
```

### **3. Criar Partida Direta**
```typescript
// Criar partida contra outro usuário
await gameApi.createDirectMatch({
  match_type: 'single',
  home_team_id: myTeamId,
  away_team_id: opponentTeamId,
  match_date: '2025-01-15T20:00:00Z',
  created_by: userId,
  message: 'Vamos jogar!'
});
```

### **4. Simular Partida**
```typescript
// Simular resultado
await gameApi.simulateDirectMatch(matchId);
```

## 📈 **Próximos Passos**

### **Funcionalidades Futuras**
1. **Sistema de Temporadas**
   - Início/fim automático de temporadas
   - Processamento automático de promoções

2. **Sistema de Transferências**
   - Compra/venda de jogadores
   - Mercado de transferências

3. **Sistema de Finanças**
   - Receitas de bilheteria
   - Patrocínios
   - Gestão de orçamento

4. **Sistema de Táticas**
   - Formações personalizadas
   - Estilos de jogo
   - Influência no resultado

5. **Sistema de Torneios**
   - Copas eliminatórias
   - Fases de grupos
   - Playoffs

## 🔧 **Configuração**

### **Executar Migrações**
```sql
-- Executar o script de criação das tabelas
\i kmiza27-game/backend/database/create-competitions-system.sql
```

### **Iniciar Backend**
```bash
cd kmiza27-game/backend
npm run start:dev
```

### **Iniciar Frontend**
```bash
cd kmiza27-game/frontend
npm run dev
```

## 🎉 **Resultado**

O sistema de competições está **completamente funcional** e permite:

- ✅ Inscrição em competições hierárquicas
- ✅ Partidas diretas entre usuários
- ✅ Sistema de convites
- ✅ Estatísticas automáticas
- ✅ Simulação de resultados
- ✅ Interface intuitiva
- ✅ Progressão de divisões

O usuário pode agora criar um time, começar na Série D e progredir até a Série A, participando tanto de competições contra a IA quanto de partidas diretas contra outros jogadores! 