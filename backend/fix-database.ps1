# =====================================================
# Script PowerShell para corrigir conflito do banco
# =====================================================

Write-Host "🔧 Corrigindo conflito no banco de dados..." -ForegroundColor Yellow

# Parar o backend se estiver rodando
Write-Host "🛑 Parando backend..." -ForegroundColor Red
taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 3

# Conectar no banco e executar correção
Write-Host "🗃️ Executando correção no banco..." -ForegroundColor Cyan

# Listar containers PostgreSQL disponíveis
$containers = docker ps --filter "ancestor=postgres" --format "{{.Names}}"

if ($containers) {
    $containerName = $containers[0]
    Write-Host "✅ Usando container: $containerName" -ForegroundColor Green
    
    # Executar script de correção
    docker exec -i $containerName psql -U admin -d kmiza27_db -f /dev/stdin < "backend/database/migrations/fix-pools-conflict.sql"
    
    Write-Host "✅ Banco corrigido!" -ForegroundColor Green
} else {
    Write-Host "❌ Container PostgreSQL não encontrado!" -ForegroundColor Red
    Write-Host "💡 Execute manualmente:" -ForegroundColor Yellow
    Write-Host "   psql -h localhost -U admin -d kmiza27_db -f backend/database/migrations/fix-pools-conflict.sql" -ForegroundColor White
}

Write-Host "🚀 Reiniciando backend..." -ForegroundColor Green
Set-Location backend
Start-Process powershell -ArgumentList "npm run start:dev" -WindowStyle Normal

Write-Host "🎉 Sistema pronto para uso!" -ForegroundColor Green