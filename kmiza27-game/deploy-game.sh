#!/bin/bash

# Script de Deploy para o Jogo Kmiza27
echo "🎮 Iniciando deploy do Jogo Kmiza27..."

# Verificar se estamos no diretório correto
if [ ! -f "docker/easypanel-game.yml" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto kmiza27-game"
    exit 1
fi

# Build das imagens
echo "🔨 Build das imagens Docker..."

# Backend
echo "📦 Build do Backend..."
docker build -t kmiza27/game-backend:latest ./backend
if [ $? -ne 0 ]; then
    echo "❌ Erro no build do backend"
    exit 1
fi

# Frontend (quando estiver pronto)
echo "📦 Build do Frontend..."
docker build -t kmiza27/game-frontend:latest ./frontend
if [ $? -ne 0 ]; then
    echo "❌ Erro no build do frontend"
    exit 1
fi

# Deploy no EasyPanel
echo "🚀 Deploy no EasyPanel..."
docker-compose -f docker/easypanel-game.yml up -d

if [ $? -eq 0 ]; then
    echo "✅ Deploy concluído com sucesso!"
    echo "🌐 Backend: http://localhost:3004"
    echo "🌐 Frontend: http://localhost:3005"
    echo "📊 Health Check: http://localhost:3004/api/v1/health"
else
    echo "❌ Erro no deploy"
    exit 1
fi

# Verificar status dos containers
echo "🔍 Verificando status dos containers..."
docker-compose -f docker/easypanel-game.yml ps

echo "🎉 Deploy finalizado!" 