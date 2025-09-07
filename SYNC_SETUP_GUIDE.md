# Guia de Configuração - Sincronização de Dados

## Visão Geral

Este guia explica como configurar e usar a funcionalidade de sincronização de dados de produção para desenvolvimento.

## Funcionalidade

A funcionalidade permite sincronizar todos os dados do banco de produção (`195.200.0.191:5433`) para o banco de desenvolvimento local, facilitando o desenvolvimento com dados reais.

## Configuração

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env` no backend:

```bash
# Configurações do Banco de Dados - Produção (para sincronização)
PROD_DB_USERNAME=postgres
PROD_DB_PASSWORD=sua_senha_de_producao_aqui
```

### 2. Configuração do Banco de Desenvolvimento

Certifique-se de que seu banco de desenvolvimento está configurado:

```bash
# Configurações do Banco de Dados - Desenvolvimento
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=sua_senha_local
DB_DATABASE=kmiza27_dev
```

## Como Usar

### 1. Acessar a Página

1. Inicie o servidor de desenvolvimento: `npm run dev`
2. Acesse o painel administrativo: `http://localhost:3002`
3. Faça login como administrador
4. No menu lateral, clique em "Sincronização"

### 2. Verificar Conexão

1. Na página de sincronização, clique em "Verificar Conexão"
2. O sistema irá testar a conexão com o banco de produção
3. Se bem-sucedido, você verá o número de tabelas disponíveis

### 3. Executar Sincronização

⚠️ **ATENÇÃO**: Esta operação é irreversível e substituirá TODOS os dados do banco de desenvolvimento!

1. Clique em "Sincronizar de Produção"
2. Confirme a operação no diálogo de confirmação
3. Aguarde a conclusão (pode demorar alguns minutos)
4. Verifique o resultado na tabela de detalhes

## Segurança

### Restrições de Ambiente

- ✅ **Funciona apenas em desenvolvimento** (`NODE_ENV=development`)
- ❌ **Bloqueado em produção** por segurança
- 🔐 **Requer credenciais de administrador**

### Validações

- Verificação de ambiente antes da execução
- Confirmação obrigatória do usuário
- Logs detalhados de todas as operações
- Tratamento de erros por tabela

## Estrutura Técnica

### Backend

- **Serviço**: `backend/src/modules/sync/sync.service.ts`
- **Controller**: `backend/src/modules/sync/sync.controller.ts`
- **Módulo**: `backend/src/modules/sync/sync.module.ts`

### Endpoints

- `GET /sync/environment-info` - Informações do ambiente
- `GET /sync/check-production` - Verificar conexão com produção
- `POST /sync/from-production` - Executar sincronização

### Frontend

- **Página**: `frontend/src/app/sync/page.tsx`
- **Menu**: Adicionado ao Dashboard principal

## Processo de Sincronização

1. **Verificação de Ambiente**: Confirma que está em desenvolvimento
2. **Conexão com Produção**: Estabelece conexão com banco de produção
3. **Listagem de Tabelas**: Obtém todas as tabelas do banco de produção
4. **Ordenação por Dependências**: Ordena tabelas para respeitar chaves estrangeiras
5. **Desabilitação de Constraints**: Desabilita temporariamente as constraints de FK
6. **Processamento por Tabela**:
   - Obtém estrutura da tabela
   - Busca todos os dados da tabela origem
   - Processa dados específicos (JSON, campos problemáticos)
   - Limpa tabela destino (`TRUNCATE CASCADE`)
   - Insere dados na tabela destino
7. **Reabilitação de Constraints**: Reabilita as constraints de FK
8. **Relatório Final**: Mostra estatísticas e erros por tabela

### Melhorias Implementadas

- **✅ Ordem de Sincronização**: Tabelas são sincronizadas na ordem correta das dependências
- **✅ Desabilitação de Constraints**: Constraints de FK são desabilitadas temporariamente
- **✅ Tratamento de Dados Específicos**: Problemas conhecidos são tratados automaticamente
- **✅ Tratamento de Erros**: Sistema continua mesmo com erros em tabelas específicas
- **✅ Logs Detalhados**: Logs completos para debug e monitoramento

## Tratamento de Erros

### Erros Comuns

- **Credenciais não configuradas**: Configure `PROD_DB_PASSWORD`
- **Conexão recusada**: Verifique se o servidor de produção está acessível
- **Timeout**: Operação pode demorar para bancos grandes
- **Erro por tabela**: Algumas tabelas podem falhar, mas outras continuam

### Logs

Todos os logs são registrados no console do backend com nível `INFO` e `ERROR`.

## Exemplo de Uso

