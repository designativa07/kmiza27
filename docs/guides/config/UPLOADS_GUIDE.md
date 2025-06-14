# 📁 Guia Completo do Sistema de Uploads

Este guia aborda a funcionalidade de upload de escudos de times, desde seu uso na interface até a configuração de persistência de arquivos em ambiente de produção com EasyPanel.

## 1. Visão Geral da Funcionalidade

O sistema permite o upload de arquivos de escudos para os times, substituindo o antigo campo de URL por um sistema de upload de arquivos local, com persistência de dados.

### Funcionalidades Implementadas

#### Backend
- **Módulo de Upload dedicado** (`/upload`) com controller, service e configuração do Multer.
- **Integração com o módulo de Times**: Endpoint `POST /teams/:id/upload-escudo`.
- **Servidor de arquivos estáticos** para a pasta `/uploads`.
- **Validações**: Tipos de arquivo (JPG, PNG, GIF, SVG), tamanho máximo (5MB) e nomenclatura padronizada.

#### Frontend
- **Componente de Upload**: Campo de upload de arquivo com suporte a drag & drop.
- **Preview da imagem** antes do envio.
- **Validação de tipo de arquivo** no cliente.
- **Indicador de progresso** durante o upload.

## 2. Como Usar o Sistema de Upload

### Adicionar Novo Time com Escudo
1. Em "Adicionar Time", preencha os dados.
2. Na seção "Escudo do Time", clique em "Enviar escudo" ou arraste um arquivo de imagem.
3. Após o preview ser exibido, clique em "Criar".

### Atualizar Escudo de um Time
1. Edite um time existente.
2. Na seção "Escudo do Time", o escudo atual será exibido.
3. Selecione um novo arquivo para substituí-lo e clique em "Atualizar".

---

## 3. Configuração de Persistência em Produção (EasyPanel)

### 🚨 O Problema: Perda de Arquivos no Deploy
Por padrão, arquivos salvos dentro de um contêiner Docker são perdidos quando um novo deploy é feito, pois o contêiner antigo é destruído.

### ✅ A Solução: Volumes Persistentes
A solução é mapear uma pasta de dentro do contêiner para uma pasta no servidor host (a máquina onde o EasyPanel está rodando). Isso é feito usando um **Volume Persistente**.

#### **Passo a Passo da Configuração no EasyPanel:**
1.  **Acesse o serviço `kmizabot`** (backend) no seu painel EasyPanel.
2.  Navegue até a aba **"Volumes"** ou "Storage".
3.  **Adicione um novo volume** com a seguinte configuração:
    - **Host Path** (Caminho no Servidor): `/data/kmiza27/uploads` (ou outro caminho de sua preferência)
    - **Container Path** (Caminho no Contêiner): `/app/uploads`
    - **Type**: `bind`
4.  **Salve** as alterações e **reinicie** (ou faça rebuild) do serviço.

*Se o caminho no host não existir, pode ser necessário criá-lo via SSH e ajustar suas permissões.*
```bash
# Crie a pasta no servidor
sudo mkdir -p /data/kmiza27/uploads/escudos

# Dê permissões para o usuário do container (geralmente ID 1000)
sudo chown -R 1000:1000 /data/kmiza27/uploads
sudo chmod -R 755 /data/kmiza27/uploads
```

### Estrutura de Arquivos Após a Solução:
```
# Servidor Host (Dados Persistentes)
/data/kmiza27/uploads/
└── escudos/
    └── escudo-123.png ✅ (Mantido entre deploys)

# Contêiner Docker
/app/
└── uploads/ → (Mapeado para /data/kmiza27/uploads/)
```

### Solução Alternativa: Armazenamento em Nuvem
Para uma solução mais robusta, considere usar um serviço como **Cloudinary** ou **AWS S3**. Isso exigiria a instalação de SDKs e configuração de chaves de API no backend.

---

## 4. Estrutura e Endpoints

- **Estrutura de Pastas**: `backend/uploads/escudos/`
- **Endpoint de Upload**: `POST /teams/:id/upload-escudo`
- **Endpoint de Acesso**: `GET /uploads/escudos/{filename}`
- **URL de Exemplo**: `https://seu-backend.com/uploads/escudos/escudo-123.png`

---

## 5. Solução de Problemas (Troubleshooting)

### Erro: "Nenhum arquivo foi enviado"
- Verifique se o arquivo foi realmente selecionado na interface.
- Confirme se o tipo de arquivo é um dos permitidos (JPG, PNG, GIF, SVG).

### Erro 413: "Payload Too Large"
- O arquivo que você está tentando enviar excede o limite de 5MB.
- Comprima ou redimensione a imagem antes de enviar.

### Problema: Escudos desaparecem após deploy.
- **Causa**: O volume persistente não está configurado ou não está funcionando.
- **Solução**: Siga rigorosamente os passos da **Seção 3** deste guia. Verifique as permissões da pasta no servidor host.

### Problema: Upload funciona, mas a imagem não carrega (erro 404).
- **Causa**: O servidor de arquivos estáticos do NestJS pode não estar configurado corretamente ou o caminho está errado.
- **Solução**:
  - Verifique se o arquivo realmente existe na pasta do volume no servidor host (`/data/kmiza27/uploads/escudos/`).
  - Confirme a configuração de `ServeStaticModule` no `main.ts` ou `app.module.ts` do backend.
  - Verifique os logs do contêiner para qualquer erro relacionado ao acesso de arquivos.

### Problema: Erro de permissão ao fazer upload.
- **Causa**: O processo do Node.js dentro do contêiner não tem permissão para escrever na pasta mapeada no host.
- **Solução**: Ajuste as permissões da pasta no servidor host, como mostrado na Seção 3. `sudo chmod 777 /caminho/para/uploads` pode ser usado para testes, mas `755` é mais seguro. 