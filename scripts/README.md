# Scripts Directory

This directory contains all scripts used for deployment, configuration, testing, and database management.

## Subdirectories

- **deploy/**: Contains all deployment scripts.
- **config/**: Contains all configuration scripts.
- **test/**: Contains all test and debug scripts.
- **db/**: Contains all database-related scripts.
- **utils/**: Contains all utility scripts.

## Usage

- **Deploy Scripts**: Use scripts in the `deploy/` directory for deployment tasks.
- **Config Scripts**: Use scripts in the `config/` directory for configuration tasks.
- **Test Scripts**: Use scripts in the `test/` directory for testing and debugging.
- **DB Scripts**: Use scripts in the `db/` directory for database management.
- **Utils Scripts**: Use scripts in the `utils/` directory for utility tasks.

## 📜 Scripts de Utilidade

Este diretório contém scripts úteis para desenvolvimento, deploy e manutenção do projeto Kmiza27.

## 📋 Scripts Disponíveis

### 🚀 Deploy e Configuração

- `deploy.sh` - Script principal de deploy
- `init-github.sh` - Configuração inicial do GitHub
- `init-github.ps1` - Versão PowerShell do script de configuração do GitHub

### 🔧 Manutenção

- `fix-git-secrets.ps1` - Corrige problemas com secrets do Git
- `fix-api-urls.js` - Atualiza URLs da API em arquivos de configuração

### 🧪 Testes

- `test-postgres-connection.ps1` - Testa conexão com o PostgreSQL
- `test-chatbot.ps1` - Testa funcionalidades do chatbot

## 🚀 Como Usar

### Deploy

```bash
# Linux/Mac
./deploy.sh

# Windows
.\deploy.ps1
```

### Configuração do GitHub

```bash
# Linux/Mac
./init-github.sh

# Windows
.\init-github.ps1
```

### Testes

```bash
# Testar conexão com PostgreSQL
.\test-postgres-connection.ps1

# Testar chatbot
.\test-chatbot.ps1
```

## 🔐 Segurança

- Todos os scripts que manipulam secrets devem ser executados com cuidado
- Verifique as permissões dos scripts antes de executá-los
- Mantenha os scripts atualizados com as melhores práticas de segurança

## 📝 Notas

- Scripts PowerShell (.ps1) são para Windows
- Scripts Shell (.sh) são para Linux/Mac
- Scripts JavaScript (.js) são multiplataforma 