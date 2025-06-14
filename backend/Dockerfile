# 🐳 Dockerfile Backend - Otimizado para Auto-Deploy
# Contexto: Este Dockerfile deve estar localizado dentro da pasta /backend

# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Cache busting com argumentos de build
ARG CACHEBUST
ARG BUILD_TIMESTAMP
ARG GITHUB_SHA

# Copiar package files (agora do diretório local '.')
COPY package*.json ./

# Instalar TODAS as dependências (incluindo dev para build)
RUN npm install --legacy-peer-deps

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Copiar dependências do stage anterior
COPY --from=deps /app/node_modules ./node_modules
# Copiar código fonte (agora do diretório local '.')
COPY . .

# Receber argumentos de build novamente
ARG CACHEBUST
ARG BUILD_TIMESTAMP
ARG GITHUB_SHA

# Build da aplicação
RUN npm run build

# Stage 3: Production Dependencies
FROM node:18-alpine AS prod-deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm install --only=production --legacy-peer-deps --no-audit --no-fund

# Stage 4: Runner
FROM node:18-alpine AS runner
WORKDIR /app

# Instalar dependências de runtime
RUN apk add --no-cache curl dumb-init

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copiar arquivos necessários dos stages anteriores
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

# Criar script de inicialização
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "🚀 Iniciando backend..."' >> /app/start.sh && \
    echo 'node dist/src/main.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# Criar pastas necessárias com permissões corretas
RUN mkdir -p /app/uploads/escudos /app/logs /app/temp && \
    chown -R nestjs:nodejs /app/uploads /app/logs /app/temp && \
    chmod -R 755 /app/uploads /app/logs /app/temp

# Configurar usuário
USER nestjs

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Expor porta
EXPOSE 3000

# Inicializar com dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["/app/start.sh"] 