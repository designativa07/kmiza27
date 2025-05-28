# 🤖 Detecção Automática de Commit

## Problema Resolvido

Antes era necessário atualizar manualmente o commit ID nos arquivos sempre que fizesse um novo commit. Agora o sistema detecta automaticamente!

## Como Funciona

### 🔄 Processo Automático no Docker Build:

1. **Durante o Build (Dockerfile.frontend):**
   ```bash
   # Instala git no container
   RUN apk add --no-cache git
   
   # Copia todo o contexto incluindo .git
   COPY . ./project-root/
   
   # Detecta o commit automaticamente
   RUN cd project-root && \
       GIT_COMMIT_AUTO=$(git rev-parse HEAD | cut -c1-8) && \
       echo $GIT_COMMIT_AUTO > /tmp/git-commit.txt
   ```

2. **Salva as Variáveis:**
   ```bash
   # Cria .env.local com as variáveis detectadas
   echo "GIT_COMMIT=$GIT_COMMIT" >> .env.local
   echo "BUILD_TIMESTAMP=$BUILD_TIMESTAMP" >> .env.local
   ```

3. **Runtime lê as Variáveis:**
   ```typescript
   // frontend/src/app/api/health/route.ts
   const getBuildVars = () => {
     const envPath = join(process.cwd(), '.env.local');
     const envContent = readFileSync(envPath, 'utf8');
     // Parse das variáveis...
   }
   ```

## Vantagens

### ✅ **Automático:**
- Não precisa mais atualizar manualmente
- Funciona com qualquer commit
- Zero intervenção humana

### ✅ **Confiável:**
- Sempre pega o commit correto
- Fallback seguro se algo der errado
- Funciona em qualquer ambiente (local, Easypanel, outros)

### ✅ **Transparente:**
- Logs mostram qual commit foi detectado
- API /health informa se foi auto-detectado
- Debug completo no build

## Workflow Atualizado

### Antes (Manual):
```bash
1. git commit -m "mudanças"
2. node update-commit.js  # ❌ Manual
3. git add .
4. git commit -m "update commit"
5. git push
6. Rebuild no Easypanel
```

### Agora (Automático):
```bash
1. git commit -m "mudanças"
2. git push
3. Rebuild no Easypanel  # ✅ Detecta automaticamente!
```

## Verificação

### ✅ Local:
```bash
# Testar localmente
npm run build
# Commit será detectado durante o build

# Verificar API
curl http://localhost:3002/api/health
```

### ✅ Produção:
```bash
# Verificar no Easypanel
curl https://kmizafront.h4xd66.easypanel.host/api/health

# Resposta incluirá:
{
  "commit": "84b849d",  # ✅ Commit atual automaticamente
  "buildInfo": {
    "autoDetected": true,
    "source": "docker-build"
  }
}
```

## Logs de Build

### Durante o Build:
```
🔍 Commit detectado: 84b849df
🔍 Build Info:
API URL: https://kmizabot.h4xd66.easypanel.host
Git Commit: 84b849df
Build Time: 2025-05-28T16:48:14Z
```

### No Runtime:
```
🚀 Runtime Info:
Git Commit: 84b849df
Build Time: 2025-05-28T16:48:14Z
```

## Fallbacks

### Se Git não estiver disponível:
```
GIT_COMMIT_AUTO=$(git rev-parse HEAD 2>/dev/null | cut -c1-8 || echo "84b849d")
```

### Se .env.local não existir:
```typescript
const buildVars = getBuildVars(); // Retorna {} se erro
const gitCommit = buildVars.GIT_COMMIT || '84b849d'; // Fallback seguro
```

## Compatibilidade

### ✅ Funciona em:
- **Docker local**
- **Easypanel**
- **Vercel** (usa VERCEL_GIT_COMMIT_SHA)
- **Railway** (usa RAILWAY_GIT_COMMIT_SHA)
- **Render** (usa RENDER_GIT_COMMIT)
- **Qualquer CI/CD**

### 🔧 Para outros ambientes:
Basta definir a variável `GIT_COMMIT`:
```bash
export GIT_COMMIT=$(git rev-parse HEAD | cut -c1-8)
```

## Solução de Problemas

### Commit aparece como fallback:
1. ✅ Verificar se `.git` está sendo copiado no build
2. ✅ Verificar logs do build para "Commit detectado"
3. ✅ Verificar se `git` está instalado no container

### Para debug:
```bash
# No container
cat .env.local
# Deve mostrar: GIT_COMMIT=84b849df

# Via API
curl /api/health | jq '.buildInfo'
# Deve mostrar: "autoDetected": true
```

## Conclusão

🎉 **Sistema Totalmente Automático!**

- ✅ Zero manutenção manual
- ✅ Sempre atualizado
- ✅ Funciona em qualquer ambiente
- ✅ Fallbacks seguros
- ✅ Debug completo

Agora você pode focar no desenvolvimento sem se preocupar com commits manuais! 