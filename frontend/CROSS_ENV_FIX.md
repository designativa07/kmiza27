# Correção do Problema cross-env

## ⚠️ Problema Identificado

O erro `sh: 1: cross-env: not found` ocorria porque o `cross-env` não estava instalado nas dependências do frontend, mas estava sendo usado nos scripts do `package.json`.

## ✅ Soluções Implementadas

### 1. Adicionado cross-env às Dependências
```json
"devDependencies": {
  "cross-env": "^7.0.3"
}
```

### 2. Scripts Simplificados
Criamos versões dos scripts que não dependem do `cross-env` por padrão:

```json
{
  "dev": "next dev -p 3002",
  "dev:api": "cross-env NEXT_PUBLIC_API_URL=http://localhost:3000 next dev -p 3002",
  "start": "node .next/standalone/server.js",
  "start:regular": "next start -p 3002",
  "start:prod": "node .next/standalone/server.js"
}
```

## 🚀 Como Usar

### Desenvolvimento
```bash
# Desenvolvimento simples (usa configuração padrão)
npm run dev

# Desenvolvimento com API específica
npm run dev:api
```

### Produção
```bash
# Build primeiro
npm run build

# Executar em produção (modo standalone)
npm run start

# Alternativa (modo regular do Next.js)
npm run start:regular
```

## 🔧 Configuração de Porta

### Modo Standalone
A porta é configurada automaticamente para 3002 pelo servidor standalone do Next.js. Se precisar alterar:

```bash
# Via variável de ambiente
PORT=3001 npm run start

# Via script personalizado (adicione ao package.json)
"start:custom": "cross-env PORT=3001 node .next/standalone/server.js"
```

### Modo Regular
```bash
# A porta é especificada diretamente no comando
npm run start:regular  # Roda na porta 3002
```

## 📋 Variáveis de Ambiente

### Desenvolvimento
- `NEXT_PUBLIC_API_URL`: URL da API (padrão: detectado automaticamente)
- `PORT`: Porta do servidor (padrão: 3002)

### Produção
- `NODE_ENV`: Ambiente (production/development)
- `PORT`: Porta do servidor
- `HOSTNAME`: Host do servidor (padrão: localhost, produção: 0.0.0.0)

## 🆘 Troubleshooting

### Se ainda encontrar erro "cross-env not found":
1. Certifique-se de que executou `npm install`
2. Use os scripts sem cross-env: `npm run start` em vez de `npm run start:cross-env`
3. Instale globalmente: `npm install -g cross-env`

### Para definir variáveis manualmente:
```bash
# Windows (PowerShell)
$env:PORT=3001; npm run start

# Windows (CMD)
set PORT=3001 && npm run start

# Linux/macOS
PORT=3001 npm run start
```

## ✅ Status

- ✅ **cross-env instalado** nas devDependencies
- ✅ **Scripts funcionais** sem dependência do cross-env
- ✅ **Compatibilidade** mantida com scripts que usam cross-env
- ✅ **Documentação** completa para diferentes cenários
- ✅ **Frontend rodando** na porta 3002 sem erros

## 🔗 Integração

Este fix é compatível com:
- Modo standalone do Next.js
- Scripts da raiz do projeto (`npm run dev:frontend`)
- Deployment em containers
- Desenvolvimento local 