# Multi-stage build para otimização
FROM node:18-alpine AS base

# Instalação de dependências apenas
FROM base AS deps
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
RUN npm ci --ignore-scripts --only=production

# Build da aplicação
FROM base AS builder
WORKDIR /app

# Copiar dependências e código fonte
COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .

# Variables de build
ARG NEXT_PUBLIC_API_URL
ARG NODE_ENV=production
ARG BUILD_TIMESTAMP
ARG GIT_SHA

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NODE_ENV=${NODE_ENV}
ENV BUILD_TIMESTAMP=${BUILD_TIMESTAMP}
ENV GIT_SHA=${GIT_SHA}

# Build da aplicação Next.js
RUN npm run build

# Imagem de produção
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3003

ENV PORT=3003
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"] 