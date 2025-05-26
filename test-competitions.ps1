# Script para testar API de Competições
Write-Host "🧪 Testando API de Competições..." -ForegroundColor Green

# Teste 1: Listar competições
Write-Host "`n1. Listando competições..." -ForegroundColor Yellow
try {
    $competitions = Invoke-RestMethod -Uri "http://localhost:3000/competitions" -Method GET
    Write-Host "✅ Competições encontradas: $($competitions.Count)" -ForegroundColor Green
    $competitions | ForEach-Object { Write-Host "   - $($_.name) ($($_.type))" }
} catch {
    Write-Host "❌ Erro ao listar competições: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 2: Criar uma competição de teste
Write-Host "`n2. Criando competição de teste..." -ForegroundColor Yellow
$newCompetition = @{
    name = "Teste Brasileirão 2025"
    slug = "teste-brasileirao-2025"
    type = "pontos_corridos"
    season = "2025"
    country = "Brasil"
    is_active = $true
} | ConvertTo-Json

try {
    $created = Invoke-RestMethod -Uri "http://localhost:3000/competitions" -Method POST -Body $newCompetition -ContentType "application/json"
    Write-Host "✅ Competição criada com ID: $($created.id)" -ForegroundColor Green
    $competitionId = $created.id
} catch {
    Write-Host "❌ Erro ao criar competição: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Teste 3: Listar times disponíveis
Write-Host "`n3. Listando times disponíveis..." -ForegroundColor Yellow
try {
    $teams = Invoke-RestMethod -Uri "http://localhost:3000/teams" -Method GET
    Write-Host "✅ Times encontrados: $($teams.Count)" -ForegroundColor Green
    if ($teams.Count -gt 0) {
        $teams[0..2] | ForEach-Object { Write-Host "   - $($_.name)" }
    }
} catch {
    Write-Host "❌ Erro ao listar times: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 4: Adicionar times à competição (se houver times)
if ($teams.Count -gt 0) {
    Write-Host "`n4. Adicionando times à competição..." -ForegroundColor Yellow
    $teamIds = $teams[0..([Math]::Min(3, $teams.Count-1))] | ForEach-Object { $_.id }
    
    $addTeamsPayload = @{
        team_ids = $teamIds
        group_name = "A"
    } | ConvertTo-Json
    
    try {
        $addedTeams = Invoke-RestMethod -Uri "http://localhost:3000/competitions/$competitionId/teams" -Method POST -Body $addTeamsPayload -ContentType "application/json"
        Write-Host "✅ Times adicionados: $($addedTeams.Count)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro ao adicionar times: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Teste 5: Listar times da competição
    Write-Host "`n5. Listando times da competição..." -ForegroundColor Yellow
    try {
        $competitionTeams = Invoke-RestMethod -Uri "http://localhost:3000/competitions/$competitionId/teams" -Method GET
        Write-Host "✅ Times na competição: $($competitionTeams.Count)" -ForegroundColor Green
        $competitionTeams | ForEach-Object { Write-Host "   - $($_.team.name) (Grupo: $($_.group_name))" }
    } catch {
        Write-Host "❌ Erro ao listar times da competição: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Teste 6: Limpar - Deletar competição de teste
Write-Host "`n6. Limpando - Deletando competição de teste..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "http://localhost:3000/competitions/$competitionId" -Method DELETE
    Write-Host "✅ Competição de teste deletada" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao deletar competição: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Teste da API de Competições concluído!" -ForegroundColor Green 