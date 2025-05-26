#!/bin/bash

# 🚀 Script de Inicialização do GitHub - kmiza27-chatbot
# Repositório: https://github.com/designativa07/kmiza27

echo "🚀 Inicializando repositório GitHub para kmiza27-chatbot..."

# Verificar se git está instalado
if ! command -v git &> /dev/null; then
    echo "❌ Git não está instalado. Instale o Git primeiro."
    exit 1
fi

# Inicializar repositório Git (se não existir)
if [ ! -d ".git" ]; then
    echo "📦 Inicializando repositório Git..."
    git init
fi

# Adicionar remote origin
echo "🔗 Configurando remote origin..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/designativa07/kmiza27.git

# Configurar branch principal
echo "🌿 Configurando branch principal..."
git branch -M main

# Adicionar todos os arquivos
echo "📁 Adicionando arquivos ao staging..."
git add .

# Fazer commit inicial
echo "💾 Fazendo commit inicial..."
git commit -m "🎉 Initial commit: kmiza27-chatbot

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
🚀 Ready for deploy to production!"

# Push para GitHub
echo "🚀 Fazendo push para GitHub..."
git push -u origin main

echo ""
echo "✅ Repositório configurado com sucesso!"
echo "🔗 GitHub: https://github.com/designativa07/kmiza27"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure as variáveis de ambiente"
echo "2. Faça o deploy no Easypanel"
echo "3. Configure o webhook para produção"
echo "4. Teste o chatbot"
echo ""
echo "🤖 O kmiza27-chatbot está pronto para uso!" 