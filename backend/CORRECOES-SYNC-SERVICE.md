# Correções Implementadas no SyncService

## Problemas Identificados e Soluções

### 1. ❌ Chaves Duplicadas
**Problema**: `duplicar valor da chave viola a restrição de unicidade "system_settings_key_key"`

**Solução Implementada**:
- ✅ **Limpeza Prévia Melhorada**: Adicionadas tabelas `system_settings`, `bot_configs`, `migrations` na limpeza
- ✅ **Verificação de Existência**: Verifica se tabela existe antes de limpar
- ✅ **UPSERT para Chaves Únicas**: Implementado `ON CONFLICT` para tabelas com chaves únicas:
  - `system_settings` → `key`
  - `bot_configs` → `key` 
  - `whatsapp_menu_configs` → `id`
  - `migrations` → `id`

### 2. ❌ Chaves Estrangeiras
**Problema**: `inserção ou atualização viola restrição de chave estrangeira`

**Solução Implementada**:
- ✅ **Validação Prévia**: Verifica se registros referenciados existem antes de inserir
- ✅ **Filtragem de Dados Órfãos**: Remove registros que referenciam IDs inexistentes
- ✅ **Tratamento Específico por Tabela**:
  - `teams` → Verifica se `stadium_id` existe
  - `competition_teams` → Verifica se `team_id` existe
  - `users` → Define `favorite_team_id` como `null` se team não existe

### 3. ❌ Erros de JSON
**Problema**: `sintaxe de entrada inválida para o tipo de dados json`

**Solução Implementada**:
- ✅ **Tratamento de Objetos**: Converte objetos para strings JSON válidas
- ✅ **Tratamento de Arrays**: Converte arrays para strings JSON válidas
- ✅ **Fallback Seguro**: Retorna `{}` ou `[]` para dados inválidos

### 4. ❌ Limpeza Incompleta
**Problema**: Limpeza prévia não funcionava corretamente

**Solução Implementada**:
- ✅ **Verificação de Existência**: Verifica se tabela existe antes de limpar
- ✅ **Reabilitação de Constraints**: Reabilita constraints após limpeza
- ✅ **Logs Detalhados**: Mostra status de cada tabela durante limpeza

## Código das Correções

### Limpeza Prévia Melhorada
```typescript
private async cleanDevelopmentDatabase(config: pg.ClientConfig): Promise<void> {
  // Desabilitar constraints temporariamente
  await client.query('SET session_replication_role = replica;');
  
  // Incluir todas as tabelas problemáticas
  const tablesToClean = [
    'pool_participants', 'pool_matches', 'match_broadcasts', 'goals', 'matches',
    'player_team_history', 'international_teams', 'competition_teams', 'pools',
    'users', 'teams', 'competitions', 'stadiums', 'players', 'rounds', 'channels', 'titles',
    'whatsapp_menu_configs', 'simulation_results', 'system_settings', 'bot_configs', 'migrations'
  ];
  
  // Verificar existência antes de limpar
  for (const tableName of tablesToClean) {
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [tableName]);

    if (tableExists.rows[0].exists) {
      await client.query(`TRUNCATE TABLE "${tableName}" CASCADE;`);
    }
  }
  
  // Reabilitar constraints
  await client.query('SET session_replication_role = DEFAULT;');
}
```

### UPSERT para Chaves Duplicadas
```typescript
// Usar UPSERT para tabelas com chaves únicas
if (['system_settings', 'bot_configs', 'whatsapp_menu_configs', 'migrations'].includes(tableName)) {
  const keyColumn = tableName === 'system_settings' ? 'key' : 
                   tableName === 'bot_configs' ? 'key' : 
                   tableName === 'whatsapp_menu_configs' ? 'id' : 'id';
  
  const updateColumns = filteredColumns.filter(col => col !== keyColumn);
  const updateSet = updateColumns.map(col => `"${col}" = EXCLUDED."${col}"`).join(', ');
  
  insertQuery = `
    INSERT INTO "${tableName}" (${filteredColumns.map(col => `"${col}"`).join(', ')}) 
    VALUES (${placeholders})
    ON CONFLICT ("${keyColumn}") 
    DO UPDATE SET ${updateSet};
  `;
}
```

### Validação de Chaves Estrangeiras
```typescript
if (tableName === 'teams') {
  // Verificar se stadiums existem
  const stadiumIds = await this.executeQuery(developmentConfig, 'SELECT id FROM stadiums');
  const validStadiumIds = new Set(stadiumIds.map(row => row.id));
  
  validRows = sourceData.filter(row => {
    if (row.stadium_id && !validStadiumIds.has(row.stadium_id)) {
      this.logger.log(`⚠️  Removendo team ${row.name} - stadium_id ${row.stadium_id} não existe`);
      return false;
    }
    return true;
  });
}
```

## Resultados Esperados

### Antes das Correções
- ❌ Muitos erros de chave duplicada
- ❌ Erros de chave estrangeira
- ❌ Sincronização falhava completamente
- ❌ Dados inconsistentes

### Depois das Correções
- ✅ 0 erros de chave duplicada (UPSERT)
- ✅ 0 erros de chave estrangeira (validação prévia)
- ✅ Sincronização completa e robusta
- ✅ Dados consistentes e válidos

## Como Testar

1. **Via Painel Admin**: Botão "Sincronizar de Produção"
2. **Via API**: `POST /sync/from-production`
3. **Via Script**: `node test-sync-service.js`

## Logs Esperados

```
🧹 Limpando banco de desenvolvimento...
✅ Tabela system_settings limpa
✅ Tabela bot_configs limpa
📋 Sincronizando: system_settings
📊 3 registros na origem
✅ system_settings: 3 registros inseridos, 0 erros
📋 Sincronizando: bot_configs
📊 3 registros na origem
✅ bot_configs: 3 registros inseridos, 0 erros
🎉 Sincronização concluída! Total: X registros inseridos
```

## Conclusão

O SyncService agora é robusto e lida com todos os tipos de erro identificados:
- ✅ Chaves duplicadas (UPSERT)
- ✅ Chaves estrangeiras (validação prévia)
- ✅ Dados JSON inválidos (conversão segura)
- ✅ Limpeza incompleta (verificação de existência)

A sincronização deve funcionar sem erros agora!

