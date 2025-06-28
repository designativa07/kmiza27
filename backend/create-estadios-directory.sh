#!/bin/bash

# Script para criar diretório de estadios no CDN
echo "🏟️ Criando diretório para imagens de estádios..."

# Criar diretório uploads/estadios se não existir
mkdir -p uploads/estadios

echo "✅ Diretório uploads/estadios criado com sucesso!"
echo "📁 Caminho: $(pwd)/uploads/estadios"

# Criar um arquivo .gitkeep para manter o diretório no git
touch uploads/estadios/.gitkeep

echo "🔧 Arquivo .gitkeep adicionado para manter o diretório no controle de versão"
echo "🎉 Configuração concluída!" 