#!/bin/bash

# 🔨 Script de Build Alternativo para o Backend
# Útil quando o Docker falha

echo "🔨 Iniciando build alternativo do backend..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script do diretório backend/"
    exit 1
fi

# Limpar instalações anteriores
echo "🧹 Limpando instalações anteriores..."
rm -rf node_modules package-lock.json dist

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Verificar se o NestJS CLI está instalado
if ! command -v nest &> /dev/null; then
    echo "📦 Instalando NestJS CLI globalmente..."
    npm install -g @nestjs/cli
fi

# Build da aplicação
echo "🔨 Fazendo build da aplicação..."
npm run build

# Verificar se o build foi bem-sucedido
if [ -d "dist" ]; then
    echo "✅ Build concluído com sucesso!"
    echo "📁 Arquivos gerados em: dist/"
    echo "🚀 Para executar: npm run start:prod"
else
    echo "❌ Erro no build!"
    exit 1
fi
