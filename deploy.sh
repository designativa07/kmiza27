#!/bin/bash

# 🚀 Script de Deploy Automático com Cache Busting
# Força rebuild completo e reinicialização dos serviços

set -e

echo "🔥 Iniciando deploy com cache busting..."

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

echo "🛑 Parando serviços existentes..."
docker-compose down --remove-orphans || true

echo "🧹 Limpando imagens antigas..."
docker system prune -f || true
docker image prune -a -f || true

echo "🏗️ Construindo imagens com cache busting..."
docker-compose build --no-cache --pull --parallel

echo "🚀 Iniciando serviços..."
docker-compose up -d

echo "⏳ Aguardando serviços ficarem prontos..."
sleep 30

echo "🔍 Verificando status dos serviços..."
docker-compose ps

echo "📊 Logs dos serviços:"
echo "--- Backend ---"
docker-compose logs --tail=10 backend
echo "--- Frontend ---"
docker-compose logs --tail=10 frontend

echo "✅ Deploy concluído com sucesso!"
echo "🔥 Cache buster usado: $CACHE_BUSTER"
echo "🐙 Commit deployado: $GIT_SHORT"

# Verificar health checks
echo "🏥 Verificando health checks..."
sleep 10

if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend está saudável"
else
    echo "❌ Backend não está respondendo"
fi

if curl -f http://localhost:3002/api/health > /dev/null 2>&1; then
    echo "✅ Frontend está saudável"
else
    echo "❌ Frontend não está respondendo"
fi

echo "🎉 Deploy finalizado!" 