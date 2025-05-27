# 📁 Guia de Persistência de Uploads - Escudos dos Times

## 🚨 Problema Identificado

**Sintoma**: Os escudos dos times desaparecem após cada deploy no EasyPanel.

**Causa**: Os arquivos são salvos dentro do container Docker na pasta `/app/uploads/escudos/`, mas quando o EasyPanel faz um novo deploy, ele cria um container completamente novo, perdendo todos os arquivos que não estão no código fonte.

## 🔧 Soluções Implementadas

### **Solução 1: Volume Persistente (Recomendado)**

#### Para EasyPanel:
1. **Configure um Volume Persistente** no painel do EasyPanel:
   - Vá para as configurações do serviço `kmizabot` (backend)
   - Adicione um volume:
     - **Host Path**: `/data/kmiza27/uploads`
     - **Container Path**: `/app/uploads`
     - **Type**: `bind`

2. **Ou use o arquivo `easypanel.yml`** (se suportado):
```yaml
services:
  backend:
    volumes:
      - /data/kmiza27/uploads:/app/uploads
```

#### Para Docker Compose Local:
```yaml
services:
  backend:
    volumes:
      - uploads_data:/app/uploads

volumes:
  uploads_data:
    driver: local
```

### **Solução 2: Armazenamento em Nuvem**

Para uma solução mais robusta, configure um serviço de nuvem:

#### Cloudinary (Recomendado):
1. **Instalar dependência**:
```bash
cd backend
npm install cloudinary
```

2. **Configurar variáveis de ambiente**:
```env
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret
```

3. **Ativar o serviço** em `upload-cloud.service.ts`

#### AWS S3:
```bash
npm install @aws-sdk/client-s3
```

## 🛠️ Como Configurar no EasyPanel

### Método 1: Interface Web
1. **Acesse o EasyPanel Dashboard**
2. **Selecione o serviço `kmizabot`**
3. **Vá para "Volumes" ou "Storage"**
4. **Adicione um novo volume**:
   - **Nome**: `uploads-data`
   - **Host Path**: `/data/kmiza27/uploads`
   - **Container Path**: `/app/uploads`
   - **Tipo**: `Bind Mount`
5. **Salve e reinicie o serviço**

### Método 2: Configuração via YAML
Se o EasyPanel suporta configuração via arquivo:

```yaml
# easypanel.yml
services:
  kmizabot:
    volumes:
      - type: bind
        source: /data/kmiza27/uploads
        target: /app/uploads
```

## 🔍 Como Verificar se Funcionou

### 1. Teste de Upload
1. **Faça upload de um escudo** via interface
2. **Verifique se aparece** na listagem de times
3. **Anote o nome do arquivo** (ex: `escudo-1234567890.png`)

### 2. Verificar Persistência
1. **Force um rebuild** no EasyPanel
2. **Aguarde o deploy completar**
3. **Verifique se o escudo ainda aparece**

### 3. Verificar no Servidor
```bash
# SSH no servidor (se disponível)
ls -la /data/kmiza27/uploads/escudos/

# Ou via API
curl https://kmizabot.h4xd66.easypanel.host/uploads/escudos/nome-do-arquivo.png
```

## 📂 Estrutura de Arquivos

### Antes (Problema):
```
Container (temporário):
├── app/
│   ├── uploads/
│   │   └── escudos/
│   │       └── escudo-123.png ❌ (perdido no deploy)
```

### Depois (Solução):
```
Host (persistente):
├── /data/kmiza27/uploads/
│   └── escudos/
│       └── escudo-123.png ✅ (mantido entre deploys)

Container:
├── app/
│   ├── uploads/ → /data/kmiza27/uploads/ (volume mount)
```

## 🚨 Troubleshooting

### Problema: Volume não está funcionando
**Sintomas**: Escudos ainda desaparecem após deploy

**Soluções**:
1. **Verificar permissões**:
```bash
sudo chown -R 1000:1000 /data/kmiza27/uploads
sudo chmod -R 755 /data/kmiza27/uploads
```

2. **Verificar se o volume está montado**:
```bash
docker exec -it container_name ls -la /app/uploads
```

3. **Verificar logs do container**:
```bash
docker logs container_name | grep uploads
```

### Problema: Arquivos não carregam
**Sintomas**: Upload funciona mas imagens não aparecem

**Soluções**:
1. **Verificar endpoint de servir arquivos**:
```bash
curl https://kmizabot.h4xd66.easypanel.host/uploads/escudos/arquivo.png
```

2. **Verificar configuração de arquivos estáticos** no backend

### Problema: Permissões negadas
**Sintomas**: Erro 500 ao fazer upload

**Soluções**:
1. **Ajustar permissões da pasta**:
```bash
sudo chmod 777 /data/kmiza27/uploads/escudos
```

2. **Verificar usuário do container**:
```dockerfile
# No Dockerfile
USER node
```

## 📋 Checklist de Implementação

- [ ] **Volume configurado** no EasyPanel
- [ ] **Pasta criada** no host (`/data/kmiza27/uploads`)
- [ ] **Permissões corretas** (755 ou 777)
- [ ] **Teste de upload** realizado
- [ ] **Teste de persistência** (após rebuild)
- [ ] **Endpoint de servir arquivos** funcionando
- [ ] **Backup dos uploads** configurado (opcional)

## 🔄 Migração de Uploads Existentes

Se você já tem escudos que desapareceram:

1. **Recuperar do backup** (se disponível)
2. **Re-upload manual** dos escudos
3. **Configurar volume** antes de novos uploads
4. **Testar persistência** com um arquivo de teste

## 📞 Suporte

Se o problema persistir:
1. **Verificar logs** do EasyPanel
2. **Contatar suporte** do EasyPanel sobre volumes persistentes
3. **Considerar migração** para armazenamento em nuvem
4. **Implementar backup** automático dos uploads 