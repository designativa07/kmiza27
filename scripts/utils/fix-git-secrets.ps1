# 🔧 Script para Corrigir Secrets no Git - kmiza27-chatbot
# Remove chaves sensíveis do histórico e refaz o commit

Write-Host "🔧 Corrigindo secrets no repositório Git..." -ForegroundColor Yellow

# Verificar se git está instalado
try {
    git --version | Out-Null
} catch {
    Write-Host "❌ Git não está instalado. Instale o Git primeiro." -ForegroundColor Red
    exit 1
}

# Remover o repositório Git atual
Write-Host "🗑️ Removendo histórico Git atual..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Remove-Item -Recurse -Force ".git"
}

# Reinicializar repositório Git
Write-Host "📦 Reinicializando repositório Git..." -ForegroundColor Yellow
git init

# Adicionar remote origin
Write-Host "🔗 Configurando remote origin..." -ForegroundColor Yellow
git remote add origin https://github.com/designativa07/kmiza27.git

# Configurar branch principal
Write-Host "🌿 Configurando branch principal..." -ForegroundColor Yellow
git branch -M main

# Adicionar todos os arquivos (agora sem secrets)
Write-Host "📁 Adicionando arquivos ao staging..." -ForegroundColor Yellow
git add .

# Fazer commit inicial limpo
Write-Host "💾 Fazendo commit inicial (sem secrets)..." -ForegroundColor Yellow
$commitMessage = @"
🎉 Initial commit: kmiza27-chatbot (clean)

✨ Features:
- 🤖 WhatsApp chatbot with AI integration
- ⚽ Football information system
- 🎨 Next.js frontend dashboard
- 🔧 NestJS backend API
- 📱 Evolution API integration
- 🧠 OpenAI integration

🏗️ Architecture:
- Backend: NestJS + TypeScript + PostgreSQL
- Frontend: Next.js + TypeScript + Tailwind CSS
- WhatsApp: Evolution API
- AI: OpenAI GPT
- Deploy: Hostinger VPS + Easypanel

🔧 Configuration:
- Webhook scripts included
- Environment examples (no secrets)
- Deploy documentation
- Development and production ready

🔒 Security:
- All sensitive data removed
- Environment variables for secrets
- GitHub secrets protection compliant

📦 Repository: https://github.com/designativa07/kmiza27
🚀 Ready for secure deploy to production!
"@

git commit -m $commitMessage

# Push forçado para GitHub (limpa o histórico)
Write-Host "🚀 Fazendo push forçado para GitHub..." -ForegroundColor Yellow
Write-Host "⚠️ Isso irá sobrescrever o histórico remoto!" -ForegroundColor Red
$confirm = Read-Host "Continuar? (y/N)"

if ($confirm -eq "y" -or $confirm -eq "Y") {
    git push -f origin main
    
    Write-Host ""
    Write-Host "✅ Repositório corrigido com sucesso!" -ForegroundColor Green
    Write-Host "🔒 Secrets removidos do histórico!" -ForegroundColor Green
    Write-Host "🔗 GitHub: https://github.com/designativa07/kmiza27" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
    Write-Host "1. Configure as variáveis de ambiente no servidor" -ForegroundColor White
    Write-Host "2. Faça o deploy no Easypanel" -ForegroundColor White
    Write-Host "3. Configure o webhook para produção" -ForegroundColor White
    Write-Host "4. Teste o chatbot" -ForegroundColor White
    Write-Host ""
    Write-Host "🤖 O kmiza27-chatbot está pronto e seguro!" -ForegroundColor Green
} else {
    Write-Host "❌ Operação cancelada." -ForegroundColor Red
} 