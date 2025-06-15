#!/bin/bash

# Script para criar diretório /img com permissões corretas
# Execute este script no servidor de produção

echo "🚀 Criando diretório /img para uploads..."

# Criar diretório /img se não existir
if [ ! -d "/img" ]; then
    echo "📁 Criando diretório /img..."
    sudo mkdir -p /img
    echo "✅ Diretório /img criado"
else
    echo "📁 Diretório /img já existe"
fi

# Criar subdiretórios necessários
echo "📁 Criando subdiretórios..."
sudo mkdir -p /img/logo-competition
sudo mkdir -p /img/team-logos
sudo mkdir -p /img/player-photos

# Definir permissões corretas
echo "🔐 Configurando permissões..."
sudo chmod 755 /img
sudo chmod 755 /img/logo-competition
sudo chmod 755 /img/team-logos
sudo chmod 755 /img/player-photos

# Definir proprietário (ajuste conforme necessário)
# Substitua 'www-data' pelo usuário que executa o Node.js
echo "👤 Configurando proprietário..."
sudo chown -R www-data:www-data /img

# Verificar se tudo está correto
echo "🔍 Verificando configuração..."
ls -la /img/

echo "✅ Configuração concluída!"
echo ""
echo "📋 Resumo:"
echo "   - Diretório: /img"
echo "   - Subdiretórios: logo-competition, team-logos, player-photos"
echo "   - Permissões: 755"
echo "   - Proprietário: www-data"
echo ""
echo "🚀 Agora você pode reiniciar o backend e ele usará /img para uploads!" 