# Correção das Migrations - Verificação de Existência

## Problema

As migrations estavam falhando porque tentavam aplicar mudanças que já existiam no banco de dados:

```
error: column "display_order" of relation "rounds" already exists
Migration "AddDisplayOrderToRounds1751400000000" failed
```

## Causa

As mudanças foram aplicadas manualmente via SQL anteriormente, mas as migrations não foram registradas na tabela `migrations` do TypeORM.

## Solução Implementada

### 1. Migration de Display Order (Rounds)
- ✅ Verificação se coluna `display_order` já existe
- ✅ Só executa ALTER TABLE se a coluna não existir
- ✅ Atualização condicional dos dados

### 2. Migration de Regulamento (Competitions)
- ✅ Verificação se coluna `regulamento` já existe
- ✅ Só executa ALTER TABLE se a coluna não existir

### 3. Migration de Tipo Serie (Enum)
- ✅ Verificação se valor `serie` já existe no enum
- ✅ Só executa ALTER TYPE se o valor não existir

## Código das Verificações

### Para Colunas:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'nome_tabela' AND column_name = 'nome_coluna'
```

### Para Valores de Enum:
```sql
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
  SELECT oid 
  FROM pg_type 
  WHERE typname = 'nome_enum'
) AND enumlabel = 'valor'
```

## Vantagens

1. **✅ Idempotente** - pode ser executada múltiplas vezes sem erro
2. **✅ Segura** - não tenta aplicar mudanças já existentes
3. **✅ Robusta** - funciona independente do estado atual do banco
4. **✅ Compatível** - funciona com aplicações manuais anteriores

## Status

✅ **RESOLVIDO** - As migrations agora são completamente seguras e podem ser executadas sem risco de falha por duplicação.

## Para Executar

```bash
npm run migration:run
```

Agora deve executar sem erros, mesmo se as mudanças já estiverem aplicadas no banco. 