### Método 1: Via Interface Web (Recomendado)

```bash
# 1. Configurar variáveis de ambiente
echo "PROD_DB_PASSWORD=minha_senha_secreta" >> backend/.env

# 2. Iniciar desenvolvimento
npm run dev

# 3. Acessar painel admin
# http://localhost:3002

# 4. Navegar para Sincronização
```

### Método 2: Via Script de Teste

```bash
# 1. Preparar banco de desenvolvimento (opcional)
psql -h localhost -p 5432 -U postgres -d kmiza27_dev -f backend/scripts/prepare-dev-db.sql

# 2. Executar teste da versão corrigida
cd backend
node scripts/test-sync-fixed.js

# 3. Executar teste com fallback de credenciais (se o anterior falhar)
node scripts/test-sync-with-fallback.js

# 4. Executar teste simples de sincronização (alternativo)
node scripts/simple-sync-test.js

# 5. Verificar configurações do ambiente (se houver erros de conexão)
node scripts/check-env-config.js

# 6. Verificar dados reais de produção (se muitas tabelas vazias)
node scripts/check-production-data.js

# 7. Verificar contagens diretas no banco de produção
node scripts/verify-production-counts.js

# 8. Executar debug detalhado de erros (se necessário)
node scripts/debug-sync-errors.js
```

### Método 3: Via API Direta

```bash
# 1. Verificar conexão
curl -X GET http://localhost:3000/sync/check-production

# 2. Executar sincronização
curl -X POST http://localhost:3000/sync/from-production \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```
## Troubleshooting

### Problema: "Credenciais de produção não configuradas"

**Solução**: Adicione `PROD_DB_PASSWORD` ao arquivo `.env` do backend.

### Problema: "Token de acesso não fornecido"

**Causa**: Endpoints de sincronização requerem autenticação de administrador.

**Solução**: Use o script `test-sync-fixed.js` que faz login automaticamente com as credenciais:
- **Usuário**: `antonioddd48@gmail.com`
- **Senha**: `@toni123`

### Problema: "Muitos erros na tabela X"

**Causa**: Constraints de chave estrangeira ou incompatibilidade de dados entre produção e desenvolvimento.

**Soluções**:
1. **Executar script de preparação**:
   ```bash
   psql -h localhost -p 5432 -U postgres -d kmiza27_dev -f backend/scripts/prepare-dev-db.sql
   ```

2. **Testar tabelas individualmente**:
   ```bash
   cd backend
   node scripts/simple-sync-test.js
   ```

3. **Verificar logs detalhados** no console do backend para identificar erros específicos.

### Problema: "Tabela teams com erro de JSON"

**Causa**: Campos JSON malformados na tabela teams.

**Solução**: O sistema agora processa automaticamente campos JSON problemáticos, convertendo-os para string válida.

### Problema: "Coluna retention_days não existe"

**Causa**: Estrutura da tabela simulation_results diferente entre produção e desenvolvimento.

**Solução**: O script de preparação adiciona automaticamente a coluna se não existir.

### Problema: "Banco local fica vazio após sincronização"

**Causa**: Muitos erros impedem a sincronização completa.

**Soluções**:
1. **Verificar logs** do backend para identificar tabelas com erro
2. **Executar preparação** do banco de desenvolvimento
3. **Testar sincronização** com logs detalhados
4. **Verificar constraints** de chave estrangeira

### Problema: "Sincronização só é permitida em ambiente de desenvolvimento"

**Solução**: Certifique-se de que `NODE_ENV=development` está configurado.

### Problema: "Erro ao conectar com produção"

**Solução**: 
1. Verifique se o servidor de produção está acessível
2. Confirme as credenciais de acesso
3. Teste a conectividade de rede

### Problema: Algumas tabelas falharam na sincronização

**Solução**: 
1. Verifique os logs do backend para detalhes do erro
2. Algumas tabelas podem ter restrições de chave estrangeira
3. Execute novamente se necessário (dados serão substituídos)

## Considerações de Performance

- **Tempo estimado**: 2-5 minutos para bancos médios
- **Memória**: Operação usa memória proporcional ao tamanho dos dados
- **Rede**: Requer conexão estável com servidor de produção
- **Disco**: Certifique-se de ter espaço suficiente no banco local

## Backup Recomendado

Antes de executar a sincronização, considere fazer backup do banco local:

```bash
# Backup do banco de desenvolvimento
pg_dump -h localhost -U postgres -d kmiza27_dev > backup_before_sync.sql

# Restaurar se necessário
psql -h localhost -U postgres -d kmiza27_dev < backup_before_sync.sql
```
