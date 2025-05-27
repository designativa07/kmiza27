#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Configurações dos serviços
const services = [
  {
    name: 'Backend API',
    url: 'https://kmizabot.h4xd66.easypanel.host/health',
    type: 'https'
  },
  {
    name: 'Frontend',
    url: 'https://kmizafrontend.h4xd66.easypanel.host/api/health',
    type: 'https'
  }
];

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Kmiza27-Status-Checker/1.0',
        'Cache-Control': 'no-cache'
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            responseTime,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            responseTime,
            success: false,
            error: 'Invalid JSON response'
          });
        }
      });
    });
    
    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      reject({
        success: false,
        error: error.message,
        responseTime
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      const responseTime = Date.now() - startTime;
      reject({
        success: false,
        error: 'Request timeout',
        responseTime
      });
    });
  });
}

function formatStatus(success) {
  if (success) {
    return `${colors.green}${colors.bold}✓ ONLINE${colors.reset}`;
  } else {
    return `${colors.red}${colors.bold}✗ OFFLINE${colors.reset}`;
  }
}

function formatResponseTime(time) {
  if (time < 500) {
    return `${colors.green}${time}ms${colors.reset}`;
  } else if (time < 1000) {
    return `${colors.yellow}${time}ms${colors.reset}`;
  } else {
    return `${colors.red}${time}ms${colors.reset}`;
  }
}

function formatCommit(commit) {
  if (!commit || commit === 'unknown') {
    return `${colors.yellow}N/A${colors.reset}`;
  }
  return `${colors.cyan}${commit.substring(0, 8)}${colors.reset}`;
}

async function checkSystemStatus() {
  console.log(`${colors.bold}${colors.blue}🔍 Verificando Status do Sistema Kmiza27${colors.reset}`);
  console.log(`${colors.cyan}Timestamp: ${new Date().toLocaleString('pt-BR')}${colors.reset}\n`);
  
  const results = [];
  
  for (const service of services) {
    console.log(`${colors.bold}📡 Verificando ${service.name}...${colors.reset}`);
    
    try {
      const result = await makeRequest(service.url);
      results.push({ service, result });
      
      console.log(`   Status: ${formatStatus(result.success)}`);
      console.log(`   Tempo de Resposta: ${formatResponseTime(result.responseTime)}`);
      
      if (result.success && result.data) {
        console.log(`   Versão: ${colors.cyan}${result.data.version || 'N/A'}${colors.reset}`);
        console.log(`   Commit: ${formatCommit(result.data.commit)}`);
        console.log(`   Ambiente: ${colors.yellow}${result.data.environment || 'N/A'}${colors.reset}`);
        
        if (result.data.timestamp) {
          const buildDate = new Date(result.data.timestamp);
          console.log(`   Build: ${colors.cyan}${buildDate.toLocaleString('pt-BR')}${colors.reset}`);
        }
        
        if (result.data.uptime) {
          const uptimeHours = Math.floor(result.data.uptime / 3600);
          const uptimeMinutes = Math.floor((result.data.uptime % 3600) / 60);
          console.log(`   Uptime: ${colors.green}${uptimeHours}h ${uptimeMinutes}m${colors.reset}`);
        }
      }
      
    } catch (error) {
      results.push({ service, error });
      console.log(`   Status: ${formatStatus(false)}`);
      console.log(`   Erro: ${colors.red}${error.error}${colors.reset}`);
      console.log(`   Tempo: ${formatResponseTime(error.responseTime)}`);
    }
    
    console.log('');
  }
  
  // Resumo geral
  const onlineServices = results.filter(r => r.result && r.result.success).length;
  const totalServices = results.length;
  const averageResponseTime = results
    .filter(r => r.result && r.result.responseTime)
    .reduce((acc, r) => acc + r.result.responseTime, 0) / 
    results.filter(r => r.result && r.result.responseTime).length;
  
  console.log(`${colors.bold}${colors.blue}📊 RESUMO GERAL${colors.reset}`);
  console.log(`${colors.bold}Serviços Online: ${onlineServices === totalServices ? colors.green : colors.red}${onlineServices}/${totalServices}${colors.reset}`);
  console.log(`${colors.bold}Tempo Médio de Resposta: ${formatResponseTime(Math.round(averageResponseTime || 0))}${colors.reset}`);
  
  if (onlineServices === totalServices) {
    console.log(`${colors.bold}${colors.green}🎉 Sistema Operacional!${colors.reset}`);
  } else if (onlineServices === 0) {
    console.log(`${colors.bold}${colors.red}🚨 Sistema Offline!${colors.reset}`);
  } else {
    console.log(`${colors.bold}${colors.yellow}⚠️  Sistema com Problemas Parciais${colors.reset}`);
  }
  
  // Verificar se commits são iguais (deploy sincronizado)
  const commits = results
    .filter(r => r.result && r.result.success && r.result.data && r.result.data.commit)
    .map(r => r.result.data.commit);
  
  if (commits.length > 1) {
    const allSameCommit = commits.every(commit => commit === commits[0]);
    console.log(`${colors.bold}Deploy Sincronizado: ${allSameCommit ? colors.green + '✓' : colors.red + '✗'} ${allSameCommit ? 'Sim' : 'Não'}${colors.reset}`);
    
    if (!allSameCommit) {
      console.log(`${colors.yellow}⚠️  Commits diferentes detectados - deploy pode não ter sido aplicado completamente${colors.reset}`);
    }
  }
  
  console.log(`\n${colors.cyan}💡 Para monitoramento contínuo, use: npm run status:watch${colors.reset}`);
  console.log(`${colors.cyan}🌐 Interface web disponível em: https://kmizafrontend.h4xd66.easypanel.host/status${colors.reset}`);
  
  // Exit code baseado no status
  process.exit(onlineServices === totalServices ? 0 : 1);
}

// Executar verificação
checkSystemStatus().catch(error => {
  console.error(`${colors.red}❌ Erro ao verificar status:${colors.reset}`, error);
  process.exit(1);
}); 