#!/bin/bash
# Script genérico para fazer commit e push de alterações.
# A mensagem de commit pode ser passada como um argumento.

set -e

echo "🚀 Iniciando deploy..."

# Adiciona todos os arquivos ao staging
git add .

# Define a mensagem de commit. Usa o primeiro argumento se fornecido, senão, uma mensagem padrão.
COMMIT_MESSAGE="${1:-feat: Alterações gerais e deploy}"

echo "💾 Fazendo commit com a mensagem: '$COMMIT_MESSAGE'"
git commit -m "$COMMIT_MESSAGE"

echo "🛰️ Enviando para o repositório..."
git push origin main

echo "✅ Deploy enviado com sucesso! O EasyPanel irá iniciar o build automaticamente." 