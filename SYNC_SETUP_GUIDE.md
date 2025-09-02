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
4. **Processamento por Tabela**:
   - Obtém estrutura da tabela
   - Busca todos os dados da tabela origem
   - Limpa tabela destino (`TRUNCATE CASCADE`)
   - Insere dados na tabela destino
5. **Relatório Final**: Mostra estatísticas e erros por tabela

## Tratamento de Erros

### Erros Comuns

- **Credenciais não configuradas**: Configure `PROD_DB_PASSWORD`
- **Conexão recusada**: Verifique se o servidor de produção está acessível
- **Timeout**: Operação pode demorar para bancos grandes
- **Erro por tabela**: Algumas tabelas podem falhar, mas outras continuam

### Logs

Todos os logs são registrados no console do backend com nível `INFO` e `ERROR`.

## Exemplo de Uso

```bash
# 1. Configurar variáveis de ambiente
echo "PROD_DB_PASSWORD=minha_senha_secreta" >> backend/.env

# 2. Iniciar desenvolvimento
npm run dev

# 3. Acessar painel admin
# http://localhost:3002

# 4. Navegar para Sincronização
# 5. Verificar conexão
# 6. Executar sincronização
```

## Troubleshooting

### Problema: "Credenciais de produção não configuradas"

**Solução**: Adicione `PROD_DB_PASSWORD` ao arquivo `.env` do backend.

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
