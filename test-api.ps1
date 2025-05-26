$body = @{
    home_team_id = 31
    away_team_id = 32
    competition_id = 16
    match_date = "2025-05-26T22:00:00.000Z"
    status = "scheduled"
    broadcast_channels = @()
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/matches/10" -Method PATCH -ContentType "application/json" -Body $body
    Write-Host "✅ Sucesso: $($response | ConvertTo-Json)"
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)"
    Write-Host "Detalhes: $($_.ErrorDetails.Message)"
} 