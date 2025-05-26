# Configuração do Frontend no Easypanel

## ⚠️ IMPORTANTE: Conflito de Portas

O Easypanel roda na porta 3000 e o backend na porta 3001. Para evitar conflitos, nosso frontend Next.js está configurado para rodar na **porta 3002**.

## 📋 Configurações no Easypanel:

### 1. **Porta do Container**
- **Porta Interna**: `3002` (não 3000 nem 3001!)
- **Protocolo**: HTTP

### 2. **Domínio/Subdomínio**
Configure o domínio correto para o frontend:
- **Domínio**: `frontend.seudominio.com` (ou o subdomínio que você escolher)
- **NÃO** use o domínio principal onde o Easypanel está rodando

### 3. **Variáveis de Ambiente**
Certifique-se de que estas variáveis estejam configuradas:
```
PORT=3002
NODE_ENV=production
HOSTNAME=0.0.0.0
```

### 4. **Configuração do Proxy**
No Easypanel, ao configurar o serviço:
1. Vá em **Settings** → **Domains**
2. Adicione um novo domínio/subdomínio
3. Configure:
   - **Port**: `3002`
   - **HTTPS**: Ativado (recomendado)
   - **Force HTTPS**: Ativado (recomendado)

### 5. **Health Check** (Opcional)
Configure o health check para:
- **Path**: `/`
- **Port**: `3001`
- **Interval**: 30s

## 🔍 Verificação

Após o deploy, você deve ver nos logs:
```
[timestamp] Port: 3001
[timestamp] Hostname: 0.0.0.0
[timestamp] Starting Next.js standalone server...
```

## 🚨 Troubleshooting

Se o frontend abrir no lugar do Easypanel:
1. Verifique se a porta está configurada como `3001` no Easypanel
2. Certifique-se de que o domínio/subdomínio está correto
3. Limpe o cache do navegador
4. Verifique se não há redirecionamentos incorretos

## 📝 Notas

- O frontend DEVE rodar em um subdomínio diferente do Easypanel
- A porta 3001 foi escolhida para evitar conflitos
- O modo standalone do Next.js é otimizado para produção 