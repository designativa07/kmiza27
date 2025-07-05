# Estágio 1: Builder - Constrói a aplicação
FROM node:18-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Copiar package.json e instalar dependências
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copiar o resto do código
COPY . .

# Variáveis de build (apenas para o estágio de build)
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

# ---
# Estágio 2: Runner - Executa a aplicação
FROM node:18-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar apenas os artefatos necessários do estágio de build
# E MAIS IMPORTANTE: definir o proprietário durante a cópia para evitar 'chown -R'
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Criar pasta public básica (Next.js requer essa pasta)
RUN mkdir -p ./public && \
    echo '<!doctype html><html><head><title>Futepédia</title></head><body><h1>Futepédia</h1></body></html>' > ./public/index.html && \
    chown -R nextjs:nodejs ./public

# Definir o usuário para executar a aplicação
USER nextjs

EXPOSE 3003

ENV PORT=3003
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"] 