const { getSupabaseServiceClient } = require('../config/supabase-connection');

async function testAutoEnrollmentDirect() {
    console.log('🔍 Testando autoEnrollInCompetition diretamente...');
    
    const supabase = getSupabaseServiceClient('vps');
    
    try {
        // 1. Buscar o time mais recente criado pelo usuário
        console.log('1. Buscando time mais recente...');
        const { data: teams, error: teamsError } = await supabase
            .from('game_teams')
            .select('*')
            .eq('team_type', 'user_created')
            .order('created_at', { ascending: false })
            .limit(1);
            
        if (teamsError) {
            console.error('❌ Erro ao buscar times:', teamsError);
            return;
        }
        
        if (!teams || teams.length === 0) {
            console.log('❌ Nenhum time criado pelo usuário encontrado');
            return;
        }
        
        const team = teams[0];
        console.log(`✅ Time encontrado: ${team.name} (ID: ${team.id})`);
        
        // 2. Simular a lógica do autoEnrollInCompetition
        console.log('2. Simulando lógica do autoEnrollInCompetition...');
        
        // Buscar competições disponíveis (priorizando Série D)
        const { data: competitions, error: compError } = await supabase
            .from('game_competitions')
            .select('*')
            .order('tier', { ascending: false }); // Priorizar Série D (tier 4)
            
        if (compError) {
            console.error('❌ Erro ao buscar competições:', compError);
            return;
        }
        
        console.log(`📊 Competições encontradas: ${competitions.length}`);
        competitions.forEach(comp => {
            console.log(`   - ${comp.name} (Tier ${comp.tier}): ${comp.current_teams}/${comp.max_teams}`);
        });
        
        // Encontrar a primeira competição com vaga
        const availableCompetition = competitions.find(comp => comp.current_teams < comp.max_teams);
        
        if (!availableCompetition) {
            console.log('❌ Nenhuma competição com vaga disponível');
            return;
        }
        
        console.log(`✅ Competição selecionada: ${availableCompetition.name} (ID: ${availableCompetition.id})`);
        console.log(`   Vagas disponíveis: ${availableCompetition.max_teams - availableCompetition.current_teams}`);
        
        // 3. Verificar se já está inscrito
        console.log('3. Verificando se já está inscrito...');
        const { data: existingEnrollment, error: enrollError } = await supabase
            .from('game_competition_teams')
            .select('*')
            .eq('competition_id', availableCompetition.id)
            .eq('team_id', team.id);
            
        if (enrollError) {
            console.error('❌ Erro ao verificar inscrição:', enrollError);
            return;
        }
        
        if (existingEnrollment && existingEnrollment.length > 0) {
            console.log('⚠️ Time já está inscrito nesta competição');
            return;
        }
        
        // 4. Inserir na competição
        console.log('4. Inserindo na competição...');
        const { data: enrollment, error: insertError } = await supabase
            .from('game_competition_teams')
            .insert({
                competition_id: availableCompetition.id,
                team_id: team.id
            })
            .select();
            
        if (insertError) {
            console.error('❌ Erro ao inserir na competição:', insertError);
            return;
        }
        
        console.log('✅ Time inscrito na competição com sucesso');
        
        // 5. Atualizar contador da competição
        console.log('5. Atualizando contador da competição...');
        const { error: updateError } = await supabase
            .from('game_competitions')
            .update({ current_teams: availableCompetition.current_teams + 1 })
            .eq('id', availableCompetition.id);
            
        if (updateError) {
            console.error('❌ Erro ao atualizar contador:', updateError);
            return;
        }
        
        console.log('✅ Contador da competição atualizado');
        
        // 6. Criar entrada na classificação
        console.log('6. Criando entrada na classificação...');
        const { error: standingsError } = await supabase
            .from('game_standings')
            .insert({
                competition_id: availableCompetition.id,
                team_id: team.id,
                season_year: new Date().getFullYear(),
                points: 0,
                games_played: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goals_for: 0,
                goals_against: 0,
                position: 0
            });
            
        if (standingsError) {
            console.error('❌ Erro ao criar classificação:', standingsError);
            return;
        }
        
        console.log('✅ Entrada na classificação criada');
        
        // 7. Verificar se há partidas suficientes para criar calendário
        console.log('7. Verificando se há partidas suficientes...');
        const { data: enrolledTeams, error: teamsError2 } = await supabase
            .from('game_competition_teams')
            .select('team_id')
            .eq('competition_id', availableCompetition.id);
            
        if (teamsError2) {
            console.error('❌ Erro ao buscar times inscritos:', teamsError2);
            return;
        }
        
        console.log(`📊 Times inscritos na competição: ${enrolledTeams.length}`);
        
        if (enrolledTeams.length >= 2) {
            console.log('✅ Há times suficientes para criar calendário');
            
            // Verificar se já existem rodadas
            const { data: existingRounds, error: roundsError } = await supabase
                .from('game_rounds')
                .select('*')
                .eq('competition_id', availableCompetition.id);
                
            if (roundsError) {
                console.error('❌ Erro ao verificar rodadas:', roundsError);
                return;
            }
            
            if (!existingRounds || existingRounds.length === 0) {
                console.log('📅 Criando calendário de partidas...');
                
                // Calcular total de rodadas (ida e volta)
                const totalRounds = (enrolledTeams.length - 1) * 2;
                console.log(`   Total de rodadas: ${totalRounds}`);
                
                // Criar rodadas
                const rounds = [];
                for (let i = 1; i <= totalRounds; i++) {
                    rounds.push({
                        competition_id: availableCompetition.id,
                        round_number: i,
                        status: 'scheduled'
                    });
                }
                
                const { error: insertRoundsError } = await supabase
                    .from('game_rounds')
                    .insert(rounds);
                    
                if (insertRoundsError) {
                    console.error('❌ Erro ao criar rodadas:', insertRoundsError);
                    return;
                }
                
                console.log('✅ Rodadas criadas');
                
                // Gerar partidas usando algoritmo round-robin
                console.log('⚽ Gerando partidas...');
                const matches = generateRoundRobinMatches(enrolledTeams, availableCompetition.id, totalRounds);
                
                // Inserir partidas em lotes
                const batchSize = 50;
                for (let i = 0; i < matches.length; i += batchSize) {
                    const batch = matches.slice(i, i + batchSize);
                    const { error: insertMatchesError } = await supabase
                        .from('game_matches')
                        .insert(batch);
                        
                    if (insertMatchesError) {
                        console.error('❌ Erro ao inserir partidas:', insertMatchesError);
                        return;
                    }
                }
                
                console.log(`✅ ${matches.length} partidas criadas`);
            } else {
                console.log('📅 Calendário já existe');
            }
        } else {
            console.log('⚠️ Não há times suficientes para criar calendário');
        }
        
        console.log('\n🎉 AUTO ENROLLMENT TESTADO COM SUCESSO!');
        
    } catch (error) {
        console.error('❌ Erro geral:', error);
    }
}

