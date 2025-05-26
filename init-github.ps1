# 🚀 Script de Inicialização do GitHub - kmiza27-chatbot
# Repositório: https://github.com/designativa07/kmiza27

Write-Host "🚀 Inicializando repositório GitHub para kmiza27-chatbot..." -ForegroundColor Green

# Verificar se git está instalado
try {
    git --version | Out-Null
} catch {
    Write-Host "❌ Git não está instalado. Instale o Git primeiro." -ForegroundColor Red
    exit 1
}

# Inicializar repositório Git (se não existir)
if (-not (Test-Path ".git")) {
    Write-Host "📦 Inicializando repositório Git..." -ForegroundColor Yellow
    git init
}

# Adicionar remote origin
Write-Host "🔗 Configurando remote origin..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin https://github.com/designativa07/kmiza27.git

# Configurar branch principal
Write-Host "🌿 Configurando branch principal..." -ForegroundColor Yellow
git branch -M main

# Adicionar todos os arquivos
Write-Host "📁 Adicionando arquivos ao staging..." -ForegroundColor Yellow
git add .

# Fazer commit inicial
Write-Host "💾 Fazendo commit inicial..." -ForegroundColor Yellow
$commitMessage = @"
🎉 Initial commit: kmiza27-chatbot

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
- Environment examples
- Deploy documentation
- Development and production ready

📦 Repository: https://github.com/designativa07/kmiza27
🚀 Ready for deploy to production!
"@

git commit -m $commitMessage

# Push para GitHub
Write-Host "🚀 Fazendo push para GitHub..." -ForegroundColor Yellow
git push -u origin main

Write-Host ""
Write-Host "✅ Repositório configurado com sucesso!" -ForegroundColor Green
Write-Host "🔗 GitHub: https://github.com/designativa07/kmiza27" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Configure as variáveis de ambiente" -ForegroundColor White
Write-Host "2. Faça o deploy no Easypanel" -ForegroundColor White
Write-Host "3. Configure o webhook para produção" -ForegroundColor White
Write-Host "4. Teste o chatbot" -ForegroundColor White
Write-Host ""
Write-Host "🤖 O kmiza27-chatbot está pronto para uso!" -ForegroundColor Green 