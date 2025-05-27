#!/bin/bash

# 🔄 Script de Rebuild e Restart - Kmiza27

set -e

echo "🔄 Iniciando rebuild e restart dos serviços..."
echo ""

# Gerar timestamp para cache busting
TIMESTAMP=$(date +%s)
COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
SHORT_COMMIT=${COMMIT:0:8}

echo "📝 Informações do build:"
echo "   Timestamp: $TIMESTAMP"
echo "   Commit: $SHORT_COMMIT"
echo ""

# Exportar variáveis para docker-compose
export CACHEBUST=$TIMESTAMP
export GIT_COMMIT=$COMMIT

# Função para rebuild específico
rebuild_service() {
    local service=$1
    echo "🔨 Rebuilding $service..."
    
    # Parar o serviço
    docker-compose stop $service 2>/dev/null || true
    
    # Remover container antigo
    docker-compose rm -f $service 2>/dev/null || true
    
    # Rebuild sem cache
    docker-compose build --no-cache $service
    
    # Iniciar o serviço
    docker-compose up -d $service
    
    echo "✅ $service rebuilt e reiniciado!"
    echo ""
}

# Função para restart rápido
restart_service() {
    local service=$1
    echo "🔄 Restarting $service..."
    
    docker-compose restart $service
    
    echo "✅ $service reiniciado!"
    echo ""
}

# Verificar argumentos
case "${1:-all}" in
    "backend")
        rebuild_service backend
        ;;
    "frontend")
        rebuild_service frontend
        ;;
    "restart-backend")
        restart_service backend
        ;;
    "restart-frontend")
        restart_service frontend
        ;;
    "restart-all")
        echo "🔄 Reiniciando todos os serviços..."
        docker-compose restart
        echo "✅ Todos os serviços reiniciados!"
        ;;
    "all"|"")
        echo "🔨 Rebuilding todos os serviços..."
        
        # Parar todos os serviços
        docker-compose down
        
        # Rebuild tudo sem cache
        docker-compose build --no-cache
        
        # Iniciar todos os serviços
        docker-compose up -d
        
        echo "✅ Todos os serviços rebuilt e reiniciados!"
        ;;
    "logs")
        echo "📋 Mostrando logs dos serviços..."
        docker-compose logs -f --tail=50
        ;;
    "status")
        echo "📊 Status dos serviços:"
        docker-compose ps
        echo ""
        echo "🏥 Health checks:"
        curl -s http://localhost:3000/health | jq . 2>/dev/null || echo "Backend: Não disponível"
        curl -s http://localhost:3002/api/health | jq . 2>/dev/null || echo "Frontend: Não disponível"
        ;;
    *)
        echo "❌ Uso: $0 [backend|frontend|restart-backend|restart-frontend|restart-all|all|logs|status]"
        echo ""
        echo "Opções:"
        echo "  backend          - Rebuild apenas o backend"
        echo "  frontend         - Rebuild apenas o frontend"
        echo "  restart-backend  - Restart rápido do backend"
        echo "  restart-frontend - Restart rápido do frontend"
        echo "  restart-all      - Restart rápido de todos"
        echo "  all              - Rebuild completo de todos (padrão)"
        echo "  logs             - Mostrar logs em tempo real"
        echo "  status           - Mostrar status e health checks"
        exit 1
        ;;
esac

echo ""
echo "🎉 Operação concluída!"
echo "📊 Para verificar status: $0 status"
echo "📋 Para ver logs: $0 logs" 