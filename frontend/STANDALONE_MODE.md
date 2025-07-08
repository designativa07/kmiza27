# Modo Standalone - Frontend Next.js

## ⚠️ Configuração Corrigida

O arquivo `next.config.js` foi corrigido para remover configurações inválidas e melhorar o deployment em produção.

## 🚀 Como Executar

### Desenvolvimento
```bash
npm run dev
```
- Usa `next dev -p 3002`
- Conecta-se ao backend em `http://localhost:3000`
- Hot reload ativo

### Produção - Modo Standalone
```bash
# 1. Build primeiro
npm run build

# 2. Executar em produção
npm run start
```
- Usa `node .next/standalone/server.js`
- Porta: 3002 (configurada via PORT=3002)
- Otimizado para deployment em containers

### Produção - Modo Regular (alternativo)
```bash
npm run start:regular
```
- Usa `next start -p 3002`
- Para casos onde standalone não é necessário

## 🛠️ Scripts Disponíveis

- `npm run dev` - Desenvolvimento com hot reload
- `npm run build` - Build para produção
- `npm run start` - **Produção standalone** (recomendado)
- `npm run start:regular` - Produção modo regular
- `npm run start:prod` - Produção standalone com variáveis específicas
- `npm run lint` - Verificação de código

## 📋 Variáveis de Ambiente

### Desenvolvimento
- `NEXT_PUBLIC_API_URL=http://localhost:3000`

### Produção
- `PORT=3002` - Porta do servidor
- `HOSTNAME=0.0.0.0` - Host (para containers)
- `NODE_ENV=production` - Ambiente de produção

## 🐳 Docker/Container Deployment

Com o modo standalone, o deployment fica mais simples:

```dockerfile
# Após o build
COPY .next/standalone ./
COPY public ./public
COPY .next/static ./.next/static

# Executar
CMD ["node", "server.js"]
```

## ⚡ Benefícios do Modo Standalone

1. **Bundle menor** - Remove dependências desnecessárias
2. **Inicialização mais rápida** - Servidor otimizado
3. **Melhor para containers** - Menos overhead
4. **Deploy simplificado** - Um arquivo executável

## 🔧 Problemas Resolvidos

- ❌ **Antes**: Configuração `server` inválida no `next.config.js`
- ❌ **Antes**: `next start` não funcionava com `output: standalone`
- ✅ **Depois**: Configuração limpa e scripts corretos
- ✅ **Depois**: Suporte completo ao modo standalone

## 📞 Suporte

Se encontrar problemas:
1. Verifique se executou `npm run build` antes de `npm run start`
2. Confirme que a pasta `.next/standalone` existe após o build
3. Verifique as variáveis de ambiente 