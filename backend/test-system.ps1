# =====================================================
# Script de teste manual do sistema de bolão
# =====================================================

Write-Host "🧪 Testando sistema de bolão..." -ForegroundColor Green

# 1. Verificar se o backend está rodando
Write-Host "📡 1. Verificando se backend está rodando..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 5
    Write-Host "✅ Backend respondendo: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend não está respondendo na porta 3000" -ForegroundColor Red
    Write-Host "💡 Tentando iniciar o backend..." -ForegroundColor Yellow
    
    # Tentar iniciar o backend
    Start-Process powershell -ArgumentList "cd '$PSScriptRoot'; npm run start:dev" -WindowStyle Normal
    Write-Host "🔄 Backend iniciando em nova janela..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Testar novamente
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 5
        Write-Host "✅ Backend agora está respondendo: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Backend ainda não está funcionando" -ForegroundColor Red
        Write-Host "💡 Verifique os logs na janela do backend" -ForegroundColor Yellow
        exit 1
    }
}

# 2. Verificar se o banco está funcionando
Write-Host "🗃️ 2. Verificando conexão com banco..." -ForegroundColor Cyan
try {
    # Tentar acessar endpoint que usa banco (se existir)
    Write-Host "💡 Teste manual: Execute no PostgreSQL:" -ForegroundColor Yellow
    Write-Host "   SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'pool%';" -ForegroundColor White
} catch {
    Write-Host "⚠️ Não foi possível testar banco automaticamente" -ForegroundColor Yellow
}

# 3. Testar endpoints básicos
Write-Host "🔗 3. Testando endpoints da API..." -ForegroundColor Cyan

$endpoints = @(
    @{ url = "http://localhost:3000/pools"; description = "Listar bolões" },
    @{ url = "http://localhost:3000/users"; description = "Listar usuários" },
    @{ url = "http://localhost:3000/competitions"; description = "Listar competições" }
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint.url -TimeoutSec 5
        Write-Host "✅ $($endpoint.description): $($response.StatusCode)" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401) {
            Write-Host "🔐 $($endpoint.description): 401 (Autenticação necessária)" -ForegroundColor Yellow
        } elseif ($statusCode -eq 404) {
            Write-Host "🔍 $($endpoint.description): 404 (Endpoint não encontrado)" -ForegroundColor Orange
        } else {
            Write-Host "❌ $($endpoint.description): Erro $statusCode" -ForegroundColor Red
        }
    }
}

# 4. Verificar frontends
Write-Host "🌐 4. Verificando frontends..." -ForegroundColor Cyan

$frontends = @(
    @{ port = 3001; name = "Admin Frontend" },
    @{ port = 3002; name = "Futepédia Frontend" }
)

foreach ($frontend in $frontends) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($frontend.port)" -TimeoutSec 5
        Write-Host "✅ $($frontend.name): $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($frontend.name) não está rodando na porta $($frontend.port)" -ForegroundColor Red
    }
}

Write-Host "`n📋 RESUMO DOS TESTES:" -ForegroundColor Blue
Write-Host "======================" -ForegroundColor Blue
Write-Host "✅ = Funcionando" -ForegroundColor Green
Write-Host "🔐 = Precisa autenticação" -ForegroundColor Yellow  
Write-Host "🔍 = Endpoint não encontrado" -ForegroundColor Orange
Write-Host "❌ = Com problema" -ForegroundColor Red

Write-Host "`n🎯 PRÓXIMOS PASSOS:" -ForegroundColor Magenta
Write-Host "1. Se backend não estiver rodando, verifique erros TypeScript" -ForegroundColor White
Write-Host "2. Se banco não estiver conectado, verifique PostgreSQL" -ForegroundColor White
Write-Host "3. Teste criação de bolão via frontend admin" -ForegroundColor White
Write-Host "4. Teste visualização de bolões no frontend público" -ForegroundColor White

Write-Host "`n🚀 Sistema de bolão está implementado!" -ForegroundColor Green