function generateRoundRobinMatches(teams, competitionId, totalRounds) {
    const matches = [];
    const teamIds = teams.map(t => t.team_id);
    
    // Se número ímpar, adicionar "BYE"
    if (teamIds.length % 2 !== 0) {
        teamIds.push(null);
    }
    
    const n = teamIds.length;
    const rounds = n - 1;
    
    for (let round = 0; round < rounds; round++) {
        for (let i = 0; i < n / 2; i++) {
            const team1 = teamIds[i];
            const team2 = teamIds[n - 1 - i];
            
            if (team1 !== null && team2 !== null) {
                // Ida (primeira metade da temporada)
                const homeTeam = round % 2 === 0 ? team1 : team2;
                const awayTeam = round % 2 === 0 ? team2 : team1;
                
                const matchDate = new Date();
                matchDate.setDate(matchDate.getDate() + (round * 7)); // Uma semana entre rodadas
                
                matches.push({
                    competition_id: competitionId,
                    home_team_id: homeTeam,
                    away_team_id: awayTeam,
                    round: round + 1,
                    status: 'scheduled',
                    scheduled_date: matchDate.toISOString(),
                    home_score: null,
                    away_score: null,
                    winner_id: null
                });
                
                // Volta (segunda metade da temporada)
                const returnMatchDate = new Date();
                returnMatchDate.setDate(returnMatchDate.getDate() + ((round + rounds) * 7));
                
                matches.push({
                    competition_id: competitionId,
                    home_team_id: awayTeam,
                    away_team_id: homeTeam,
                    round: round + rounds + 1,
                    status: 'scheduled',
                    scheduled_date: returnMatchDate.toISOString(),
                    home_score: null,
                    away_score: null,
                    winner_id: null
                });
            }
        }
        
        // Rotacionar times (exceto o primeiro)
        const temp = teamIds[1];
        for (let i = 1; i < n - 1; i++) {
            teamIds[i] = teamIds[i + 1];
        }
        teamIds[n - 1] = temp;
    }
    
    return matches;
}

testAutoEnrollmentDirect(); 