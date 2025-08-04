# =====================================================
# Script PowerShell para executar as migrações do bolão
# Execute este script para criar as tabelas automaticamente
# =====================================================

Write-Host "🚀 Executando migração do sistema de bolão..." -ForegroundColor Green

# Verificar se Docker está rodando
$dockerRunning = docker ps 2>$null
if (-not $dockerRunning) {
    Write-Host "❌ Docker não está rodando. Iniciando serviços..." -ForegroundColor Red
    docker-compose up -d postgres
    Start-Sleep -Seconds 10
}

# Listar containers PostgreSQL
Write-Host "📋 Containers PostgreSQL disponíveis:" -ForegroundColor Yellow
docker ps --filter "ancestor=postgres" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Tentar diferentes nomes possíveis para o container
$containerNames = @(
    "kmiza27-postgres-1",
    "kmiza27_postgres_1", 
    "postgres",
    "backend_postgres_1",
    "backend-postgres-1"
)

$containerFound = $false
foreach ($containerName in $containerNames) {
    $containerExists = docker ps --filter "name=$containerName" --format "{{.Names}}" 2>$null
    if ($containerExists) {
        Write-Host "✅ Encontrado container: $containerName" -ForegroundColor Green
        
        Write-Host "🔍 1. Criando usuário admin (se necessário)..." -ForegroundColor Cyan
        docker exec -i $containerName psql -U admin -d kmiza27_db -f /dev/stdin < "database/migrations/create-admin-user.sql"
        
        Write-Host "🔧 2. Criando tabelas do bolão..." -ForegroundColor Cyan
        docker exec -i $containerName psql -U admin -d kmiza27_db -f /dev/stdin < "database/migrations/create-pools-tables.sql"
        
        Write-Host "✅ Migração concluída!" -ForegroundColor Green
        Write-Host "📊 Verificando tabelas criadas..." -ForegroundColor Cyan
        
        docker exec -it $containerName psql -U admin -d kmiza27_db -c "\dt pool*"
        
        $containerFound = $true
        break
    }
}

if (-not $containerFound) {
    Write-Host "❌ Nenhum container PostgreSQL encontrado!" -ForegroundColor Red
    Write-Host "💡 Execute manualmente:" -ForegroundColor Yellow
    Write-Host "   psql -h localhost -U admin -d kmiza27_db -f database/migrations/create-admin-user.sql" -ForegroundColor White
    Write-Host "   psql -h localhost -U admin -d kmiza27_db -f database/migrations/create-pools-tables.sql" -ForegroundColor White
    exit 1
}

Write-Host "🎉 Sistema de bolão pronto para uso!" -ForegroundColor Green