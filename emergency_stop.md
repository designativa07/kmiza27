# 🚨 EMERGÊNCIA: Container bloqueando Easypanel na porta 3000

## Situação:
O frontend do robô está rodando na porta 3000 e impedindo o acesso ao Easypanel.

## ⚡ SOLUÇÕES IMEDIATAS:

### 1. **Via SSH (RECOMENDADO)**
```bash
# Conectar ao servidor
ssh root@195.200.0.191

# Ver containers rodando
docker ps

# Parar o container do frontend (substitua CONTAINER_ID)
docker stop CONTAINER_ID

# OU parar todos os containers
docker stop $(docker ps -q)

# Reiniciar apenas o Easypanel
docker restart easypanel
```

### 2. **Tentar outras portas do Easypanel:**
- http://195.200.0.191:8080
- http://195.200.0.191:8000  
- http://195.200.0.191:9000
- http://195.200.0.191:3001

### 3. **Via painel do provedor VPS:**
- Reiniciar o servidor completamente
- O Easypanel deve voltar antes do frontend

### 4. **Via API do Docker (se disponível):**
```bash
curl -X POST http://195.200.0.191:2376/containers/CONTAINER_ID/stop
```

## 🔧 APÓS RECUPERAR O ACESSO:

1. **No Easypanel, configure o frontend:**
   - Port: `3001` (NÃO 3000!)
   - Domain: Use um subdomínio diferente

2. **Faça redeploy com a versão 8.9:**
   - A nova versão força a porta 3001
   - Tem verificações anti-conflito

## 📞 CONTATOS DE EMERGÊNCIA:
- Suporte do provedor VPS
- Administrador do servidor
- Documentação do Easypanel

## ⚠️ PREVENÇÃO FUTURA:
- SEMPRE usar porta diferente de 3000 para aplicações
- Configurar subdomínios específicos
- Testar em ambiente de desenvolvimento primeiro 