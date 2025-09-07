# 📱 Guia dos Cards do Instagram - Kmiza27 Futepédia

## Visão Geral

Este guia explica como usar as páginas de cards otimizados para Instagram criadas para o projeto Kmiza27 Futepédia. Essas páginas foram desenvolvidas especificamente para captura de tela e postagem em redes sociais.

## 🎯 Páginas Disponíveis

### 1. Card Individual (`/instagram-card`)
- **URL:** `https://futepedia.kmiza27.com/instagram-card`
- **Formato:** Cards individuais para cada jogo
- **Ideal para:** Jogos importantes ou quando há poucos jogos no dia
- **Dimensões:** 1080x1350px (formato retangular otimizado)

### 2. Card em Grid (`/instagram-card-grid`)
- **URL:** `https://futepedia.kmiza27.com/instagram-card-grid`
- **Formato:** Grid 2x4 com até 8 jogos
- **Ideal para:** Dias com muitos jogos ou visão geral
- **Dimensões:** 1080x1350px (formato retangular otimizado)

## 🚀 Como Usar

### Para Captura de Tela

1. **Acesse a página desejada:**
   - Card individual: `/instagram-card`
   - Card em grid: `/instagram-card-grid`

2. **Aguarde o carregamento completo** dos dados dos jogos

3. **Faça a captura de tela** usando:
   - **Windows:** `Windows + Shift + S` ou `Print Screen`
   - **Mac:** `Cmd + Shift + 4`
   - **Navegador:** Ferramentas de desenvolvedor (F12) → Device Toolbar → iPhone X

4. **Edite a imagem** se necessário (recorte, ajuste de brilho, etc.)

5. **Poste no Instagram** com a hashtag `#Kmiza27` e `#Futepedia`

### Para Uso no Chatbot

As páginas podem ser integradas ao chatbot do WhatsApp para envio automático:

```typescript
// Exemplo de integração no chatbot
const instagramCardUrl = 'https://futepedia.kmiza27.com/instagram-card';
const message = `⚽ Jogos de hoje!\n\n📱 Card visual: ${instagramCardUrl}`;
```

## 🎨 Características dos Cards

### Design Otimizado
- **Formato retangular** (1080x1350px) otimizado para redes sociais
- **Fundo branco limpo** seguindo o estilo visual do site
- **Linhas cinza finas** para separação de elementos
- **Logo do Kmiza27** no topo para branding
- **Tipografia legível** em diferentes tamanhos de tela

### Informações Incluídas
- **Nome da competição** em destaque
- **Data e horário** do jogo
- **Times participantes** com escudos
- **Placar** (se finalizado) ou "VS" (se não iniciado)
- **Canais de transmissão** (quando disponíveis)
- **Estádio e cidade** (quando disponíveis)
- **Rodada/fase** da competição

### Branding Kmiza27
- **Logo e cores** da marca
- **Link para o site** principal
- **Slogan** "Acompanhe seus campeonatos favoritos em tempo real"

## 🔧 Personalização

### Cores e Estilo
As cores podem ser ajustadas editando as classes Tailwind CSS:

```css
/* Cores principais */
text-blue-800    /* Azul principal */
bg-indigo-600    /* Azul dos botões */
bg-purple-600    /* Roxo dos botões ASSISTIR */
```

### Dimensões
Para ajustar as dimensões, modifique as classes:

```css
w-[1080px] h-[1350px]  /* Dimensões fixas otimizadas */
```

### Limite de Jogos
- **Card individual:** Mostra até 4 jogos
- **Card em grid:** Mostra até 8 jogos
- **Jogos extras:** Mostra contador "+X jogos adicionais"

## 📱 Responsividade

### Dispositivos Suportados
- **Desktop:** 1080x1350px (otimizado)
- **Tablet:** Redimensiona automaticamente
- **Mobile:** Redimensiona automaticamente

### Navegadores Recomendados
- **Chrome:** Versão 90+
- **Firefox:** Versão 88+
- **Safari:** Versão 14+
- **Edge:** Versão 90+

## 🚨 Troubleshooting

### Problemas Comuns

1. **Página não carrega:**
   - Verifique se o backend está rodando
   - Confirme a URL da API no arquivo

2. **Jogos não aparecem:**
   - Verifique se há jogos agendados para hoje
   - Confirme a conexão com o banco de dados

3. **Imagens não carregam:**
   - Verifique a configuração do CDN
   - Confirme as URLs dos escudos dos times

4. **Layout quebrado:**
   - Verifique se o Tailwind CSS está carregado
   - Confirme as classes CSS aplicadas

### Logs de Debug

Para debugar problemas, abra o console do navegador (F12) e verifique:

```javascript
// Verificar dados carregados
console.log('Matches:', matches);

// Verificar URL da API
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
```

## 🔄 Atualizações

### Dados em Tempo Real
- Os cards são atualizados automaticamente
- Novos jogos aparecem sem necessidade de refresh
- Placares são atualizados em tempo real

### Cache
- Dados são cacheados por 5 minutos
- Para forçar atualização, adicione `?t=${Date.now()}` na URL

## 📞 Suporte

Para dúvidas ou problemas:

1. **Verifique este guia** primeiro
2. **Consulte os logs** do navegador
3. **Teste em diferentes navegadores**
4. **Entre em contato** com a equipe de desenvolvimento

---

**Desenvolvido com ❤️ para Kmiza27 Futepédia**
