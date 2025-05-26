# Sistema de Upload de Escudos

## Visão Geral

O sistema agora suporta upload de arquivos de escudos para os times, substituindo o campo de URL por um sistema de upload de arquivos local.

## Funcionalidades Implementadas

### Backend

1. **Módulo de Upload** (`backend/src/modules/upload/`)
   - `UploadModule`: Configuração do multer para upload de arquivos
   - `UploadController`: Endpoints para upload e servir arquivos
   - `UploadService`: Serviços para gerenciar arquivos

2. **Integração com Teams**
   - Endpoint `POST /teams/:id/upload-escudo` para upload de escudo
   - Configuração do multer no TeamsModule
   - Servir arquivos estáticos em `/uploads/`

3. **Configurações**
   - Arquivos aceitos: JPG, JPEG, PNG, GIF, SVG
   - Tamanho máximo: 5MB
   - Diretório: `backend/uploads/escudos/`
   - Nomenclatura: `escudo-{timestamp}-{random}.{ext}`

### Frontend

1. **TeamsManager Atualizado**
   - Campo de upload de arquivo em vez de URL
   - Preview da imagem selecionada
   - Drag & drop para upload
   - Indicador de progresso durante upload

2. **Funcionalidades**
   - Preview da imagem antes do upload
   - Validação de tipo de arquivo
   - Exibição do nome do arquivo selecionado
   - Estado de loading durante upload

## Como Usar

### Adicionar Novo Time com Escudo

1. Clique em "Adicionar Time"
2. Preencha os dados do time
3. Na seção "Escudo do Time":
   - Clique em "Enviar escudo" ou arraste um arquivo
   - Selecione uma imagem (PNG, JPG, GIF, SVG)
   - Veja o preview da imagem
4. Clique em "Criar"

### Atualizar Escudo de Time Existente

1. Clique no ícone de edição do time
2. Na seção "Escudo do Time":
   - O escudo atual será exibido (se existir)
   - Selecione um novo arquivo para substituir
3. Clique em "Atualizar"

## Estrutura de Arquivos

```
backend/
├── uploads/
│   └── escudos/           # Arquivos de escudos enviados
├── src/
│   ├── modules/
│   │   ├── upload/        # Módulo de upload
│   │   └── teams/         # Módulo de times (atualizado)
│   └── main.ts            # Configuração para servir arquivos estáticos
```

## URLs dos Arquivos

- **Upload**: `POST /teams/:id/upload-escudo`
- **Acesso**: `GET /uploads/escudos/{filename}`
- **Exemplo**: `http://localhost:3000/uploads/escudos/escudo-1234567890-123.png`

## Validações

### Backend
- Tipos de arquivo permitidos: `.jpg`, `.jpeg`, `.png`, `.gif`, `.svg`
- Tamanho máximo: 5MB
- Diretório criado automaticamente se não existir

### Frontend
- Validação de tipo de arquivo no input
- Preview da imagem antes do upload
- Feedback visual durante o processo

## Teste

Use o arquivo `test-upload.html` na raiz do projeto para testar o sistema:

1. Abra o arquivo no navegador
2. Selecione um time da lista
3. Escolha um arquivo de imagem
4. Clique em "Enviar Escudo"

## Migração de Dados Existentes

Os times que já possuem `logo_url` com URLs externas continuarão funcionando. Para migrar para o sistema local:

1. Baixe as imagens das URLs existentes
2. Use o sistema de upload para enviar os arquivos
3. O novo caminho substituirá automaticamente a URL antiga

## Troubleshooting

### Erro "Nenhum arquivo foi enviado"
- Verifique se o arquivo foi selecionado
- Confirme que o tipo de arquivo é suportado

### Erro 413 "Payload Too Large"
- O arquivo excede 5MB
- Redimensione ou comprima a imagem

### Imagem não carrega
- Verifique se o backend está rodando
- Confirme que o arquivo existe em `backend/uploads/escudos/`
- Verifique as permissões do diretório

### CORS Error
- Confirme que o frontend está acessando `http://localhost:3000`
- Verifique a configuração de CORS no `main.ts` 