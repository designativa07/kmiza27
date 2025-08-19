#!/bin/bash

# 🚀 Script de Deploy para Produção - Kmiza27 Game
# Domínios: gameapi.kmiza27.com e game.kmiza27.com

echo "🎮 Iniciando deploy para produção..."
echo "🌐 Backend: gameapi.kmiza27.com"
echo "🌐 Frontend: game.kmiza27.com"

# Verificar se estamos no diretório correto
if [ ! -f "docker/easypanel-game.yml" ]; then
    echo "❌ Erro: Execute este script do diretório kmiza27-game/"
    exit 1
fi

# Parar serviços existentes
echo "🛑 Parando serviços existentes..."
docker-compose -f docker/easypanel-game.yml down

# Limpar containers e imagens antigas
echo "🧹 Limpando containers e imagens antigas..."
docker system prune -f

# Build das imagens
echo "🔨 Fazendo build das imagens..."
docker-compose -f docker/easypanel-game.yml build --no-cache

# Iniciar serviços
echo "🚀 Iniciando serviços..."
docker-compose -f docker/easypanel-game.yml up -d

# Aguardar inicialização
echo "⏳ Aguardando inicialização dos serviços..."
sleep 30

# Verificar status
echo "📊 Verificando status dos serviços..."
docker-compose -f docker/easypanel-game.yml ps

# Testar endpoints
echo "🧪 Testando endpoints..."
echo "Backend Health Check:"
curl -f http://localhost:3004/api/v1/health || echo "❌ Backend não respondeu"

echo "Frontend:"
curl -f http://localhost:3005 || echo "❌ Frontend não respondeu"

echo ""
echo "✅ Deploy concluído!"
echo "🌐 Backend: https://gameapi.kmiza27.com"
echo "🌐 Frontend: https://game.kmiza27.com"
echo ""
echo "📝 Para ver logs: docker-compose -f docker/easypanel-game.yml logs -f"
echo "📝 Para parar: docker-compose -f docker/easypanel-game.yml down"
