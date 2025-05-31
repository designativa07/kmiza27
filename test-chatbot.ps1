# 🧪 Script de Teste do Chatbot Kmiza27
# Execute: .\test-chatbot.ps1

Write-Host "🤖 Testando Chatbot Kmiza27..." -ForegroundColor Green

# Configurações
$baseUrl = "http://localhost:3000/chatbot"

# Função para testar mensagem
function Test-Message {
    param([string]$message)
    
    Write-Host "`n📝 Testando: '$message'" -ForegroundColor Yellow
    
    try {
        $encodedMessage = [System.Web.HttpUtility]::UrlEncode($message)
        $response = Invoke-RestMethod -Uri "$baseUrl/test/quick?message=$encodedMessage" -Method GET
        
        if ($response.success) {
            Write-Host "✅ Sucesso!" -ForegroundColor Green
            Write-Host "⏱️ Tempo: $($response.debug.processingTime)" -ForegroundColor Cyan
            Write-Host "📄 Resposta: $($response.output.response.Substring(0, [Math]::Min(100, $response.output.response.Length)))..." -ForegroundColor White
        } else {
            Write-Host "❌ Erro: $($response.error.message)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Erro de conexão: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Função para health check
function Test-Health {
    Write-Host "`n🏥 Verificando saúde do sistema..." -ForegroundColor Yellow
    
    try {
        $health = Invoke-RestMethod -Uri "$baseUrl/test/health" -Method GET
        
        if ($health.healthy) {
            Write-Host "✅ Sistema saudável!" -ForegroundColor Green
            Write-Host "📊 Database: $($health.checks.database)" -ForegroundColor Cyan
            Write-Host "🧠 OpenAI: $($health.checks.openai)" -ForegroundColor Cyan
            Write-Host "📱 Evolution: $($health.checks.evolution)" -ForegroundColor Cyan
            Write-Host "🗃️ Repositories: $($health.checks.repositories)" -ForegroundColor Cyan
        } else {
            Write-Host "⚠️ Alguns serviços com problemas" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Erro ao verificar saúde: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Função para cenários automáticos
function Test-Scenarios {
    Write-Host "`n🎯 Executando cenários automáticos..." -ForegroundColor Yellow
    
    try {
        $scenarios = Invoke-RestMethod -Uri "$baseUrl/test/scenarios" -Method GET
        
        if ($scenarios.success) {
            Write-Host "✅ Cenários executados com sucesso!" -ForegroundColor Green
            Write-Host "📊 Total: $($scenarios.testSummary.totalScenarios)" -ForegroundColor Cyan
            Write-Host "✅ Sucessos: $($scenarios.testSummary.successfulScenarios)" -ForegroundColor Green
        } else {
            Write-Host "❌ Erro nos cenários: $($scenarios.error.message)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Erro ao executar cenários: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Menu principal
function Show-Menu {
    Write-Host "`n🤖 MENU DE TESTES DO CHATBOT" -ForegroundColor Magenta
    Write-Host "1. Health Check" -ForegroundColor White
    Write-Host "2. Teste de Mensagem Personalizada" -ForegroundColor White
    Write-Host "3. Testes Rápidos" -ForegroundColor White
    Write-Host "4. Cenários Automáticos" -ForegroundColor White
    Write-Host "5. Sair" -ForegroundColor White
    Write-Host ""
}

# Testes rápidos predefinidos
function Test-Quick {
    Write-Host "`n⚡ Executando testes rápidos..." -ForegroundColor Yellow
    
    $quickTests = @(
        "oi",
        "tabela do brasileirao",
        "proximo jogo do flamengo",
        "jogos hoje",
        "informacoes do santos",
        "ultimo jogo do palmeiras"
    )
    
    foreach ($test in $quickTests) {
        Test-Message $test
        Start-Sleep 1
    }
}

# Verificar se o servidor está rodando
Write-Host "🔍 Verificando se o servidor está rodando..." -ForegroundColor Yellow

try {
    $status = Invoke-RestMethod -Uri "$baseUrl/status" -Method GET -TimeoutSec 5
    Write-Host "✅ Servidor está rodando!" -ForegroundColor Green
} catch {
    Write-Host "❌ Servidor não está rodando. Inicie com: cd backend && npm run start:dev" -ForegroundColor Red
    exit 1
}

# Loop do menu
do {
    Show-Menu
    $choice = Read-Host "Escolha uma opção (1-5)"
    
    switch ($choice) {
        "1" { Test-Health }
        "2" { 
            $message = Read-Host "Digite a mensagem para testar"
            Test-Message $message
        }
        "3" { Test-Quick }
        "4" { Test-Scenarios }
        "5" { 
            Write-Host "👋 Até logo!" -ForegroundColor Green
            break
        }
        default { 
            Write-Host "❌ Opção inválida!" -ForegroundColor Red
        }
    }
    
    if ($choice -ne "5") {
        Write-Host "`nPressione Enter para continuar..." -ForegroundColor Gray
        Read-Host
    }
    
} while ($choice -ne "5")

Write-Host "`n🤖 Testes finalizados!" -ForegroundColor Green 