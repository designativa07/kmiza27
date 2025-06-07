# 🔄 Script PowerShell para Forçar Rebuild no Easypanel
# Use este script quando o auto-deploy não funcionar

Write-Host "🔄 Forçando rebuild no Easypanel..." -ForegroundColor Cyan

# Capturar informações do commit atual
try {
    $GIT_COMMIT = git rev-parse HEAD 2>$null
    $GIT_SHORT = git rev-parse --short HEAD 2>$null
} catch {
    $GIT_COMMIT = "unknown"
    $GIT_SHORT = "unknown"
}

$BUILD_TIMESTAMP = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$CACHE_BUSTER = [int][double]::Parse((Get-Date -UFormat %s))

Write-Host "📋 Informações do Build:" -ForegroundColor Yellow
Write-Host "   🐙 Commit: $GIT_COMMIT" -ForegroundColor White
Write-Host "   🔖 Short: $GIT_SHORT" -ForegroundColor White
Write-Host "   ⏰ Timestamp: $BUILD_TIMESTAMP" -ForegroundColor White
Write-Host "   🔥 Cache Buster: $CACHE_BUSTER" -ForegroundColor White

# Atualizar arquivo de force rebuild
Write-Host "📝 Atualizando arquivo de force rebuild..." -ForegroundColor Blue

$forceRebuildContent = @"
# Force Rebuild - Kmiza27
# Este arquivo muda a cada commit para forçar invalidação de cache

Build Timestamp: $BUILD_TIMESTAMP
Commit: $GIT_SHORT
Cache Buster: $CACHE_BUSTER
Deploy Type: force-rebuild

# Mudanças implementadas:
- Dockerfiles otimizados para contexto local
- Cache busting eficiente com argumentos de build
- Remoção do clone interno do repositório
- Build IDs únicos para Next.js
- Headers de cache otimizados
- Health checks melhorados

# Cache Busting Strategy:
- Contexto local (sem git clone)
- npm cache clean --force
- Build args com commit + timestamp
- generateBuildId único no Next.js
- Headers de cache apropriados

# Deploy Info:
- Deployed at: $BUILD_TIMESTAMP
- Commit: $GIT_COMMIT
- Short: $GIT_SHORT
- Cache ID: $CACHE_BUSTER
- Force rebuild: true
"@

$forceRebuildContent | Out-File -FilePath ".easypanel/force-rebuild.txt" -Encoding UTF8

# Atualizar build-info.json
Write-Host "📝 Atualizando build-info.json..." -ForegroundColor Blue

$buildInfoContent = @"
{
  "buildTimestamp": "$BUILD_TIMESTAMP",
  "gitCommit": "$GIT_COMMIT",
  "gitShort": "$GIT_SHORT",
  "cacheBuster": "$CACHE_BUSTER",
  "deployedAt": "$BUILD_TIMESTAMP",
  "version": "1.0.0",
  "forceRebuild": true,
  "deployType": "force-rebuild"
}
"@

$buildInfoContent | Out-File -FilePath "build-info.json" -Encoding UTF8

# Adicionar mudanças ao git
Write-Host "📦 Adicionando mudanças ao git..." -ForegroundColor Blue
git add .easypanel/force-rebuild.txt build-info.json

# Verificar se há mudanças para commit
$gitStatus = git diff --staged --quiet 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "⚠️  Nenhuma mudança detectada para commit" -ForegroundColor Yellow
    Write-Host "🔄 Criando mudança mínima para forçar rebuild..." -ForegroundColor Yellow
    
    # Criar uma mudança mínima para forçar rebuild
    "# Force rebuild: $CACHE_BUSTER" | Add-Content -Path ".easypanel/force-rebuild.txt"
    git add .easypanel/force-rebuild.txt
}

# Fazer commit
$COMMIT_MESSAGE = if ($args[0]) { $args[0] } else { "feat: force rebuild - $GIT_SHORT - $CACHE_BUSTER" }
Write-Host "💾 Fazendo commit: $COMMIT_MESSAGE" -ForegroundColor Green
git commit -m "$COMMIT_MESSAGE"

# Push para o repositório
Write-Host "🚀 Enviando para GitHub..." -ForegroundColor Green
git push origin main

Write-Host ""
Write-Host "✅ Force rebuild iniciado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 Monitoramento:" -ForegroundColor Yellow
Write-Host "  📊 GitHub: https://github.com/designativa07/kmiza27/commits/main" -ForegroundColor White
Write-Host "  🐳 Backend: https://kmizabot.h4xd66.easypanel.host/health" -ForegroundColor White
Write-Host "  🎨 Frontend: https://kmizafrontend.h4xd66.easypanel.host/api/health" -ForegroundColor White
Write-Host "  📱 Dashboard: https://kmizafrontend.h4xd66.easypanel.host" -ForegroundColor White
Write-Host ""
Write-Host "⏳ O rebuild deve completar em 3-5 minutos..." -ForegroundColor Yellow
Write-Host "🔥 Cache será quebrado automaticamente!" -ForegroundColor Red
Write-Host ""
Write-Host "📋 Para verificar se o deploy foi aplicado:" -ForegroundColor Yellow
Write-Host "  curl https://kmizabot.h4xd66.easypanel.host/health | jq '.commit'" -ForegroundColor White
Write-Host "  curl https://kmizafrontend.h4xd66.easypanel.host/api/health | jq '.commit'" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Commit esperado: $GIT_SHORT" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Se ainda não funcionar, use o Force Rebuild manual no Easypanel" -ForegroundColor Magenta 