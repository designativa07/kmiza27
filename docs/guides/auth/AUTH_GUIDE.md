# 🔐 Guia Completo de Autenticação (JWT + Painel Admin)

Este guia cobre a arquitetura de autenticação baseada em JWT do projeto e detalha o funcionamento do Painel Administrativo.

## 1. Arquitetura de Autenticação (JWT)

O sistema de autenticação do Kmiza27 utiliza JSON Web Tokens (JWT) para gerenciar sessões de usuários e administradores de forma segura e eficiente.

### 1.1. Estrutura do Token
O payload do JWT contém as informações essenciais do usuário para validação no backend.
```typescript
// Estrutura do JWT Payload
interface JwtPayload {
  sub: string;      // ID do usuário
  email: string;    // Email do usuário
  role: string;     // Papel (role) do usuário (ex: 'admin' ou 'user')
  iat: number;      // Timestamp de emissão
  exp: number;      // Timestamp de expiração
}
```

### 1.2. Configuração
As chaves secretas e o tempo de expiração são configurados via variáveis de ambiente no backend.
```env
# Backend .env
JWT_SECRET=seu_jwt_secret_super_seguro
JWT_EXPIRES_IN=24h
```

### 1.3. Fluxo de Autenticação
1.  **Login**: O usuário envia credenciais (`email`/`senha`). O backend as valida, gera um JWT e o retorna. O frontend armazena o token de forma segura (ex: `localStorage`).
2.  **Requisições Autenticadas**: Para acessar rotas protegidas, o frontend envia o JWT no cabeçalho `Authorization` de cada requisição (`Bearer <token>`).
3.  **Validação no Backend**: O backend utiliza uma `Guard` do NestJS para interceptar a requisição, validar o token (assinatura e expiração) e extrair os dados do usuário.
4.  **Logout**: O token é removido do armazenamento do frontend, e o estado de autenticação é limpo.

---

## 2. Painel Administrativo: Autenticação e Gerenciamento

O projeto inclui um painel administrativo completo para gerenciamento de usuários, com seu próprio fluxo de autenticação.

### 2.1. Credenciais de Acesso Padrão
Para o primeiro acesso, utilize o administrador padrão do sistema:
- **Usuário:** `admin_kmiza27`
- **Senha:** `admin@kmiza27`

> ⚠️ **Importante:** Este usuário é "hardcoded" no sistema para garantir o acesso inicial e não pode ser removido ou modificado através da interface.

### 2.2. Como Acessar o Painel
1.  **Inicie o Backend**: `cd backend && npm run start:dev`
2.  **Inicie o Painel Admin**: `cd admin-panel && node server.js`
3.  **Acesse no Navegador**: `http://localhost:4000`

O sistema verificará se você possui um token válido e o redirecionará para a página de login ou para o dashboard principal.

### 2.3. Funcionalidades do Painel
- **Autenticação Segura**: Login, verificação de token e logout.
- **Gerenciamento de Usuários**:
    - Visualizar todos os usuários e filtrar por administradores.
    - Criar novos usuários com perfil de administrador.
    - Promover usuários existentes a administradores.
    - Remover privilégios administrativos.
    - Excluir usuários.
- **Dashboard com Estatísticas**:
    - Total de usuários e administradores.
    - Usuários com time favorito definido.
    - Interações recentes.

---

## 3. Endpoints da API

### Autenticação
- `POST /auth/login`: Realiza o login para usuários e administradores.
- `POST /auth/verify`: (Interno) Verifica a validade de um token.
- `GET /auth/me`: Retorna os dados do usuário logado.

### Gerenciamento de Usuários (Rotas de Admin)
- `GET /users`: Lista todos os usuários.
- `GET /users/admins`: Lista apenas usuários com a role 'admin'.
- `GET /users/stats`: Retorna as estatísticas para o dashboard.
- `POST /auth/create-admin`: Cria um novo usuário com perfil de administrador.
- `PATCH /users/:id/promote-admin`: Promove um usuário existente a administrador.
- `PATCH /users/:id/demote-admin`: Remove os privilégios de administrador de um usuário.
- `DELETE /users/:id`: Exclui um usuário do sistema.

---

## 4. Segurança
- **Hashing de Senhas**: As senhas são hasheadas com `bcrypt` antes de serem salvas no banco de dados.
- **Proteção de Rotas**: Endpoints sensíveis são protegidos por `Guards` que exigem um JWT válido e, em alguns casos, a role de 'admin'.
- **Expiração de Tokens**: Os tokens expiram automaticamente após 24 horas, exigindo um novo login.

---

## 5. Solução de Problemas (Troubleshooting)

### Problema: Erro ao fazer login no Painel Admin.
- **Verifique os Serviços**: Garanta que tanto o backend (`localhost:3000`) quanto o servidor do painel admin (`localhost:4000`) estejam rodando.
- **Verifique as Credenciais**: Confirme que está usando `admin_kmiza27` / `admin@kmiza27` para o primeiro acesso.

### Problema: Acesso negado a uma rota protegida (erro 401 ou 403).
- **Token Expirado**: O token JWT tem validade de 24 horas. Faça o logout e o login novamente para obter um novo token.
- **Falta de Permissão (Role)**: Você pode estar tentando acessar uma rota de administrador com um token de usuário comum.
- **Token Ausente ou Malformado**: Verifique se o frontend está enviando o cabeçalho `Authorization: Bearer <token>` corretamente.

### Problema: Erro de conexão entre o Painel Admin e o Backend.
- Verifique os logs no terminal de ambos os serviços. O painel (rodando na porta 4000) atua como um proxy para o backend (rodando na 3000). Erros de CORS ou de rede aparecerão nos logs. 