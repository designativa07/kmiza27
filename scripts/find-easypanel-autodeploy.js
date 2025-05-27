#!/usr/bin/env node

/**
 * 🔍 Localizador de Configurações Auto-Deploy no EasyPanel
 * Este script ajuda a encontrar onde estão as configurações de auto-deploy
 */

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function main() {
  log('🔍 Localizador de Auto-Deploy no EasyPanel', 'bold');
  log('', 'reset');
  
  log('📋 CONFIGURAÇÃO ATUAL NECESSÁRIA:', 'blue');
  log('', 'reset');
  
  log('1️⃣ Na aba "Fonte" (Source):', 'cyan');
  log('   ✅ Fonte: Github', 'green');
  log('   ✅ Proprietário: designativa07', 'green');
  log('   ✅ Repositório: kmiza27', 'green');
  log('   ✅ Ramo: main', 'green');
  log('   ✅ Caminho de Build: / (deixe vazio ou "/")', 'green');
  log('', 'reset');
  
  log('2️⃣ Procure por Auto-Deploy nestas abas:', 'cyan');
  log('', 'reset');
  
  const locations = [
    {
      tab: 'Visão Geral',
      description: 'Pode ter um toggle "Auto Deploy" ou "Deploy Automático"',
      likely: '⭐⭐⭐'
    },
    {
      tab: 'Fonte',
      description: 'Após salvar, pode aparecer opção "Deploy on Push"',
      likely: '⭐⭐⭐⭐'
    },
    {
      tab: 'Implantações',
      description: 'Configurações de deploy e webhook',
      likely: '⭐⭐⭐⭐⭐'
    },
    {
      tab: 'Ambiente',
      description: 'Variáveis e configurações de build',
      likely: '⭐⭐'
    },
    {
      tab: 'Avançado',
      description: 'Configurações avançadas de CI/CD',
      likely: '⭐⭐⭐'
    }
  ];
  
  locations.forEach((location, index) => {
    log(`   ${index + 1}. ${location.tab} ${location.likely}`, 'yellow');
    log(`      ${location.description}`, 'reset');
    log('', 'reset');
  });
  
  log('3️⃣ Palavras-chave para procurar:', 'cyan');
  log('', 'reset');
  
  const keywords = [
    'Auto Deploy',
    'Deploy Automático', 
    'Webhook',
    'GitHub Webhook',
    'Continuous Deployment',
    'Auto Rebuild',
    'Deploy on Push',
    'Git Integration'
  ];
  
  keywords.forEach(keyword => {
    log(`   🔍 "${keyword}"`, 'yellow');
  });
  
  log('', 'reset');
  log('4️⃣ Passos para ativar:', 'cyan');
  log('', 'reset');
  log('   1. Configure o repositório na aba "Fonte"', 'reset');
  log('   2. Clique em "Salvar"', 'reset');
  log('   3. Aguarde a conexão ser estabelecida', 'reset');
  log('   4. Procure por toggle/checkbox de Auto Deploy', 'reset');
  log('   5. Se não encontrar, verifique outras abas', 'reset');
  log('', 'reset');
  
  log('🚨 SE NÃO ENCONTRAR AUTO-DEPLOY:', 'red');
  log('', 'reset');
  log('Algumas versões do EasyPanel podem não ter esta opção.', 'yellow');
  log('Neste caso, o GitHub Actions que configuramos funcionará como backup!', 'green');
  log('', 'reset');
  
  log('🎯 TESTE RÁPIDO:', 'blue');
  log('', 'reset');
  log('1. Configure o repositório conforme acima', 'reset');
  log('2. Salve as configurações', 'reset');
  log('3. Faça um pequeno commit e push:', 'reset');
  log('   git add . && git commit -m "test" && git push', 'cyan');
  log('4. Aguarde 2-3 minutos', 'reset');
  log('5. Verifique se o EasyPanel iniciou rebuild automaticamente', 'reset');
  log('', 'reset');
  
  log('📞 Se precisar de ajuda:', 'blue');
  log('   - Tire screenshot das abas do EasyPanel', 'reset');
  log('   - Mostre onde não consegue encontrar a opção', 'reset');
  log('   - O GitHub Actions já está funcionando como backup', 'green');
  log('', 'reset');
  
  log('✅ LEMBRE-SE:', 'green');
  log('Mesmo sem auto-deploy manual, o GitHub Actions', 'reset');
  log('já está monitorando e verificando os deploys!', 'reset');
}

if (require.main === module) {
  main();
}

module.exports = { main }; 