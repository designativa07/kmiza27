#!/bin/bash
echo "🐳 Testando build do Docker da Futepédia (V2 - Correção Definitiva)..."

# Build da imagem
echo "📦 Iniciando build..."
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.kmiza27.com \
  --build-arg NODE_ENV=production \
  --build-arg PORT=3003 \
  --no-cache \
  -t futepedia-test \
  .

# Verificar se o build foi bem-sucedido
if [ $? -eq 0 ]; then
    echo "✅ Build do Docker foi bem-sucedido!"
    echo "🎯 Correção definitiva aplicada - sem dependências de pasta public"
    echo ""
    echo "Para testar:"
    echo "  docker run -p 3003:3003 futepedia-test"
    echo ""
    echo "Para acessar:"
    echo "  http://localhost:3003"
else
    echo "❌ Build do Docker falhou!"
    echo "🔍 Verifique os logs acima para detalhes"
    exit 1
fi 