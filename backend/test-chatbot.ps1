$body = @{
    message = "oi, como vai?"
} | ConvertTo-Json

$headers = @{
    'Content-Type' = 'application/json'
}

Write-Host "🧪 Testando chatbot no novo domínio..." -ForegroundColor Green
Write-Host "🌐 URL: https://api.kmiza27.com/chatbot/test/message" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "https://api.kmiza27.com/chatbot/test/message" -Method POST -Headers $headers -Body $body
    
    Write-Host "✅ Resposta completa:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor White
    
    if ($response.response) {
        Write-Host ""
        Write-Host "🤖 Resposta do bot:" -ForegroundColor Yellow
        Write-Host $response.response -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ Erro:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Yellow
} 