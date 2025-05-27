# Script de Deploy para EasyPanel - Kmiza27 (PowerShell)
# Este script configura as variaveis de build corretamente

Write-Host "Iniciando deploy para EasyPanel..." -ForegroundColor Green

# Obter informacoes do commit
try {
    $Commit = git rev-parse HEAD 2>$null
    if (-not $Commit) { $Commit = "unknown" }
} catch {
    $Commit = "unknown"
}

$ShortCommit = $Commit.Substring(0, [Math]::Min(8, $Commit.Length))
$Timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$CacheBust = [int][double]::Parse((Get-Date -UFormat %s))

Write-Host "Informacoes do build:" -ForegroundColor Cyan
Write-Host "   Commit: $ShortCommit" -ForegroundColor Yellow
Write-Host "   Timestamp: $Timestamp" -ForegroundColor Yellow
Write-Host "   Cache Bust: $CacheBust" -ForegroundColor Yellow

# Exportar variaveis
$env:GIT_COMMIT = $Commit
$env:BUILD_TIMESTAMP = $Timestamp
$env:CACHEBUST = $CacheBust

# Criar arquivo de variaveis para EasyPanel
$EnvContent = "GIT_COMMIT=$Commit`nBUILD_TIMESTAMP=$Timestamp`nCACHEBUST=$CacheBust`nNODE_ENV=production`nNEXT_PUBLIC_API_URL=https://kmizabot.h4xd66.easypanel.host"

$EnvContent | Out-File -FilePath ".env.easypanel" -Encoding UTF8

Write-Host "Variaveis de build configuradas!" -ForegroundColor Green
Write-Host "Arquivo .env.easypanel criado" -ForegroundColor Green

# Instrucoes para EasyPanel
Write-Host ""
Write-Host "Para aplicar no EasyPanel:" -ForegroundColor Cyan
Write-Host "1. Acesse o dashboard do EasyPanel" -ForegroundColor White
Write-Host "2. Va em Build Arguments ou Environment Variables" -ForegroundColor White
Write-Host "3. Adicione as seguintes variaveis:" -ForegroundColor White
Write-Host "   GIT_COMMIT=$Commit" -ForegroundColor Yellow
Write-Host "   BUILD_TIMESTAMP=$Timestamp" -ForegroundColor Yellow
Write-Host "   CACHEBUST=$CacheBust" -ForegroundColor Yellow
Write-Host "4. Faca Force Rebuild dos servicos" -ForegroundColor White
Write-Host ""
Write-Host "URLs para verificar apos deploy:" -ForegroundColor Cyan
Write-Host "   Backend: https://kmizabot.h4xd66.easypanel.host/health" -ForegroundColor Blue
Write-Host "   Frontend: https://kmizafrontend.h4xd66.easypanel.host/api/health" -ForegroundColor Blue

Write-Host ""
Write-Host "Arquivo .env.easypanel criado com as variaveis necessarias" -ForegroundColor Green
Write-Host "Configure essas variaveis no EasyPanel e faca Force Rebuild" -ForegroundColor Cyan 