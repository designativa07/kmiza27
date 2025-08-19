#!/bin/bash

# 🔍 Script de Verificação de Imports - Kmiza27 Game
# Verifica se há problemas de imports nos componentes

echo "🔍 Verificando imports dos componentes..."
echo ""

# Verificar se estamos no diretório correto
if [ ! -d "frontend/src/components" ]; then
    echo "❌ Erro: Execute este script do diretório kmiza27-game/"
    exit 1
fi

# Verificar se o TypeScript está instalado
if ! command -v npx > /dev/null 2>&1; then
    echo "❌ Erro: npx não encontrado. Instale o Node.js primeiro."
    exit 1
fi

echo "📦 Verificando dependências..."
cd frontend
npm install

echo ""
echo "🔍 Verificando tipos TypeScript..."
npx tsc --noEmit --skipLibCheck

if [ $? -eq 0 ]; then
    echo "✅ Todos os imports estão corretos!"
else
    echo "❌ Encontrados problemas de imports!"
    echo ""
    echo "🔧 Para corrigir automaticamente:"
    echo "npx tsc --noEmit --skipLibCheck 2>&1 | grep -E 'Cannot find|has no exported member'"
fi

cd ..
echo ""
echo "✅ Verificação concluída!"
