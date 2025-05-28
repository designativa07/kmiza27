# 📁 Configuração de Volume Persistente para Uploads

## Problema Identificado

Os escudos dos times desaparecem quando o container é reconstruído porque estão sendo salvos dentro do container, que é efêmero.

## Soluções Implementadas

### ✅ Solução 1: Volume Persistente Docker (RECOMENDADA)

#### Para Docker Compose Local:
```yaml
services:
  backend:
    volumes:
      - uploads_data:/app/uploads  # Volume persistente
```

#### Para Easypanel:

1. **Na tela de configuração do serviço Backend:**
   - Acesse "Mounts" ou "Volumes"
   - Adicione um novo mount:
     - **Container Path:** `/app/uploads`
     - **Type:** `volume` 
     - **Volume Name:** `kmiza27-uploads`

2. **Rebuild o serviço** para aplicar as mudanças

### ✅ Solução 2: URLs Externas (IMPLEMENTADA)

O TeamsManager agora suporta duas opções:

#### Upload de Arquivo (Requer Volume)
- Para arquivos pequenos
- Controle total sobre os arquivos
- Requer configuração de volume persistente

#### URL Externa (Sempre Funciona)
- Use sites como:
  - **Imgur:** https://imgur.com
  - **GitHub:** Raw links de repositórios
  - **Cloudinary:** https://cloudinary.com
  - **Qualquer CDN**

## Como Usar URLs Externas

### 1. Upload para Imgur
1. Acesse https://imgur.com
2. Faça upload da imagem
3. Clique com botão direito na imagem
4. "Copiar endereço da imagem"
5. Cole no campo URL do sistema

### 2. GitHub Raw Links
1. Adicione a imagem a um repositório público
2. Acesse o arquivo no GitHub
3. Clique em "Raw"
4. Copie a URL

Exemplo:
```
https://raw.githubusercontent.com/usuario/repo/main/escudos/flamengo.png
```

### 3. Sites de Times
Muitos times têm escudos públicos:
```
https://logoeps.com/flamengo/vector/4147/
https://ssl.gstatic.com/onebox/media/sports/logos/...
```

## Configuração no Easypanel

### Opção A: Volume Named
```yaml
# Na configuração de Mounts
Container Path: /app/uploads
Type: volume
Volume Name: kmiza27-uploads
```

### Opção B: Host Path (Se tiver acesso SSH)
```yaml
# Na configuração de Mounts  
Container Path: /app/uploads
Type: bind
Host Path: /opt/easypanel/projects/kmiza27/uploads
```

## Verificação

### Teste de Persistência:
1. Adicione um escudo via upload
2. Rebuild o container
3. Verifique se o escudo permanece

### Logs para Debug:
```bash
# Verificar se a pasta existe
docker exec -it <container> ls -la /app/uploads/escudos/

# Verificar permissões
docker exec -it <container> ls -la /app/uploads/
```

## API Endpoints Relacionados

### Upload de Escudo:
```
POST /teams/:id/upload-escudo
Content-Type: multipart/form-data
```

### Servir Arquivos:
```
GET /uploads/escudos/:filename
```

### Health Check:
```
GET /health
```

## Estrutura de Arquivos

```
backend/
├── uploads/               # Precisa ser volume persistente
│   └── escudos/          # Escudos dos times
│       ├── escudo-123456.png
│       └── escudo-789012.jpg
├── src/
│   └── modules/
│       ├── teams/        # CRUD de times
│       └── upload/       # Upload de arquivos
└── main.ts              # Configuração de assets estáticos
```

## Backup dos Uploads

### Script de Backup (Executar no host):
```bash
#!/bin/bash
# backup-uploads.sh

CONTAINER_NAME="kmiza27-backend"
BACKUP_DIR="/opt/backups/kmiza27-uploads"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
docker cp $CONTAINER_NAME:/app/uploads $BACKUP_DIR/uploads_$DATE
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C $BACKUP_DIR uploads_$DATE
rm -rf $BACKUP_DIR/uploads_$DATE

echo "Backup criado: $BACKUP_DIR/uploads_$DATE.tar.gz"
```

## Solução de Problemas

### Escudos não aparecem:
1. ✅ Verificar se volume está configurado
2. ✅ Verificar permissões da pasta
3. ✅ Usar URLs externas como alternativa

### Performance:
- URLs externas são mais rápidas (CDN)
- Uploads locais são mais confiáveis
- Considere híbrido: upload + CDN

### Migração:
Para migrar uploads existentes para volume:
```bash
# Copiar uploads do container para volume
docker cp container:/app/uploads ./uploads-backup
# Configurar volume
# Copiar de volta
docker cp ./uploads-backup container:/app/uploads
```

## Conclusão

✅ **Sistema Dual Implementado:**
- Upload de arquivos (requer volume)
- URLs externas (sempre funciona)

✅ **Para Produção Recomenda-se:**
1. Configurar volume persistente no Easypanel
2. Usar URLs externas para escudos importantes
3. Fazer backups regulares dos uploads 