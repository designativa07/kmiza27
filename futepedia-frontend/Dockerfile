# Build simples e eficiente para Next.js standalone
FROM node:18-alpine AS base

# Dependências e ferramentas
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copiar código fonte
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
ENV NEXT_TELEMETRY_DISABLED=1

# Build da aplicação
RUN npm run build

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Configurar permissões
RUN chown -R nextjs:nodejs .next

USER nextjs

EXPOSE 3003

ENV PORT=3003
ENV HOSTNAME="0.0.0.0"

CMD ["node", ".next/standalone/server.js"] 