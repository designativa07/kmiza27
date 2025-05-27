#!/bin/bash

# 🔑 Script para Gerar Deploy Keys - Repositório Privado Kmiza27

echo "🔑 Gerando Deploy Keys para Repositório Privado..."
echo ""

# Criar diretório para chaves
mkdir -p ~/.ssh/kmiza27-deploy
cd ~/.ssh/kmiza27-deploy

# Gerar chave SSH
echo "📝 Gerando chave SSH Ed25519..."
ssh-keygen -t ed25519 -C "easypanel-deploy-kmiza27" -f kmiza27_deploy_key -N ""

echo ""
echo "✅ Chaves geradas com sucesso!"
echo ""

# Mostrar chave pública
echo "🔓 CHAVE PÚBLICA (para adicionar no GitHub):"
echo "================================================"
cat kmiza27_deploy_key.pub
echo "================================================"
echo ""

# Mostrar chave privada
echo "🔒 CHAVE PRIVADA (para adicionar no Easypanel):"
echo "================================================"
cat kmiza27_deploy_key
echo "================================================"
echo ""

# Instruções
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1. 📋 COPIE a chave PÚBLICA acima"
echo "2. 🌐 Vá para: https://github.com/designativa07/kmiza27/settings/keys"
echo "3. ➕ Clique 'Add deploy key'"
echo "4. 📝 Title: 'Easypanel Deploy'"
echo "5. 🔑 Cole a chave pública"
echo "6. ✅ Marque 'Allow write access' (se necessário)"
echo "7. 💾 Clique 'Add key'"
echo ""
echo "8. 🎛️ No Easypanel:"
echo "   - Vá para App Settings → Environment Variables"
echo "   - Adicione: SSH_PRIVATE_KEY"
echo "   - Cole a chave PRIVADA (incluindo -----BEGIN/END-----)"
echo ""
echo "9. 🐳 Atualize os Dockerfiles para usar SSH"
echo ""

# Salvar instruções em arquivo
cat > DEPLOY_KEYS_INSTRUCTIONS.md << 'EOF'
# 🔑 Deploy Keys - Instruções de Uso

## 📋 Chaves Geradas

- **Chave Pública**: `kmiza27_deploy_key.pub`
- **Chave Privada**: `kmiza27_deploy_key`

## 🌐 Configurar no GitHub

1. Acesse: https://github.com/designativa07/kmiza27/settings/keys
2. Clique "Add deploy key"
3. Title: "Easypanel Deploy"
4. Key: Cole o conteúdo de `kmiza27_deploy_key.pub`
5. ✅ Allow write access (se necessário)
6. Clique "Add key"

## 🎛️ Configurar no Easypanel

### Environment Variables:
```
SSH_PRIVATE_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
[conteúdo da chave privada]
-----END OPENSSH PRIVATE KEY-----
```

### Build Arguments:
```
CACHEBUST: $(date +%s)
GIT_COMMIT: main
SSH_PRIVATE_KEY: ${SSH_PRIVATE_KEY}
```

## 🐳 Atualizar Dockerfiles

Adicionar antes do git clone:

```dockerfile
ARG SSH_PRIVATE_KEY
RUN mkdir -p /root/.ssh && \
    echo "$SSH_PRIVATE_KEY" > /root/.ssh/id_ed25519 && \
    chmod 600 /root/.ssh/id_ed25519 && \
    ssh-keyscan github.com >> /root/.ssh/known_hosts
```

Trocar git clone para SSH:
```dockerfile
RUN git clone --depth 1 --branch $GIT_COMMIT git@github.com:designativa07/kmiza27.git /tmp/repo
```

## ✅ Testar Configuração

```bash
# Testar conexão SSH
ssh -T git@github.com

# Testar clone
git clone git@github.com:designativa07/kmiza27.git test-clone
```
EOF

echo "📄 Instruções salvas em: DEPLOY_KEYS_INSTRUCTIONS.md"
echo ""
echo "🎉 Deploy Keys prontas para uso!" 