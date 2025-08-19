#!/bin/bash

# 🔨 Script de Build Alternativo para o Frontend
# Útil quando o Docker falha

echo "🔨 Iniciando build alternativo do frontend..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script do diretório frontend/"
    exit 1
fi

# Limpar instalações anteriores
echo "🧹 Limpando instalações anteriores..."
rm -rf node_modules package-lock.json .next

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Verificar se o TailwindCSS está instalado
if ! npm list tailwindcss > /dev/null 2>&1; then
    echo "📦 Instalando TailwindCSS..."
    npm install tailwindcss@latest
fi

# Build da aplicação
echo "🔨 Fazendo build da aplicação..."
npm run build

# Verificar se o build foi bem-sucedido
if [ -d ".next" ]; then
    echo "✅ Build concluído com sucesso!"
    echo "📁 Arquivos gerados em: .next/"
    echo "🚀 Para executar: npm start"
else
    echo "❌ Erro no build!"
    exit 1
fi
