# Build otimizado para Next.js standalone
FROM node:18-alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copiar código e fazer build
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

# Verificar estrutura e preparar standalone
RUN ls -la .next/
RUN cp -r .next/static .next/standalone/.next/static 2>/dev/null || echo "Static already included"
RUN mkdir -p .next/standalone/public

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs .next/standalone

USER nextjs
WORKDIR /app/.next/standalone

EXPOSE 3003

ENV PORT=3003
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"] 