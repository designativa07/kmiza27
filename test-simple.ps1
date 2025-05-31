# Script simples de teste do Chatbot
Write-Host "Testando Chatbot Kmiza27..." -ForegroundColor Green

$baseUrl = "http://localhost:3000/chatbot"

# Health Check
Write-Host "`nHealth Check:" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/test/health" -Method GET
    Write-Host "Status: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste simples
Write-Host "`nTeste de mensagem:" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/test/quick?message=oi" -Method GET
    Write-Host "Sucesso: $($response.success)" -ForegroundColor Green
} catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}

# Cenarios automaticos
Write-Host "`nCenarios automaticos:" -ForegroundColor Yellow
try {
    $scenarios = Invoke-RestMethod -Uri "$baseUrl/test/scenarios" -Method GET
    Write-Host "Total: $($scenarios.testSummary.totalScenarios)" -ForegroundColor Green
    Write-Host "Sucessos: $($scenarios.testSummary.successfulScenarios)" -ForegroundColor Green
} catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTestes concluidos!" -ForegroundColor Green 