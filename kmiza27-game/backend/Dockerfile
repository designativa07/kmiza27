# Dockerfile para o Backend do Jogo Kmiza27
FROM node:18-alpine

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências (incluindo devDependencies para o build)
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Remover devDependencies após o build
RUN npm prune --production

# Expor porta
EXPOSE 3004

# Comando para iniciar a aplicação
CMD ["npm", "run", "start:prod"] 