# Kmiza Bot

Sistema de gerenciamento de apostas e competições esportivas.

## Estrutura do Projeto

```
kmiza27/
├── admin-panel/          # Painel administrativo
├── backend/             # API e serviços backend
├── database/            # Scripts e arquivos relacionados ao banco de dados
│   ├── migrations/      # Scripts de migração do banco
│   ├── dumps/          # Backups e dumps SQL
│   ├── scripts/        # Utilitários e scripts de importação
│   ├── tests/          # Scripts de teste do banco
│   ├── assets/         # Arquivos de dados (escudos, etc)
│   └── legacy/         # Scripts antigos ou obsoletos
├── docker/             # Configurações Docker
├── docs/               # Documentação do projeto
│   ├── guides/         # Tutoriais e guias de uso
│   ├── changelogs/     # Histórico de mudanças
│   ├── examples/       # Exemplos de uso
│   ├── readmes/        # READMEs específicos
│   └── legacy/         # Documentação antiga
├── frontend/           # Interface do usuário
├── scripts/            # Scripts de automação e utilidades
│   ├── deploy/         # Scripts de deploy
│   ├── config/         # Scripts de configuração
│   ├── test/          # Scripts de teste
│   ├── db/            # Scripts de banco de dados
│   └── utils/         # Utilitários gerais
└── tests/              # Testes automatizados
```

## Requisitos

- Node.js 18+
- PostgreSQL 14+
- Docker e Docker Compose
- Git

## Instalação

1. Clone o repositório:
```bash
git clone [URL_DO_REPOSITORIO]
cd kmiza27
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. Inicie os serviços com Docker:
```bash
docker-compose up -d
```

## Desenvolvimento

- Backend: `npm run dev` na pasta `backend/`
- Frontend: `npm run dev` na pasta `frontend/`
- Admin Panel: `npm run dev` na pasta `admin-panel/`

## Documentação

Toda a documentação do projeto foi revisada e consolidada em guias claros e objetivos, localizados em `docs/guides/`.

### Guias Principais

- **[Guia de Deploy e CI/CD](./docs/guides/deploy/DEPLOY.md)**: Instruções completas sobre o fluxo de build, deploy e a estratégia de cache busting.

- **[Guia de Configuração do EasyPanel](./docs/guides/config/EASYPANEL_GUIDE.md)**: Como configurar o ambiente de execução no EasyPanel, incluindo domínios, portas e volumes.

- **[Guia do Dashboard Administrativo](./docs/guides/usage/ADMIN_DASHBOARD_GUIDE.md)**: Um manual completo para usar e desenvolver o painel administrativo.

- **[Guia de Autenticação](./docs/guides/auth/AUTH_GUIDE.md)**: Detalhes sobre a arquitetura de autenticação com JWT e o funcionamento do painel admin.

- **[Guia de Testes](./docs/guides/test/TESTING_GUIDE.md)**: Procedimentos para testes funcionais (via WhatsApp) e testes de API (para desenvolvedores).

- **[Guia do Sistema de Uploads](./docs/guides/config/UPLOADS_GUIDE.md)**: Como funciona a funcionalidade de upload e como garantir a persistência dos arquivos.

## Scripts Úteis

Scripts de automação estão disponíveis em `scripts/`:

- Deploy: `scripts/deploy/`
- Configuração: `scripts/config/`
- Testes: `scripts/test/`
- Banco de dados: `scripts/db/`
- Utilitários: `scripts/utils/`

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes. 