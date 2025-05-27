#!/bin/bash

# 🚀 Script de Deploy para EasyPanel - Kmiza27
# Este script configura as variáveis de build corretamente

set -e

echo "🚀 Iniciando deploy para EasyPanel..."

# Obter informações do commit
COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
SHORT_COMMIT=${COMMIT:0:8}
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
CACHEBUST=$(date +%s)

echo "📝 Informações do build:"
echo "   Commit: $SHORT_COMMIT"
echo "   Timestamp: $TIMESTAMP"
echo "   Cache Bust: $CACHEBUST"

# Exportar variáveis
export GIT_COMMIT=$COMMIT
export BUILD_TIMESTAMP=$TIMESTAMP
export CACHEBUST=$CACHEBUST

# Criar arquivo de variáveis para EasyPanel
cat > .env.easypanel << EOF
GIT_COMMIT=$COMMIT
BUILD_TIMESTAMP=$TIMESTAMP
CACHEBUST=$CACHEBUST
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://kmizabot.h4xd66.easypanel.host
EOF

echo "✅ Variáveis de build configuradas!"
echo "📁 Arquivo .env.easypanel criado"

# Instruções para EasyPanel
echo ""
echo "🔧 Para aplicar no EasyPanel:"
echo "1. Acesse o dashboard do EasyPanel"
echo "2. Vá em Build Arguments ou Environment Variables"
echo "3. Adicione as seguintes variáveis:"
echo "   GIT_COMMIT=$COMMIT"
echo "   BUILD_TIMESTAMP=$TIMESTAMP"
echo "   CACHEBUST=$CACHEBUST"
echo "4. Faça Force Rebuild dos serviços"
echo ""
echo "🌐 URLs para verificar após deploy:"
echo "   Backend: https://kmizabot.h4xd66.easypanel.host/health"
echo "   Frontend: https://kmizafrontend.h4xd66.easypanel.host/api/health"
