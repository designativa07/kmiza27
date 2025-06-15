# 📁 Configuração de Upload de Arquivos

## 🎯 Objetivo
Configurar o diretório `/img` no servidor para permitir uploads reais de logos de competições.

## 🔧 Como Funciona

O backend agora tem um sistema inteligente que:

1. **Tenta usar `/img/logo-competition`** se o diretório existir e tiver permissões
2. **Fallback para diretório temporário** se `/img` não estiver disponível
3. **Logs informativos** para mostrar qual diretório está sendo usado

## 📋 Passos para Configurar no Servidor

### 1. Conectar ao Servidor
```bash
ssh seu-usuario@seu-servidor
```

### 2. Executar o Script de Configuração
```bash
# Fazer download do script (se necessário)
chmod +x create-img-directory.sh
./create-img-directory.sh
```

### 3. Configuração Manual (Alternativa)
```bash
# Criar diretórios
sudo mkdir -p /img/logo-competition
sudo mkdir -p /img/team-logos
sudo mkdir -p /img/player-photos

# Configurar permissões
sudo chmod 755 /img
sudo chmod 755 /img/logo-competition
sudo chmod 755 /img/team-logos
sudo chmod 755 /img/player-photos

# Configurar proprietário (ajuste conforme seu ambiente)
sudo chown -R www-data:www-data /img
# OU se usar outro usuário:
# sudo chown -R node:node /img
# sudo chown -R app:app /img
```

### 4. Verificar Configuração
```bash
ls -la /img/
```

Deve mostrar algo como:
```
drwxr-xr-x 5 www-data www-data 4096 Dec 15 10:00 .
drwxr-xr-x 3 root     root     4096 Dec 15 10:00 ..
drwxr-xr-x 2 www-data www-data 4096 Dec 15 10:00 logo-competition
drwxr-xr-x 2 www-data www-data 4096 Dec 15 10:00 player-photos
drwxr-xr-x 2 www-data www-data 4096 Dec 15 10:00 team-logos
```

## 🚀 Reiniciar o Backend

Após criar o diretório, reinicie o backend:

```bash
# Se usando PM2
pm2 restart futepedia-backend

# Se usando Docker
docker restart nome-do-container

# Se usando systemd
sudo systemctl restart futepedia-backend
```

## 📊 Como Verificar se Está Funcionando

### 1. Logs do Backend
Procure por estas mensagens nos logs:
- `✅ Usando /img/logo-competition para upload` - **Sucesso!**
- `⚠️ Não foi possível usar /img, usando tmpdir` - Precisa configurar permissões

### 2. Teste de Upload
Faça upload de uma logo e verifique a resposta:

```json
{
  "message": "Logo da competição processado com sucesso!",
  "filePath": "/logo-competition/abc123.png",
  "uploadLocation": "/img/logo-competition",
  "environment": "production",
  "usingImgDirectory": true,
  "note": "Upload realizado em /img/logo-competition"
}
```

### 3. Verificar Arquivo no Servidor
```bash
ls -la /img/logo-competition/
```

## 🔧 Configuração do Nginx (Se Aplicável)

Se usar Nginx, adicione esta configuração para servir os arquivos:

```nginx
location /logo-competition/ {
    alias /img/logo-competition/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location /team-logos/ {
    alias /img/team-logos/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location /player-photos/ {
    alias /img/player-photos/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🐛 Solução de Problemas

### Problema: "Permission denied"
```bash
# Verificar proprietário
ls -la /img/

# Corrigir proprietário
sudo chown -R www-data:www-data /img/
# OU descobrir qual usuário executa o Node.js
ps aux | grep node
```

### Problema: "Directory not found"
```bash
# Verificar se existe
ls -la /img/

# Criar se não existir
sudo mkdir -p /img/logo-competition
```

### Problema: Backend ainda usa tmpdir
1. Verificar logs do backend
2. Verificar permissões do diretório
3. Reiniciar o backend após criar o diretório

## 📈 Próximos Passos (Opcional)

Para uma solução mais robusta em produção:

1. **AWS S3**: Configurar bucket S3 para uploads
2. **CDN**: Usar CloudFront ou similar
3. **Backup**: Configurar backup automático dos arquivos
4. **Compressão**: Implementar compressão automática de imagens

## 🆘 Suporte

Se tiver problemas:
1. Verificar logs do backend
2. Verificar permissões do diretório
3. Testar upload via API diretamente
4. Verificar configuração do Nginx/Apache 