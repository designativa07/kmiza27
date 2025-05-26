const fs = require('fs');
const path = require('path');

// List of files to fix
const filesToFix = [
  'frontend/src/components/TeamsManager.tsx',
  'frontend/src/components/StandingsManager.tsx',
  'frontend/src/components/NotificationsManager.tsx',
  'frontend/src/components/NotificationSendControl.tsx',
  'frontend/src/components/MatchesManager.tsx',
  'frontend/src/components/CompetitionTeamsManager.tsx',
  'frontend/src/components/CompetitionsManager.tsx',
  'frontend/src/components/ChatbotSettings.tsx',
  'frontend/src/components/AutomationPanel.tsx'
];

// URL mappings
const urlMappings = {
  'http://localhost:3000/teams': 'API_ENDPOINTS.teams.list()',
  'http://localhost:3000/competitions': 'API_ENDPOINTS.competitions.list()',
  'http://localhost:3000/matches': 'API_ENDPOINTS.matches.list()',
  'http://localhost:3000/users': 'API_ENDPOINTS.users.list()',
  'http://localhost:3000/notifications': 'API_ENDPOINTS.notifications.list()',
  'http://localhost:3000/notifications/stats': 'API_ENDPOINTS.notifications.stats()',
  'http://localhost:3000/whatsapp/status': 'API_ENDPOINTS.whatsapp.status()',
  'http://localhost:3000/bot-config': 'API_ENDPOINTS.botConfig.list()',
  'http://localhost:3000/bot-config/reset-defaults': 'API_ENDPOINTS.botConfig.resetDefaults()',
  'http://localhost:3000/chatbot/status': 'API_ENDPOINTS.chatbot.status()',
  'http://localhost:3000/chatbot/test-message': 'API_ENDPOINTS.chatbot.testMessage()',
  'http://localhost:3000/users/stats': 'API_ENDPOINTS.users.stats()'
};

// Dynamic URL patterns
const dynamicPatterns = [
  {
    pattern: /http:\/\/localhost:3000\/teams\/(\$\{[^}]+\})/g,
    replacement: 'API_ENDPOINTS.teams.byId($1)'
  },
  {
    pattern: /http:\/\/localhost:3000\/teams\/(\d+)/g,
    replacement: 'API_ENDPOINTS.teams.byId($1)'
  },
  {
    pattern: /http:\/\/localhost:3000\/competitions\/(\$\{[^}]+\})/g,
    replacement: 'API_ENDPOINTS.competitions.byId($1)'
  },
  {
    pattern: /http:\/\/localhost:3000\/matches\/(\$\{[^}]+\})/g,
    replacement: 'API_ENDPOINTS.matches.byId($1)'
  },
  {
    pattern: /http:\/\/localhost:3000\/notifications\/(\$\{[^}]+\})/g,
    replacement: 'API_ENDPOINTS.notifications.byId($1)'
  },
  {
    pattern: /http:\/\/localhost:3000\/bot-config\/(\$\{[^}]+\})/g,
    replacement: 'API_ENDPOINTS.botConfig.byId($1)'
  }
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Add import if not present
    if (!content.includes("import { API_ENDPOINTS }")) {
      const importMatch = content.match(/^(import.*from.*['"][^'"]*['"];?\s*)+/m);
      if (importMatch) {
        const lastImportIndex = importMatch.index + importMatch[0].length;
        content = content.slice(0, lastImportIndex) + 
                 "import { API_ENDPOINTS } from '../config/api'\n" + 
                 content.slice(lastImportIndex);
        modified = true;
      }
    }

    // Replace static URLs
    for (const [oldUrl, newUrl] of Object.entries(urlMappings)) {
      const regex = new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (content.includes(oldUrl)) {
        content = content.replace(regex, newUrl);
        modified = true;
        console.log(`Fixed: ${oldUrl} -> ${newUrl} in ${filePath}`);
      }
    }

    // Replace dynamic URLs
    for (const pattern of dynamicPatterns) {
      if (pattern.pattern.test(content)) {
        content = content.replace(pattern.pattern, pattern.replacement);
        modified = true;
        console.log(`Fixed dynamic pattern in ${filePath}`);
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated ${filePath}`);
    } else {
      console.log(`⏭️  No changes needed for ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Process all files
console.log('🔧 Starting API URL fixes...\n');
filesToFix.forEach(fixFile);
console.log('\n✅ All files processed!'); 