# 🔧 Correção de Sincronização - Guia de Uso

Este guia explica como corrigir os erros de sincronização de produção que estão ocorrendo devido a violações de chave estrangeira.

## 🚨 Problema Identificado

Os erros de sincronização estão ocorrendo porque:

1. **Dados órfãos**: Registros que referenciam IDs que não existem nas tabelas de referência
2. **Constraints não desabilitadas**: As chaves estrangeiras não estão sendo desabilitadas corretamente
3. **Ordem de sincronização**: Tabelas dependentes sendo sincronizadas antes das tabelas base

### Erros Específicos Encontrados:
- Teams faltantes: IDs 53, 54, 55, 4, 6, 8, 7, 58, 132, 133, 256, 268, 269
- Users faltantes: ID 1
- Matches faltantes: IDs 1657, 415
- Pools faltantes: ID 2

## 🛠️ Soluções Implementadas

### 1. Scripts de Correção

#### `fix-sync-foreign-keys.js`
- Limpa completamente o banco de desenvolvimento
- Desabilita constraints temporariamente
- Remove todos os dados órfãos

#### `sync-with-foreign-key-fix.js`
- Sincronização melhorada com limpeza prévia
- Ordem correta de sincronização
- Tratamento de erros robusto

#### `test-sync-fix.js`
- Testa se o banco está limpo
- Verifica conectividade com produção
- Valida configurações

#### `fix-and-sync.js`
- Script principal que executa toda a correção
- Combina limpeza + teste + sincronização

### 2. Melhorias no SyncService

- **Limpeza prévia**: Banco é limpo antes da sincronização
- **Constraints melhoradas**: Desabilitação mais robusta
- **Ordem correta**: Tabelas base antes das dependentes
- **Tratamento de erros**: Logs mais detalhados

## 🚀 Como Usar

### Opção 1: Script Completo (Recomendado)
```bash
cd backend
npm run sync:full
```

### Opção 2: Passo a Passo
```bash
cd backend

# 1. Limpar banco
npm run sync:fix

# 2. Testar configuração
npm run sync:test

# 3. Sincronizar via API (painel admin)
# Ou usar o script direto:
node scripts/sync-with-foreign-key-fix.js
```

### Opção 3: Via Painel Admin
1. Execute primeiro: `npm run sync:fix`
2. Acesse o painel admin
3. Use o botão "Sincronizar de Produção"

## 📋 Ordem de Sincronização

As tabelas são sincronizadas nesta ordem (respeitando dependências):

1. **Tabelas Base** (sem dependências):
   - `system_settings`
   - `competitions`
   - `teams`
   - `stadiums`
   - `players`
   - `rounds`
   - `channels`
   - `titles`

2. **Tabelas Dependentes**:
   - `users`
   - `matches`
   - `goals`
   - `competition_teams`
   - `international_teams`
   - `player_team_history`
   - `pools`
   - `pool_matches`
   - `pool_participants`
   - `match_broadcasts`
   - `whatsapp_menu_configs`
   - `simulation_results`

## 🔍 Verificação Pós-Sincronização

Após a sincronização, verifique:

1. **Logs do sistema**: Não deve haver erros de chave estrangeira
2. **Contagem de registros**: Tabelas devem ter dados
3. **Integridade**: Constraints devem estar ativas
4. **Funcionalidade**: Teste as funcionalidades do sistema

## ⚠️ Troubleshooting

### Erro: "Constraints não desabilitadas"
```bash
# Execute limpeza manual
npm run sync:fix
```

### Erro: "Dados órfãos ainda existem"
```bash
# Limpeza mais agressiva
node scripts/fix-sync-foreign-keys.js
```

### Erro: "Conectividade com produção"
- Verifique as variáveis de ambiente em `.env.development`
- Confirme se `PROD_DB_PASSWORD` está configurado

## 📊 Monitoramento

Os scripts fornecem logs detalhados:

- ✅ **Sucesso**: Operação concluída
- ⚠️ **Aviso**: Problema menor, continuando
- ❌ **Erro**: Problema que impede execução
- 🛑 **Parada**: Muitos erros, parando execução

## 🔄 Manutenção

Para manter a sincronização funcionando:

1. **Execute limpeza regular**: `npm run sync:fix`
2. **Monitore logs**: Verifique erros de chave estrangeira
3. **Teste periodicamente**: `npm run sync:test`
4. **Atualize scripts**: Conforme necessário

## 📝 Notas Importantes

- ⚠️ **Apenas desenvolvimento**: Scripts só funcionam em ambiente de desenvolvimento
- 🔒 **Backup**: Sempre faça backup antes de executar
- 🧪 **Teste primeiro**: Use `sync:test` antes de `sync:full`
- 📋 **Logs**: Mantenha logs para debug futuro

