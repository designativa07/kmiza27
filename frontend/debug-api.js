// Script de debug para testar APIs
console.log('🔧 Iniciando debug das APIs...');

async function debugAPI() {
    const apis = [
        { name: 'users/stats', url: 'http://localhost:3000/users/stats' },
        { name: 'matches', url: 'http://localhost:3000/matches' },
        { name: 'teams', url: 'http://localhost:3000/teams' },
        { name: 'competitions', url: 'http://localhost:3000/competitions' }
    ];

    for (const api of apis) {
        try {
            console.log(`🔄 Testando ${api.name}...`);
            
            const startTime = Date.now();
            const response = await fetch(api.url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });
            const endTime = Date.now();
            
            console.log(`📊 ${api.name} - Status: ${response.status} (${endTime - startTime}ms)`);
            
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    console.log(`✅ ${api.name} - ${data.length} itens`);
                } else {
                    console.log(`✅ ${api.name} - Dados:`, data);
                }
            } else {
                console.error(`❌ ${api.name} - Erro HTTP ${response.status}`);
            }
            
        } catch (error) {
            console.error(`❌ ${api.name} - Erro:`, error.message);
        }
    }
}

// Executar debug
debugAPI();

// Exportar para uso global
window.debugAPI = debugAPI; 