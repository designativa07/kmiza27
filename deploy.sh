#!/bin/bash

# 🚀 Script de Deploy Otimizado para Easypanel
# Simplificado para funcionar com auto-deploy

set -e

echo "🔥 Iniciando deploy otimizado..."

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

# Exportar variáveis para docker-compose
export CACHEBUST=$CACHE_BUSTER
export BUILD_TIMESTAMP=$BUILD_TIMESTAMP
export GITHUB_SHA=$GIT_COMMIT

# Atualizar arquivo de build info para cache busting
echo "📝 Atualizando build info..."
cat > build-info.json << EOF
{
  "buildTimestamp": "$BUILD_TIMESTAMP",
  "gitCommit": "$GIT_COMMIT",
  "gitShort": "$GIT_SHORT",
  "cacheBuster": "$CACHE_BUSTER",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "1.0.0"
}
EOF

echo "🛑 Parando serviços existentes..."
docker-compose down --remove-orphans || true

echo "🧹 Limpando recursos Docker..."
docker system prune -f || true

echo "🏗️ Construindo imagens..."
docker-compose build --no-cache --parallel

echo "🚀 Iniciando serviços..."
docker-compose up -d

echo "⏳ Aguardando serviços ficarem prontos..."
sleep 30

echo "🔍 Verificando status dos serviços..."
docker-compose ps

echo "📊 Verificando health checks..."
sleep 10

# Verificar backend
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend está saudável"
    BACKEND_COMMIT=$(curl -s http://localhost:3000/health | grep -o '"commit":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
    echo "   🐙 Commit do backend: $BACKEND_COMMIT"
else
    echo "❌ Backend não está respondendo"
fi

# Verificar frontend
if curl -f http://localhost:3002/api/health > /dev/null 2>&1; then
    echo "✅ Frontend está saudável"
    FRONTEND_COMMIT=$(curl -s http://localhost:3002/api/health | grep -o '"commit":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
    echo "   🐙 Commit do frontend: $FRONTEND_COMMIT"
else
    echo "❌ Frontend não está respondendo"
fi

echo ""
echo "✅ Deploy concluído!"
echo "🔥 Cache buster: $CACHE_BUSTER"
echo "🐙 Commit deployado: $GIT_SHORT"
echo ""
echo "📋 URLs de verificação:"
echo "   🔗 Backend Health: http://localhost:3000/health"
echo "   🔗 Frontend Health: http://localhost:3002/api/health"
echo "   📱 Dashboard: http://localhost:3002"
echo ""
echo "🎉 Deploy finalizado!" 