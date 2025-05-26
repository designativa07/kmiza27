# 🐳 Dockerfile para kmiza27-chatbot Backend - Easypanel
# Dockerfile otimizado para resolver conflitos de dependências

FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    dumb-init

# Definir diretório de trabalho
WORKDIR /app

# Copiar apenas package.json (sem package-lock.json para evitar conflitos)
COPY backend/package.json ./

# Instalar dependências com fresh install
RUN npm cache clean --force && \
    npm install --legacy-peer-deps --force

# Copiar código fonte do backend
COPY backend/ ./

# Copiar database schema se necessário
COPY database/ ./database/

# Build da aplicação NestJS
RUN npm run build

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Criar diretórios necessários e ajustar permissões
RUN mkdir -p /app/logs && \
    chown -R nestjs:nodejs /app

# Configurar usuário não-root
USER nestjs

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Usar dumb-init para gerenciar processos
ENTRYPOINT ["dumb-init", "--"]

# Comando para iniciar a aplicação
CMD ["node", "dist/main.js"] 