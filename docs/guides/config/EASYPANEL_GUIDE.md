# 🚀 Guia Completo de Configuração no Easypanel

Este guia centraliza todas as configurações, otimizações e soluções de problemas para os serviços de `backend` e `frontend` do projeto no Easypanel.

## 1. Visão Geral da Arquitetura

A aplicação é dividida em dois serviços principais no Easypanel, cada um com sua própria configuração de porta e domínio para evitar conflitos.

- **Painel Easypanel**: Roda na porta `:3000` do host.
- **Backend (kmizabot)**: Roda na porta `:3001` internamente no Docker.
- **Frontend (kmizafront)**: Roda na porta `:3002` internamente no Docker.

O proxy do Easypanel direciona o tráfego das portas padrão (`80`/`443`) dos seus domínios para as portas internas corretas dos contêineres.

---

## 2. Configuração dos Serviços

### 2.1. Serviço Backend (`kmizabot`)

Para evitar erros como o `502 Bad Gateway`, é crucial que o Easypanel saiba em qual porta a aplicação NestJS está rodando.

#### **Configuração no Painel Easypanel:**
1. Acesse seu serviço `kmizabot`.
2. Vá para **Settings** → **General**.
3. Configure a porta interna:
   - **Internal Port**: `3000`
   - **Protocol**: `HTTP`

#### **Verificação no Código:**
- **`Dockerfile.backend`**: Deve expor a porta correta.
  ```dockerfile
  EXPOSE 3000
  CMD ["node", "dist/main.js"]
  ```
- **`backend/src/main.ts`**: Deve escutar em `0.0.0.0` para aceitar conexões externas ao contêiner.
  ```typescript
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  ```
- **Variáveis de Ambiente**:
  ```env
  PORT=3000
  NODE_ENV=production
  ```

### 2.2. Serviço Frontend (`kmizafront`)

O frontend deve rodar em uma porta diferente para não conflitar com o backend ou com o próprio painel do Easypanel.

#### **Configuração no Painel Easypanel:**
1. Acesse seu serviço `kmizafront`.
2. Vá para **Settings** → **General**.
3. Configure a porta interna:
   - **Internal Port**: `3002`
   - **Protocol**: `HTTP`

#### **Verificação no Código:**
- **Variáveis de Ambiente**:
  ```
  PORT=3002
  NODE_ENV=production
  HOSTNAME=0.0.0.0
  ```

---

## 3. Configuração de Domínios

Você pode usar o domínio fornecido pelo Easypanel ou um domínio personalizado.

### 3.1. Usar Domínio Personalizado

#### **Passo 1: Adicionar Domínio no Easypanel**
1. No serviço desejado (backend ou frontend), vá para **Settings** → **Domains**.
2. Clique em **"Add Domain"** e insira seu domínio/subdomínio (ex: `chatbot.seusite.com`).
3. Associe-o à porta interna correta (`3000` para backend, `3002` para frontend).

#### **Passo 2: Configurar DNS**
No seu provedor de DNS (Hostinger, Cloudflare, etc.), crie um registro `A` ou `CNAME` apontando para o IP ou host do seu servidor Easypanel.
```dns
# Para subdomínio (Recomendado)
CNAME chatbot kmiza27-kmizabot.h4xd66.easypanel.host.

# Para domínio principal
A @ [IP_DO_SEU_SERVIDOR_EASYPANEL]
```

### 3.2. Configuração do Webhook
Após configurar o domínio, atualize o webhook da Evolution API para apontar para o novo endereço do seu backend. Utilize os scripts do projeto para facilitar:
```bash
# Para o domínio padrão do Easypanel
node scripts/configure-webhook-easypanel.js

# Para um domínio personalizado (edite o script antes)
node scripts/configure-webhook-custom-domain.js
```

---

## 4. Solução de Problemas (Troubleshooting)

### 🚨 Problema: Erro `502 Bad Gateway` no backend.
Este erro significa que o proxy do Easypanel não conseguiu se comunicar com sua aplicação. As causas mais comuns são:

1.  **A Aplicação Não Iniciou**: O contêiner pode ter parado ou falhado ao iniciar.
    - **Verificação**: No painel do Easypanel, verifique se o status do serviço está **"Running"** (verde).
    - **Solução**: Se estiver "Stopped" ou com erro, clique em **"Restart"** e verifique os logs.

2.  **Erro no Código ou Configuração**:
    - **Verificação**: Acesse a aba **"Logs"** do serviço no Easypanel. Procure por mensagens de erro na inicialização, como falhas de conexão com o banco de dados (`ECONNREFUSED`), módulos não encontrados, ou variáveis de ambiente faltando.
    - **Solução**: Corrija o erro apontado no log. Garanta que todas as variáveis de ambiente (`DATABASE_URL`, `OPENAI_API_KEY`, etc.) estão configuradas corretamente na aba **"Environment"**.

3.  **Configuração de Porta Incorreta**:
    - **Verificação**: Confirme se a porta interna no Easypanel (**Settings → General**) está como `3000` e que o `main.ts` do backend escuta em `0.0.0.0` e na porta `3000`.
    - **Solução**: Ajuste a configuração de porta para que o Easypanel saiba para onde direcionar o tráfego.

### 🚨 Problema: Frontend abre no domínio principal do Easypanel.
- **Causa**: O domínio do serviço frontend foi configurado com o IP ou domínio principal do servidor, em vez de um subdomínio específico.
- **Solução**:
  1. No serviço frontend, vá para **Settings** → **Domains**.
  2. **Remova** o domínio principal.
  3. **Adicione** um subdomínio dedicado (ex: `app.seusite.com`).
  4. Certifique-se de que a porta interna do serviço está como `3002`.

#### **Caso de Emergência: A aplicação está bloqueando o acesso ao painel Easypanel**
Se uma aplicação foi configurada incorretamente na porta 3000 e você não consegue acessar o painel do Easypanel, a solução mais rápida é parar o contêiner problemático via SSH.

1.  **Acesse seu servidor via SSH**: `ssh root@seu_ip_do_servidor`
2.  **Liste os contêineres em execução**: `docker ps`
3.  **Identifique o contêiner** da sua aplicação (pelo nome ou imagem).
4.  **Pare o contêiner**: `docker stop <ID_ou_Nome_do_Container>`

Após parar o contêiner, você deverá conseguir acessar o painel do Easypanel para corrigir a configuração da porta.

### 🚨 Problema: Status do commit aparece como "Desconhecido".
- **Causa**: Os `Build Arguments` não foram configurados ou o serviço não foi "rebuildado".
- **Solução**: Consulte o `docs/guides/deploy/DEPLOY.md` para a configuração correta dos argumentos de build.