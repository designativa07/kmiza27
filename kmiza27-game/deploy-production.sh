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

# Verificar se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Erro: Docker não está rodando!"
    exit 1
fi

# Verificar imports do frontend antes do deploy
echo "🔍 Verificando imports do frontend..."
chmod +x check-imports.sh
./check-imports.sh

if [ $? -ne 0 ]; then
    echo "⚠️ Problemas de imports encontrados. Tentando corrigir..."
    echo "🔧 Corrigindo imports incorretos..."
    
    # Corrigir imports conhecidos
    sed -i 's|import { ATTRIBUTE_LABELS, OVERALL_COLORS } from '\''./PlayerCardCompact'\'';|import { ATTRIBUTE_LABELS } from '\''@/types/player'\'';\nimport { OVERALL_COLORS } from '\''./PlayerCardCompact'\'';|g' frontend/src/components/PlayerAttributesLegend.tsx
    
    echo "✅ Imports corrigidos!"
fi

# Verificar propriedades obrigatórias
echo "🔍 Verificando propriedades obrigatórias..."
cd frontend

# Verificar se PlayerCardCompact está sendo usado com playerType
echo "Verificando PlayerCardCompact..."
grep -r "PlayerCardCompact" src/components/ --include="*.tsx" | while read -r line; do
    if [[ $line == *"<PlayerCardCompact"* ]]; then
        file=$(echo "$line" | cut -d: -f1)
        line_num=$(echo "$line" | cut -d: -f2)
        
        # Verificar se tem playerType
        if ! grep -A 20 -B 5 "PlayerCardCompact" "$file" | grep -q "playerType"; then
            echo "⚠️  $file:$line_num - PlayerCardCompact sem playerType"
            echo "🔧 Corrigindo automaticamente..."
            
            # Adicionar playerType baseado no contexto
            if [[ $file == *"YouthAcademy"* ]]; then
                sed -i 's|size="small"|size="small"\n                      playerType="youth"|g' "$file"
            elif [[ $file == *"PlayersManager"* ]]; then
                sed -i 's|size="medium"|size="medium"\n              playerType={activeTab === '\''academia'\'' ? '\''youth'\'' : '\''professional'\''}|g' "$file"
            else
                sed -i 's|size="medium"|size="medium"\n              playerType="professional"|g' "$file"
            fi
            
            echo "✅ Corrigido em $file"
        fi
    fi
done

cd ..

# Parar serviços existentes
echo "🛑 Parando serviços existentes..."
docker-compose -f docker/easypanel-game.yml down

# Limpar containers e imagens antigas
echo "🧹 Limpando containers e imagens antigas..."
docker system prune -f

# Build das imagens
echo "🔨 Fazendo build das imagens..."

echo "📦 Build do Backend..."
docker-compose -f docker/easypanel-game.yml build --no-cache kmiza27-game-backend

if [ $? -ne 0 ]; then
    echo "❌ Erro no build do backend!"
    echo "🔄 Tentando build alternativo..."
    cd backend
    chmod +x build-backend.sh
    ./build-backend.sh
    cd ..
fi

echo "📦 Build do Frontend..."
docker-compose -f docker/easypanel-game.yml build --no-cache kmiza27-game-frontend

if [ $? -ne 0 ]; then
    echo "❌ Erro no build do frontend!"
    echo "🔄 Tentando build alternativo..."
    cd frontend
    chmod +x build-frontend.sh
    ./build-frontend.sh
    cd ..
fi

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
echo ""
echo "🔍 Para verificar status: ./check-production-status.sh"
