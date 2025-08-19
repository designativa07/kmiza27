#!/bin/bash

# 🔍 Script de Verificação de Status - Kmiza27 Game
# Verifica se os domínios estão funcionando corretamente

echo "🔍 Verificando status dos serviços em produção..."
echo ""

# Verificar DNS
echo "🌐 Verificando resolução DNS..."
echo "gameapi.kmiza27.com:"
nslookup gameapi.kmiza27.com || echo "❌ Erro na resolução DNS"

echo ""
echo "game.kmiza27.com:"
nslookup game.kmiza27.com || echo "❌ Erro na resolução DNS"

echo ""

# Verificar conectividade HTTP
echo "🌐 Testando conectividade HTTP..."
echo "Backend (gameapi.kmiza27.com):"
curl -I --connect-timeout 10 https://gameapi.kmiza27.com/api/v1/health 2>/dev/null | head -1 || echo "❌ Backend não responde"

echo ""
echo "Frontend (game.kmiza27.com):"
curl -I --connect-timeout 10 https://game.kmiza27.com 2>/dev/null | head -1 || echo "❌ Frontend não responde"

echo ""

# Verificar status dos containers
echo "🐳 Verificando status dos containers..."
if [ -f "docker/easypanel-game.yml" ]; then
    docker-compose -f docker/easypanel-game.yml ps
else
    echo "⚠️ Arquivo docker-compose não encontrado"
fi

echo ""

# Verificar logs recentes
echo "📝 Últimos logs do backend:"
docker logs --tail 10 kmiza27-game-backend 2>/dev/null || echo "❌ Container não encontrado"

echo ""
echo "📝 Últimos logs do frontend:"
docker logs --tail 10 kmiza27-game-frontend 2>/dev/null || echo "❌ Container não encontrado"

echo ""
echo "✅ Verificação concluída!"
