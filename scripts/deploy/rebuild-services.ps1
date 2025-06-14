# 🔄 Script de Rebuild e Restart - Kmiza27 (Windows PowerShell)

param(
    [string]$Action = "all"
)

Write-Host "🔄 Iniciando rebuild e restart dos serviços..." -ForegroundColor Cyan
Write-Host ""

# Gerar timestamp para cache busting
$Timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
try {
    $Commit = git rev-parse HEAD 2>$null
    $ShortCommit = $Commit.Substring(0, 8)
} catch {
    $Commit = "unknown"
    $ShortCommit = "unknown"
}

Write-Host "📝 Informações do build:" -ForegroundColor Yellow
Write-Host "   Timestamp: $Timestamp" -ForegroundColor White
Write-Host "   Commit: $ShortCommit" -ForegroundColor White
Write-Host ""

# Exportar variáveis de ambiente
$env:CACHEBUST = $Timestamp
$env:GIT_COMMIT = $Commit

# Função para rebuild específico
function Rebuild-Service {
    param([string]$ServiceName)
    
    Write-Host "🔨 Rebuilding $ServiceName..." -ForegroundColor Yellow
    
    # Parar o serviço
    docker-compose stop $ServiceName 2>$null
    
    # Remover container antigo
    docker-compose rm -f $ServiceName 2>$null
    
    # Rebuild sem cache
    docker-compose build --no-cache $ServiceName
    
    # Iniciar o serviço
    docker-compose up -d $ServiceName
    
    Write-Host "✅ $ServiceName rebuilt e reiniciado!" -ForegroundColor Green
    Write-Host ""
}

# Função para restart rápido
function Restart-Service {
    param([string]$ServiceName)
    
    Write-Host "🔄 Restarting $ServiceName..." -ForegroundColor Yellow
    
    docker-compose restart $ServiceName
    
    Write-Host "✅ $ServiceName reiniciado!" -ForegroundColor Green
    Write-Host ""
}

# Verificar ação solicitada
switch ($Action.ToLower()) {
    "backend" {
        Rebuild-Service "backend"
    }
    "frontend" {
        Rebuild-Service "frontend"
    }
    "restart-backend" {
        Restart-Service "backend"
    }
    "restart-frontend" {
        Restart-Service "frontend"
    }
    "restart-all" {
        Write-Host "🔄 Reiniciando todos os serviços..." -ForegroundColor Yellow
        docker-compose restart
        Write-Host "✅ Todos os serviços reiniciados!" -ForegroundColor Green
    }
    "all" {
        Write-Host "🔨 Rebuilding todos os serviços..." -ForegroundColor Yellow
        
        # Parar todos os serviços
        docker-compose down
        
        # Rebuild tudo sem cache
        docker-compose build --no-cache
        
        # Iniciar todos os serviços
        docker-compose up -d
        
        Write-Host "✅ Todos os serviços rebuilt e reiniciados!" -ForegroundColor Green
    }
    "logs" {
        Write-Host "📋 Mostrando logs dos serviços..." -ForegroundColor Yellow
        docker-compose logs -f --tail=50
    }
    "status" {
        Write-Host "📊 Status dos serviços:" -ForegroundColor Yellow
        docker-compose ps
        Write-Host ""
        Write-Host "🏥 Health checks:" -ForegroundColor Yellow
        
        try {
            $BackendHealth = Invoke-RestMethod -Uri "http://localhost:3000/health" -TimeoutSec 5
            Write-Host "Backend: ✅ Online" -ForegroundColor Green
        } catch {
            Write-Host "Backend: ❌ Não disponível" -ForegroundColor Red
        }
        
        try {
            $FrontendHealth = Invoke-RestMethod -Uri "http://localhost:3002/api/health" -TimeoutSec 5
            Write-Host "Frontend: ✅ Online" -ForegroundColor Green
        } catch {
            Write-Host "Frontend: ❌ Não disponível" -ForegroundColor Red
        }
    }
    default {
        Write-Host "❌ Uso: .\rebuild-services.ps1 [Action]" -ForegroundColor Red
        Write-Host ""
        Write-Host "Opções:" -ForegroundColor Yellow
        Write-Host "  backend          - Rebuild apenas o backend" -ForegroundColor White
        Write-Host "  frontend         - Rebuild apenas o frontend" -ForegroundColor White
        Write-Host "  restart-backend  - Restart rápido do backend" -ForegroundColor White
        Write-Host "  restart-frontend - Restart rápido do frontend" -ForegroundColor White
        Write-Host "  restart-all      - Restart rápido de todos" -ForegroundColor White
        Write-Host "  all              - Rebuild completo de todos (padrão)" -ForegroundColor White
        Write-Host "  logs             - Mostrar logs em tempo real" -ForegroundColor White
        Write-Host "  status           - Mostrar status e health checks" -ForegroundColor White
        exit 1
    }
}

Write-Host ""
Write-Host "🎉 Operação concluída!" -ForegroundColor Green
Write-Host "📊 Para verificar status: .\rebuild-services.ps1 status" -ForegroundColor Cyan
Write-Host "📋 Para ver logs: .\rebuild-services.ps1 logs" -ForegroundColor Cyan 