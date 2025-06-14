# 🚀 Guia Completo de Deploy e CI/CD

Este documento é a fonte central de verdade para o processo de build, deploy contínuo (CI/CD) e otimizações de cache da aplicação no EasyPanel.

## 1. Visão Geral do Processo de Deploy

O sistema de deploy é 100% automatizado, seguindo um fluxo de CI/CD simples e eficaz:

1.  **Push no GitHub**: Um `git push` para a branch `main` inicia o processo.
2.  **Webhook do EasyPanel**: O GitHub notifica o EasyPanel sobre o novo código.
3.  **Build no EasyPanel**: O EasyPanel puxa o código mais recente e executa o build dos contêineres Docker para o backend e frontend.
4.  **Deploy**: Após o build ser concluído com sucesso, o EasyPanel automaticamente publica os novos contêineres, tornando as alterações visíveis em produção.

Graças a uma forte estratégia de **cache busting**, não é mais necessário usar o botão "Force Rebuild" manualmente.

---

## 2. Como Fazer o Deploy

### Método 1: Comando Automático (Recomendado)
Para garantir que o cache seja sempre invalidado e o deploy seja rastreável, use o script automatizado do projeto:

```bash
# Faz o commit com uma mensagem padrão e realiza o push
npm run deploy

# Ou com uma mensagem de commit personalizada
npm run deploy "feat: Adiciona nova funcionalidade X"
```
Este comando realiza o commit das suas alterações, atualiza os arquivos de cache busting e faz o push, acionando o fluxo de deploy automático.

### Método 2: Git Push Manual
Você também pode usar o fluxo padrão do Git. As otimizações nos Dockerfiles garantirão que o cache seja invalidado.
```bash
git add .
git commit -m "sua mensagem"
git push origin main
```

---

## 3. Estratégia de Cache Busting

### O Problema: Cache Agressivo
O Docker e o EasyPanel utilizam cache de forma agressiva para acelerar os builds. Sem uma estratégia para "quebrar" (invalidar) o cache, o EasyPanel poderia reutilizar camadas antigas do build, fazendo com que novas alterações no código não fossem aplicadas, exigindo um "Force Rebuild" manual.

### A Solução: Build Arguments Dinâmicos
A solução é passar argumentos dinâmicos durante o processo de build, forçando o Docker a re-executar os passos críticos.

#### **Passo 1: Configurar Build Arguments no EasyPanel**
Esta é a etapa mais importante. Em **ambos** os serviços (`kmizabot` e `kmizafront`):

1.  No painel do EasyPanel, vá para **Settings → Build**.
2.  Adicione os seguintes **Build Arguments**:
    ```
    GIT_COMMIT=${{github.sha}}
    BUILD_TIMESTAMP=${{github.timestamp}}
    CACHEBUST=${{github.timestamp}}
    ```
    *O EasyPanel substitui essas variáveis (`${{...}}`) pelos valores corretos do webhook do GitHub em tempo de build.*

#### **Passo 2: Implementação nos Dockerfiles**
Os Dockerfiles foram otimizados para usar esses argumentos e garantir que o cache seja sempre invalidado de forma inteligente.
```dockerfile
# Dockerfile.backend / Dockerfile.frontend

# Define os argumentos que serão recebidos do EasyPanel
ARG GIT_COMMIT
ARG BUILD_TIMESTAMP
ARG CACHEBUST

# Usa os argumentos para criar um "selo" de versão
RUN echo "Commit: $GIT_COMMIT, Build Time: $BUILD_TIMESTAMP, Cache: $CACHEBUST" > /app/build-info.txt

# O restante do Dockerfile continua, mas essa camada muda a cada build,
# invalidando o cache para os passos seguintes.
COPY . .
RUN npm install --no-cache
RUN npm run build
```

#### **Passo 3: Integração com Next.js (Frontend)**
Para garantir que o cache do navegador também seja invalidado, o ID de build do Next.js é gerado dinamicamente.
```typescript
// next.config.ts
generateBuildId: async () => {
  // Usa as variáveis de ambiente passadas durante o build
  const commit = process.env.GIT_COMMIT || Date.now().toString();
  return commit;
}
```

---

## 4. Verificação e Monitoramento

Após um deploy, você pode verificar se as alterações foram aplicadas com sucesso.

### Endpoints de Saúde (Health Checks)
Esses endpoints retornam o status atual e as informações do build, incluindo o hash do commit.
```bash
# Verificar o commit do Backend
curl https://kmizabot.h4xd66.easypanel.host/health | jq

# Verificar o commit do Frontend
curl https://kmizafront.h4xd66.easypanel.host/api/health | jq
```
**Resposta Esperada:**
```json
{
  "status": "ok",
  "commit": "hash_do_seu_ultimo_commit",
  "timestamp": "timestamp_do_build"
}
```
### URLs de Monitoramento
- **Backend Health**: `https://kmizabot.h4xd66.easypanel.host/health`
- **Frontend Health**: `https://kmizafront.h4xd66.easypanel.host/api/health`
- **Dashboard Web**: `https://kmizafront.h4xd66.easypanel.host`

---

## 5. Troubleshooting de Deploy

### Problema: As minhas alterações não aparecem após o push.
1.  **Verifique o Commit nos Health Endpoints**: Use os comandos `curl` acima. Se o hash do commit retornado não for o mais recente, o build falhou ou usou cache.
2.  **Verifique os Build Arguments no EasyPanel**: Confirme se os argumentos da **Seção 3** estão configurados corretamente em **ambos** os serviços. Um erro de digitação (`${{github.sha}}`) é a causa mais comum.
3.  **Verifique os Logs de Build**: No painel do EasyPanel, vá para a aba **"Deployments"** ou **"Builds"** e inspecione os logs do último deploy. Procure por erros durante o `npm install` ou `npm run build`.
4.  **Webhook do GitHub**: No seu repositório GitHub, vá em **Settings → Webhooks** e verifique se o webhook do EasyPanel está ativo e se as entregas recentes foram bem-sucedidas (status 200).

### Problema: O build está falhando.
- **Causa Comum**: Erros de código, dependências quebradas ou problemas de memória no servidor.
- **Solução**: Analise os **Logs de Build** no EasyPanel. O log mostrará exatamente em qual comando o build falhou (ex: erro de compilação do TypeScript, falha ao baixar um pacote npm).

---

## 6. Scripts de Suporte

O `package.json` contém scripts para auxiliar no processo:

- `npm run deploy [message]`: Faz o deploy automático.
- `npm run deploy:force`: Força o rebuild no EasyPanel (como último recurso).
- `npm run status:backend`: Verifica o health check do backend.
- `npm run status:frontend`: Verifica o health check do frontend.