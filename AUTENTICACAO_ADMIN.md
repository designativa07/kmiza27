# Sistema de Autenticação - Painel Administrativo Kmiza27

## 📋 Visão Geral

Foi implementado um sistema completo de autenticação para o painel administrativo do Kmiza27, incluindo login seguro, gerenciamento de usuários administrativos e controle de acesso baseado em JWT.

## 🔐 Credenciais de Acesso

### Administrador Padrão (Sistema)
- **Usuário:** `admin_kmiza27`
- **Senha:** `admin@kmiza27`

> ⚠️ **Importante:** Este usuário é hardcoded no sistema para garantir acesso inicial. Não pode ser removido ou modificado.

## 🚀 Como Iniciar o Sistema

### 1. Iniciar o Backend
```bash
cd backend
npm install
npm run start:dev
```

### 2. Iniciar o Painel Administrativo
```bash
cd admin-panel
npm install
node server.js
```

### 3. Acessar o Sistema
- Abra o navegador em: `http://localhost:4000`
- Use as credenciais do administrador padrão
- Será redirecionado automaticamente para o dashboard

## 🎯 Funcionalidades Implementadas

### Autenticação
- ✅ Login com usuário e senha
- ✅ Verificação de token JWT
- ✅ Logout seguro
- ✅ Redirecionamento automático baseado no status de autenticação
- ✅ Tokens com expiração de 24 horas

### Gerenciamento de Usuários Administrativos
- ✅ Visualizar todos os usuários
- ✅ Visualizar apenas administradores
- ✅ Criar novos usuários administrativos
- ✅ Promover usuários regulares a administradores
- ✅ Remover privilégios administrativos
- ✅ Excluir usuários
- ✅ Estatísticas em tempo real

### Interface
- ✅ Design moderno e responsivo
- ✅ Dashboard com estatísticas
- ✅ Tabelas com dados em tempo real
- ✅ Modais para criação de usuários
- ✅ Alertas de sucesso/erro
- ✅ Sistema de abas para organização

## 📊 Estatísticas Disponíveis

O dashboard exibe as seguintes métricas:
- **Total de Usuários:** Quantidade total de usuários no sistema
- **Administradores:** Número de usuários com privilégios administrativos
- **Usuários com Time:** Usuários que definiram um time favorito
- **Interações Recentes:** Usuários ativos nas últimas 24 horas

## 🔧 Endpoints da API

### Autenticação
- `POST /auth/login` - Fazer login
- `POST /auth/verify` - Verificar token
- `POST /auth/create-admin` - Criar usuário administrativo
- `POST /auth/change-password` - Alterar senha

### Usuários
- `GET /users` - Listar todos os usuários
- `GET /users/admins` - Listar apenas administradores
- `GET /users/stats` - Obter estatísticas
- `PATCH /users/:id/promote-admin` - Promover a administrador
- `PATCH /users/:id/demote-admin` - Remover privilégios de admin
- `DELETE /users/:id` - Excluir usuário

## 🛡️ Segurança

### Medidas Implementadas
- **Hashing de Senhas:** Usando bcrypt com salt rounds 10
- **JWT Tokens:** Tokens seguros com expiração
- **Verificação de Autorização:** Todos os endpoints protegidos
- **Sanitização de Dados:** Remoção de password_hash nas respostas

### Configurações de Segurança
- Secret JWT configurável via variável de ambiente `JWT_SECRET`
- Senhas hasheadas antes do armazenamento
- Tokens verificados em cada requisição protegida

## 📁 Estrutura de Arquivos

```
admin-panel/
├── public/
│   ├── index.html          # Página inicial com redirecionamento
│   ├── login.html          # Página de login
│   └── dashboard.html      # Dashboard principal
├── server.js               # Servidor Express com proxy
└── package.json

backend/src/modules/
├── auth/
│   ├── auth.controller.ts  # Controlador de autenticação
│   ├── auth.service.ts     # Serviços de autenticação
│   └── auth.module.ts      # Módulo de autenticação
└── users/
    ├── users.controller.ts # Controlador de usuários (atualizado)
    ├── users.service.ts    # Serviços de usuários (atualizado)
    └── users.module.ts
```

## 🔄 Fluxo de Autenticação

1. **Acesso Inicial:** Usuário acessa `http://localhost:4000`
2. **Verificação:** Sistema verifica se há token válido
3. **Redirecionamento:** 
   - Se autenticado → Dashboard
   - Se não autenticado → Login
4. **Login:** Usuário insere credenciais
5. **Validação:** Backend valida e retorna JWT
6. **Armazenamento:** Token salvo no localStorage
7. **Acesso:** Usuário pode acessar funcionalidades administrativas

## 🎨 Interface do Usuário

### Páginas
- **Login:** Interface moderna com validação em tempo real
- **Dashboard:** Estatísticas, tabelas de usuários e ações administrativas
- **Modais:** Formulários para criação de usuários administrativos

### Recursos Visuais
- Design responsivo
- Animações suaves
- Feedback visual (loading, alertas)
- Ícones Font Awesome
- Gradientes modernos

## 📝 Como Criar um Novo Administrador

1. Acesse o dashboard como administrador
2. Clique em "Criar Admin" 
3. Preencha o formulário:
   - **Nome:** Campo obrigatório
   - **Email:** Campo opcional (mas recomendado)
   - **Telefone:** Campo opcional
   - **Senha:** Campo obrigatório
4. Clique em "Criar Administrador"
5. O novo usuário aparecerá na lista

## 🔧 Troubleshooting

### Problemas Comuns

**Erro ao fazer login:**
- Verifique se o backend está rodando na porta 3000
- Confirme as credenciais: `admin_kmiza27` / `admin@kmiza27`

**Token inválido:**
- O token expira em 24 horas
- Faça logout e login novamente

**Erro de conexão:**
- Verifique se ambos os serviços estão rodando
- Backend: `http://localhost:3000`
- Painel: `http://localhost:4000`

### Logs Úteis
- Backend: Logs do NestJS no terminal
- Frontend: Console do navegador (F12)

## 🚀 Próximos Passos

Futuras melhorias podem incluir:
- [ ] Recuperação de senha por email
- [ ] Autenticação de dois fatores (2FA)
- [ ] Logs de auditoria
- [ ] Roles e permissões mais granulares
- [ ] Dashboard com mais métricas
- [ ] Notificações em tempo real

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique este guia primeiro
2. Confira os logs do sistema
3. Teste com usuário padrão do sistema

---

**Desenvolvido para Kmiza27 ChatBot** 🤖⚽ 