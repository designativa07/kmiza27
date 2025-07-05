#!/bin/bash
echo "Testando build do Docker da Futepédia..."

# Build da imagem
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.kmiza27.com \
  --build-arg NODE_ENV=production \
  --build-arg PORT=3003 \
  -t futepedia-test \
  .

# Verificar se o build foi bem-sucedido
if [ $? -eq 0 ]; then
    echo "✅ Build do Docker foi bem-sucedido!"
    echo "Para testar: docker run -p 3003:3003 futepedia-test"
else
    echo "❌ Build do Docker falhou!"
    exit 1
fi 