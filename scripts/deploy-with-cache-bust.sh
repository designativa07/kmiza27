#!/bin/bash

# 🚀 Deploy com Cache Busting Automático
# Este script garante que o Easypanel sempre aplique as mudanças

set -e

echo "🔥 Iniciando deploy com cache busting..."

# Capturar informações do commit atual
CURRENT_COMMIT=$(git rev-parse HEAD)
SHORT_COMMIT=$(git rev-parse --short HEAD)
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
CACHE_BUSTER=$(date +%s)

echo "📋 Informações do deploy:"
echo "  🔹 Commit: $SHORT_COMMIT"
echo "  🔹 Timestamp: $TIMESTAMP"
echo "  🔹 Cache Buster: $CACHE_BUSTER"

# Atualizar arquivo de force rebuild
echo "📝 Atualizando arquivo de cache busting..."
cat > .easypanel/force-rebuild.txt << EOF
# Force Rebuild - Kmiza27
# Este arquivo muda a cada commit para forçar invalidação de cache

Build Timestamp: $TIMESTAMP
Commit: $SHORT_COMMIT
Features: auth, admin-panel, user-management, admin-creation, cache-busting
Cache Buster: $CACHE_BUSTER

# Mudanças neste commit:
- Dockerfiles otimizados para quebrar cache automaticamente
- Clone sempre fresco do repositório (--depth=1)
- Cache busting agressivo com timestamp e commit
- Remoção forçada de node_modules e package-lock.json
- Build IDs únicos para Next.js
- Logs melhorados para debug de cache
- Eliminação da necessidade de Force Rebuild manual

# Cache Busting Strategy:
- git clone --depth=1 (sempre fresco)
- rm -rf node_modules package-lock.json
- npm install --no-cache
- Commit hash como cache buster
- Timestamp único por build
- Build ID único para Next.js

# Deploy Info:
- Deployed at: $TIMESTAMP
- Commit: $CURRENT_COMMIT
- Short: $SHORT_COMMIT
- Cache ID: $CACHE_BUSTER
EOF

# Adicionar mudanças ao git
echo "📦 Adicionando mudanças ao git..."
git add .

# Verificar se há mudanças para commit
if git diff --staged --quiet; then
    echo "⚠️  Nenhuma mudança detectada para commit"
    echo "🔄 Forçando rebuild mesmo assim..."
    
    # Criar uma mudança mínima para forçar rebuild
    echo "# Cache bust: $CACHE_BUSTER" >> .easypanel/force-rebuild.txt
    git add .easypanel/force-rebuild.txt
fi

# Fazer commit
COMMIT_MESSAGE="${1:-feat: cache busting deploy - $SHORT_COMMIT}"
echo "💾 Fazendo commit: $COMMIT_MESSAGE"
git commit -m "$COMMIT_MESSAGE"

# Push para o repositório
echo "🚀 Enviando para GitHub..."
git push origin main

echo ""
echo "✅ Deploy iniciado com sucesso!"
echo ""
echo "🔍 Monitoramento:"
echo "  📊 GitHub Actions: https://github.com/designativa07/kmiza27/actions"
echo "  🐳 Backend Health: https://kmizabot.h4xd66.easypanel.host/health"
echo "  🎨 Frontend Health: https://kmizafront.h4xd66.easypanel.host/api/health"
echo "  📱 Dashboard: https://kmizafront.h4xd66.easypanel.host"
echo ""
echo "⏳ O deploy deve completar em 3-5 minutos..."
echo "🔥 Cache será quebrado automaticamente - não precisa de Force Rebuild!"
echo ""
echo "📋 Para verificar se o deploy foi aplicado:"
echo "  curl https://kmizabot.h4xd66.easypanel.host/health | jq '.commit'"
echo "  curl https://kmizafront.h4xd66.easypanel.host/api/health | jq '.commit'"
echo ""
echo "🎯 Commit esperado: $SHORT_COMMIT" 