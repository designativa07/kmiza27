#!/bin/bash

# 🔄 Script para Forçar Rebuild no Easypanel
# Use este script quando o auto-deploy não funcionar

set -e

echo "🔄 Forçando rebuild no Easypanel..."

# Capturar informações do commit atual
GIT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
GIT_SHORT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
CACHE_BUSTER=$(date +%s)

echo "📋 Informações do Build:"
echo "   🐙 Commit: $GIT_COMMIT"
echo "   🔖 Short: $GIT_SHORT"
echo "   ⏰ Timestamp: $BUILD_TIMESTAMP"
echo "   🔥 Cache Buster: $CACHE_BUSTER"

# Atualizar arquivo de force rebuild
echo "📝 Atualizando arquivo de force rebuild..."
cat > .easypanel/force-rebuild.txt << EOF
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
EOF

# Atualizar build-info.json
echo "📝 Atualizando build-info.json..."
cat > build-info.json << EOF
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
EOF

# Adicionar mudanças ao git
echo "📦 Adicionando mudanças ao git..."
git add .easypanel/force-rebuild.txt build-info.json

# Verificar se há mudanças para commit
if git diff --staged --quiet; then
    echo "⚠️  Nenhuma mudança detectada para commit"
    echo "🔄 Criando mudança mínima para forçar rebuild..."
    
    # Criar uma mudança mínima para forçar rebuild
    echo "# Force rebuild: $CACHE_BUSTER" >> .easypanel/force-rebuild.txt
    git add .easypanel/force-rebuild.txt
fi

# Fazer commit
COMMIT_MESSAGE="${1:-feat: force rebuild - $GIT_SHORT - $CACHE_BUSTER}"
echo "💾 Fazendo commit: $COMMIT_MESSAGE"
git commit -m "$COMMIT_MESSAGE"

# Push para o repositório
echo "🚀 Enviando para GitHub..."
git push origin main

echo ""
echo "✅ Force rebuild iniciado com sucesso!"
echo ""
echo "🔍 Monitoramento:"
echo "  📊 GitHub: https://github.com/designativa07/kmiza27/commits/main"
echo "  🐳 Backend: https://kmizabot.h4xd66.easypanel.host/health"
echo "  🎨 Frontend: https://kmizafrontend.h4xd66.easypanel.host/api/health"
echo "  📱 Dashboard: https://kmizafrontend.h4xd66.easypanel.host"
echo ""
echo "⏳ O rebuild deve completar em 3-5 minutos..."
echo "🔥 Cache será quebrado automaticamente!"
echo ""
echo "📋 Para verificar se o deploy foi aplicado:"
echo "  curl https://kmizabot.h4xd66.easypanel.host/health | jq '.commit'"
echo "  curl https://kmizafrontend.h4xd66.easypanel.host/api/health | jq '.commit'"
echo ""
echo "🎯 Commit esperado: $GIT_SHORT"
echo ""
echo "💡 Se ainda não funcionar, use o Force Rebuild manual no Easypanel" 