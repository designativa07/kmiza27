# 🚨 AVISO DE SEGURANÇA - CHAVE DA OPENAI EXPOSTA

## ⚠️ PROBLEMA IDENTIFICADO

Os arquivos `.env.development` e `.env.easypanel` foram **commitados acidentalmente** com a chave da OpenAI exposta publicamente no GitHub.

**Commit:** `95437bda6877ed6676c468bdec366c32e10ce3b2`
**Data:** 2025-10-07

## 🔥 AÇÕES IMEDIATAS NECESSÁRIAS

### 1️⃣ **REGENERAR A CHAVE DA OPENAI** (URGENTE!)

A chave atual foi **comprometida** e precisa ser regenerada IMEDIATAMENTE.

**Como fazer:**

1. Acesse: https://platform.openai.com/api-keys
2. Clique em "Revoke" na chave atual (a que está no .env)
3. Crie uma nova chave (Create new secret key)
4. Copie a nova chave
5. Atualize seus arquivos `.env.development` e `.env.easypanel` com a nova chave
6. **NUNCA** commite esses arquivos novamente!

### 2️⃣ **VERIFICAR USO INDEVIDO** (Opcional mas Recomendado)

Verifique se houve uso não autorizado da chave:

1. Acesse: https://platform.openai.com/usage
2. Verifique o histórico de uso nas últimas horas
3. Se houver uso suspeito, reporte ao suporte da OpenAI

### 3️⃣ **CONFIGURAR LIMITES DE GASTOS**

Para evitar surpresas:

1. Acesse: https://platform.openai.com/account/limits
2. Configure um limite de gastos mensal (ex: $10/mês)
3. Ative alertas de email para 50%, 75% e 90% do limite

## ✅ CORREÇÕES JÁ APLICADAS

### Arquivos Removidos do Git
- ✅ `.env.development` removido do repositório
- ✅ `.env.easypanel` removido do repositório
- ✅ `.gitignore` já estava configurado corretamente

### Arquivos Criados
- ✅ `.env.example` com template seguro
- ✅ `SECURITY_WARNING.md` (este arquivo)

## 📋 PRÓXIMOS PASSOS

### 1. Commit e Push das Correções

```bash
git add .gitignore .env.example SECURITY_WARNING.md
git commit -m "🔒 security: Remove arquivos .env do repositório e adiciona exemplo"
git push origin main
```

### 2. Criar Novos Arquivos .env (Localmente)

```bash
# Copiar o exemplo
cp .env.example .env.development
cp .env.example .env.easypanel

# Editar com suas credenciais
# ⚠️ Use a NOVA chave da OpenAI (regenerada)
```

### 3. Verificar se Está Funcionando

```bash
# Testar o chatbot com a nova chave
cd backend
node test-ai-intent-classifier.js
```

## 🛡️ BOAS PRÁTICAS PARA O FUTURO

### ✅ SEMPRE:
1. **Verificar** o que vai ser commitado antes de fazer `git add`
2. **Usar** `.env.example` para documentar variáveis necessárias
3. **Regenerar** chaves imediatamente se forem expostas
4. **Configurar** limites de gastos em serviços pagos
5. **Revisar** o diff antes de fazer push

### ❌ NUNCA:
1. Commitar arquivos `.env`, `.env.*`, `.env.local`, etc
2. Colocar chaves diretamente no código
3. Fazer push sem revisar o que está sendo enviado
4. Ignorar avisos do GitHub sobre secrets

## 🔍 COMO EVITAR NO FUTURO

### 1. Pre-commit Hook (Opcional)

Instale um hook que previne commits com secrets:

```bash
npm install --save-dev @commitlint/cli husky
npx husky init
```

### 2. GitHub Actions (Já Configurado)

O GitHub já tem proteção ativa (Secret Scanning).

### 3. Revisar Sempre

```bash
# Antes de commitar, sempre revise:
git status
git diff

# Certifique-se que nenhum .env aparece!
```

## 📞 SUPORTE

Se tiver dúvidas ou problemas:

1. **OpenAI:** https://help.openai.com
2. **GitHub Security:** https://docs.github.com/en/code-security
3. **Documentação do Projeto:** Veja `docs/` para mais informações

## ⏰ TIMELINE DAS CORREÇÕES

- **2025-10-07 16:00** - Problema identificado (GitHub bloqueou push)
- **2025-10-07 16:05** - Arquivos removidos do Git
- **2025-10-07 16:10** - Documentação de segurança criada
- **2025-10-07 16:15** - ⏳ **AGUARDANDO:** Regeneração da chave pelo usuário

---

**Status:** 🔴 **AÇÃO NECESSÁRIA** - Regenere a chave da OpenAI antes de continuar!

**Prioridade:** 🔥 **CRÍTICA** - Faça isso AGORA!

