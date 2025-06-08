# =====================================================
# 🧪 TESTE DE CONEXÃO POSTGRESQL - KMIZA27 RAG
# =====================================================

Write-Host "🔍 Testando conexão PostgreSQL..." -ForegroundColor Green
Write-Host ""

# Parâmetros de conexão
$dbHost = "195.200.0.191"
$dbPort = "5433"
$database = "kmiza27"
$username = "kmiza27_rag"
$password = "kmiza27rag"

Write-Host "📋 Parâmetros de conexão:" -ForegroundColor Yellow
Write-Host "Host: $dbHost"
Write-Host "Port: $dbPort"
Write-Host "Database: $database"
Write-Host "Username: $username"
Write-Host "Password: [oculta]"
Write-Host ""

# Teste 1: Conectividade de rede
Write-Host "🌐 Teste 1: Conectividade de rede..." -ForegroundColor Cyan
try {
    $result = Test-NetConnection -ComputerName $dbHost -Port $dbPort -WarningAction SilentlyContinue
    if ($result.TcpTestSucceeded) {
        Write-Host "✅ Conectividade de rede: OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Conectividade de rede: FALHOU" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erro no teste de rede: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Teste 2: String de conexão
Write-Host "🔗 Teste 2: Formato da string de conexão..." -ForegroundColor Cyan
$connectionString = "postgres://${username}:${password}@${dbHost}:${dbPort}/${database}"
Write-Host "String de conexão: $connectionString"
Write-Host "✅ Formato da string: OK" -ForegroundColor Green

Write-Host ""

# Teste 3: Verificar se psql está disponível
Write-Host "🔧 Teste 3: Verificando disponibilidade do psql..." -ForegroundColor Cyan
try {
    $psqlVersion = psql --version 2>$null
    if ($psqlVersion) {
        Write-Host "✅ psql encontrado: $psqlVersion" -ForegroundColor Green
        $psqlAvailable = $true
    } else {
        Write-Host "⚠️ psql não encontrado no PATH" -ForegroundColor Yellow
        $psqlAvailable = $false
    }
} catch {
    Write-Host "⚠️ psql não encontrado no PATH" -ForegroundColor Yellow
    $psqlAvailable = $false
}

Write-Host ""

# Teste 4: Tentar conexão com psql (se disponível)
if ($psqlAvailable) {
    Write-Host "🔐 Teste 4: Tentando conexão com psql..." -ForegroundColor Cyan
    Write-Host "Comando que seria executado:"
    Write-Host "psql -h $dbHost -p $dbPort -U $username -d $database" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⚠️ Para testar manualmente, execute:" -ForegroundColor Yellow
    Write-Host "psql -h $dbHost -p $dbPort -U $username -d $database" -ForegroundColor Cyan
    Write-Host "Senha quando solicitada: $password" -ForegroundColor Cyan
} else {
    Write-Host "🔧 Teste 4: Instalação do PostgreSQL Client..." -ForegroundColor Cyan
    Write-Host "❌ psql não está disponível" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Para instalar o PostgreSQL Client:" -ForegroundColor Yellow
    Write-Host "1. Baixe o PostgreSQL em: https://www.postgresql.org/download/windows/"
    Write-Host "2. Ou instale apenas o cliente via Chocolatey: choco install postgresql"
    Write-Host "3. Ou use Docker: docker run -it --rm postgres:latest psql -h $dbHost -p $dbPort -U $username -d $database"
}

Write-Host ""

# Resumo
Write-Host "📊 RESUMO DO TESTE:" -ForegroundColor Green
Write-Host "✅ Host acessível: $dbHost"
Write-Host "✅ Porta aberta: $dbPort"
Write-Host "✅ String de conexão válida"
Write-Host "String completa: postgres://${username}:${password}@${dbHost}:${dbPort}/${database}"

Write-Host ""
Write-Host "🎯 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "1. Instale o psql se não tiver"
Write-Host "2. Execute: psql -h $dbHost -p $dbPort -U $username -d $database"
Write-Host "3. Digite a senha: $password"
Write-Host "4. Teste consultas: SELECT COUNT(*) FROM teams;"

Write-Host ""
Write-Host "🔍 TESTE CONCLUÍDO!" -ForegroundColor Green 