import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Competition, CompetitionType } from '../../entities/competition.entity';
import { Team } from '../../entities/team.entity';
import { Match, MatchStatus } from '../../entities/match.entity';
import { CompetitionTeam } from '../../entities/competition-team.entity';
import { Goal } from '../../entities/goal.entity';
import { Player } from '../../entities/player.entity';
import { Stadium } from '../../entities/stadium.entity';
import { PlayerTeamHistory } from '../../entities/player-team-history.entity';

@Injectable()
export class AmateurService {
  constructor(
    @InjectRepository(Competition)
    private competitionRepository: Repository<Competition>,
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(CompetitionTeam)
    private competitionTeamRepository: Repository<CompetitionTeam>,
    @InjectRepository(Goal)
    private goalRepository: Repository<Goal>,
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
    @InjectRepository(Stadium)
    private stadiumRepository: Repository<Stadium>,
    @InjectRepository(PlayerTeamHistory)
    private playerTeamHistoryRepository: Repository<PlayerTeamHistory>,
  ) {}

  async getAmateurCompetitions() {
    return this.competitionRepository.find({
      where: { category: 'amateur', is_active: true },
      order: { name: 'ASC' }
    });
  }

  async getAmateurCompetition(id: number) {
    return this.competitionRepository.findOne({
      where: { id, category: 'amateur' }
    });
  }

  async createAmateurCompetition(competitionData: any) {
    const competition = this.competitionRepository.create({
      ...competitionData,
      category: 'amateur',
      type: competitionData.type || CompetitionType.PONTOS_CORRIDOS,
      is_active: true,
      logo_url: competitionData.logo_url || null,
      season: competitionData.season || '2024',
      rules: competitionData.rules || {},
      regulamento: competitionData.regulamento || null
    });
    return this.competitionRepository.save(competition);
  }

  async updateAmateurCompetition(id: number, competitionData: any) {
    // Verificar se a competição existe
    const existingCompetition = await this.getAmateurCompetition(id);
    if (!existingCompetition) {
      throw new Error('Competição amadora não encontrada');
    }
    
    await this.competitionRepository.update(id, {
      ...competitionData,
      category: 'amateur'
    });
    
    return this.getAmateurCompetition(id);
  }

  async deleteAmateurCompetition(id: number) {
    const competition = await this.getAmateurCompetition(id);
    if (!competition) {
      throw new Error('Competição amadora não encontrada');
    }
    await this.competitionRepository.delete(id);
    return { success: true, message: 'Competição amadora excluída com sucesso' };
  }

                async getAmateurTeams() {
                return this.teamRepository.find({
                  where: { category: 'amateur' },
                  order: { name: 'ASC' }
                });
              }

              async getAmateurTeam(id: number) {
                return this.teamRepository.findOne({
                  where: { id, category: 'amateur' }
                });
              }

              async createAmateurTeam(teamData: any) {
                // Gerar slug baseado no nome do time
                const generateSlug = (name: string) => {
                  return name
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .trim();
                };

                const team = this.teamRepository.create({
                  ...teamData,
                  category: 'amateur',
                  slug: teamData.slug || generateSlug(teamData.name),
                  colors: teamData.colors || {},
                  social_media: teamData.social_media || {},
                  logo_url: teamData.logo_url || null,
                  full_name: teamData.full_name || teamData.name,
                  short_name: teamData.short_name || teamData.name.substring(0, 3).toUpperCase(),
                  short_code: teamData.short_code || teamData.name.substring(0, 3).toUpperCase(),
                  history: teamData.history || null,
                  information: teamData.information || null,
                  stadium_id: teamData.stadium_id || null,
                  founded_year: teamData.founded_year || null
                });
                return this.teamRepository.save(team);
              }

              async updateAmateurTeam(id: number, teamData: any) {
                // Tratar campos vazios antes do update
                const cleanData = {
                  ...teamData,
                  category: 'amateur',
                  founded_year: teamData.founded_year || null,
                  stadium_id: teamData.stadium_id || null,
                  colors: teamData.colors || {},
                  social_media: teamData.social_media || {},
                  information: teamData.information || null,
                  history: teamData.history || null,
                  logo_url: teamData.logo_url || null
                };

                await this.teamRepository.update(id, cleanData);
                return this.getAmateurTeam(id);
              }

              async deleteAmateurTeam(id: number) {
                const team = await this.getAmateurTeam(id);
                if (!team) {
                  throw new Error('Time amador não encontrado');
                }
                await this.teamRepository.delete(id);
                return { success: true, message: 'Time amador excluído com sucesso' };
              }

  async getAmateurMatches(competitionId?: number) {
    const whereCondition: any = { category: 'amateur' };
    if (competitionId) {
      whereCondition.competition = { id: competitionId };
    }

    return this.matchRepository.find({
      where: whereCondition,
      relations: ['home_team', 'away_team', 'competition'],
      order: { match_date: 'DESC' }
    });
  }

  async getAmateurStandings(competitionId: number) {
    // Primeiro, atualizar as estatísticas baseadas nos jogos
    await this.updateCompetitionStandings(competitionId);
    
    return this.competitionTeamRepository.find({
      where: { 
        competition: { id: competitionId }
      },
      relations: ['team'],
      order: { points: 'DESC', goal_difference: 'DESC', goals_for: 'DESC' }
    });
  }

  async updateCompetitionStandings(competitionId: number) {
    try {
      console.log(`Atualizando estatísticas da competição ${competitionId}...`);
      
      // Buscar todos os jogos da competição que já foram jogados
      const matches = await this.matchRepository.find({
        where: { 
          competition: { id: competitionId },
          category: 'amateur',
          status: MatchStatus.FINISHED
        },
        relations: ['home_team', 'away_team', 'competition']
      });
      
      console.log(`Encontrados ${matches.length} jogos finalizados para a competição ${competitionId}`);
      
      matches.forEach(match => {
        console.log(`- ${match.home_team.name} ${match.home_score} x ${match.away_score} ${match.away_team.name}`);
      });

      // Buscar todos os times da competição
      const competitionTeams = await this.competitionTeamRepository.find({
        where: { competition: { id: competitionId } },
        relations: ['team']
      });
      
      console.log(`Encontrados ${competitionTeams.length} times na competição ${competitionId}`);
      
      competitionTeams.forEach(ct => {
        console.log(`- ${ct.team.name} (ID: ${ct.team.id})`);
      });

      // Criar um mapa para facilitar o acesso aos times
      const teamStatsMap = new Map();
      competitionTeams.forEach(ct => {
        teamStatsMap.set(ct.team.id, {
          id: ct.id,
          points: 0,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goals_for: 0,
          goals_against: 0
        });
      });

      // Processar cada jogo
      for (const match of matches) {
        if (!match.home_score || !match.away_score) continue;

        const homeTeamId = match.home_team.id;
        const awayTeamId = match.away_team.id;
        const homeScore = match.home_score;
        const awayScore = match.away_score;

        // Atualizar estatísticas do time da casa
        if (teamStatsMap.has(homeTeamId)) {
          const homeStats = teamStatsMap.get(homeTeamId);
          homeStats.played += 1;
          homeStats.goals_for += homeScore;
          homeStats.goals_against += awayScore;

          if (homeScore > awayScore) {
            homeStats.won += 1;
            homeStats.points += 3;
          } else if (homeScore === awayScore) {
            homeStats.drawn += 1;
            homeStats.points += 1;
          } else {
            homeStats.lost += 1;
          }
        }

        // Atualizar estatísticas do time visitante
        if (teamStatsMap.has(awayTeamId)) {
          const awayStats = teamStatsMap.get(awayTeamId);
          awayStats.played += 1;
          awayStats.goals_for += awayScore;
          awayStats.goals_against += homeScore;

          if (awayScore > homeScore) {
            awayStats.won += 1;
            awayStats.points += 3;
          } else if (awayScore === homeScore) {
            awayStats.drawn += 1;
            awayStats.points += 1;
          } else {
            awayStats.lost += 1;
          }
        }
      }

      // Atualizar as estatísticas no banco de dados
      for (const [teamId, stats] of teamStatsMap) {
        await this.competitionTeamRepository.update(
          { id: stats.id },
          {
            points: stats.points,
            played: stats.played,
            won: stats.won,
            drawn: stats.drawn,
            lost: stats.lost,
            goals_for: stats.goals_for,
            goals_against: stats.goals_against
            // goal_difference é calculado automaticamente pelo banco
          }
        );
      }

      console.log(`Estatísticas da competição ${competitionId} atualizadas`);
    } catch (error) {
      console.error('Erro ao atualizar estatísticas da competição:', error);
      throw error;
    }
  }

  async getAmateurTopScorers(competitionId: number) {
    // Buscar todos os jogos da competição amadora
    const matches = await this.matchRepository.find({
      where: { 
        competition: { id: competitionId, category: 'amateur' },
        category: 'amateur'
      },
      select: ['id']
    });

    if (matches.length === 0) {
      return [];
    }

    const matchIds = matches.map(match => match.id);

    // Buscar artilharia usando query raw para melhor performance
    const topScorers = await this.goalRepository
      .createQueryBuilder('goal')
      .select([
        'player.id as player_id',
        'player.name as player_name',
        'player.image_url as player_image',
        'team.id as team_id',
        'team.name as team_name',
        'team.logo_url as team_logo',
        'COUNT(*) as goals_count'
      ])
      .leftJoin('goal.player', 'player')
      .leftJoin('goal.team', 'team')
      .where('goal.match_id IN (:...matchIds)', { matchIds })
      .andWhere('goal.type != :ownGoal', { ownGoal: 'own_goal' })
      .groupBy('player.id, player.name, player.image_url, team.id, team.name, team.logo_url')
      .orderBy('goals_count', 'DESC')
      .addOrderBy('player.name', 'ASC')
      .limit(20)
      .getRawMany();

    return topScorers.map(scorer => ({
      player_id: scorer.player_id,
      player_name: scorer.player_name,
      player_image: scorer.player_image,
      team_id: scorer.team_id,
      team_name: scorer.team_name,
      team_logo: scorer.team_logo,
      goals: parseInt(scorer.goals_count)
    }));
  }

                async setupTeamsCategory(): Promise<{ success: boolean; message: string }> {
                try {
                  // Verificar se a coluna já existe
                  const result = await this.teamRepository.query(`
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_name = 'teams' AND column_name = 'category'
                  `);

                  if (result.length === 0) {
                    // Adicionar a coluna
                    await this.teamRepository.query(`
                      ALTER TABLE teams
                      ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'professional'
                    `);

                    // Adicionar comentário
                    await this.teamRepository.query(`
                      COMMENT ON COLUMN teams.category IS 'Categoria do time: professional ou amateur'
                    `);

                    // Atualizar times existentes
                    await this.teamRepository.query(`
                      UPDATE teams SET category = 'professional' WHERE category IS NULL OR category = ''
                    `);

                    return { success: true, message: 'Campo category adicionado na tabela teams com sucesso' };
                  } else {
                    return { success: true, message: 'Campo category já existe na tabela teams' };
                  }
                } catch (error) {
                  console.error('Erro ao configurar campo category na tabela teams:', error);
                  return { success: false, message: `Erro: ${error.message}` };
                }
              }

              async setupUsersRole(): Promise<{ success: boolean; message: string }> {
                try {
                  // Verificar se a coluna já existe
                  const result = await this.competitionRepository.query(`
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_name = 'users' AND column_name = 'role'
                  `);

                  if (result.length === 0) {
                    // Adicionar a coluna
                    await this.competitionRepository.query(`
                      ALTER TABLE users
                      ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user'
                    `);

                    // Adicionar comentário
                    await this.competitionRepository.query(`
                      COMMENT ON COLUMN users.role IS 'Role do usuário: admin, user, amateur'
                    `);

                    // Atualizar usuários existentes
                    await this.competitionRepository.query(`
                      UPDATE users SET role = 'admin' WHERE is_admin = true
                    `);
                    await this.competitionRepository.query(`
                      UPDATE users SET role = 'user' WHERE is_admin = false AND role IS NULL
                    `);

                    return { success: true, message: 'Campo role adicionado na tabela users com sucesso' };
                  } else {
                    return { success: true, message: 'Campo role já existe na tabela users' };
                  }
                } catch (error) {
                  console.error('Erro ao configurar campo role na tabela users:', error);
                  return { success: false, message: `Erro: ${error.message}` };
                }
              }

              async setupPlayersCategory(): Promise<{ success: boolean; message: string }> {
                try {
                  // Verificar se a coluna já existe
                  const result = await this.playerRepository.query(`
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_name = 'players' AND column_name = 'category'
                  `);

                  if (result.length === 0) {
                    // Adicionar a coluna
                    await this.playerRepository.query(`
                      ALTER TABLE players
                      ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'professional'
                    `);

                    // Adicionar comentário
                    await this.playerRepository.query(`
                      COMMENT ON COLUMN players.category IS 'Categoria do jogador: professional ou amateur'
                    `);

                    // Atualizar jogadores existentes
                    await this.playerRepository.query(`
                      UPDATE players SET category = 'professional' WHERE category IS NULL OR category = ''
                    `);

                    return { success: true, message: 'Campo category adicionado na tabela players com sucesso' };
                  } else {
                    return { success: true, message: 'Campo category já existe na tabela players' };
                  }
                } catch (error) {
                  console.error('Erro ao configurar campo category na tabela players:', error);
                  return { success: false, message: `Erro: ${error.message}` };
                }
              }

              async getAmateurPlayers() {
                return this.playerRepository.find({
                  where: { category: 'amateur' },
                  order: { name: 'ASC' }
                });
              }

              async getAmateurPlayer(id: number) {
                console.log('=== GET AMATEUR PLAYER INICIADO ===');
                console.log('ID:', id);
                
                const player = await this.playerRepository.findOne({
                  where: { id, category: 'amateur' }
                });
                
                console.log('Jogador encontrado:', player);
                console.log('=== GET AMATEUR PLAYER FINALIZADO ===');
                return player;
              }

              async createAmateurPlayer(playerData: any) {
                console.log('=== CREATE AMATEUR PLAYER INICIADO ===');
                console.log('Dados recebidos:', playerData);
                
                // Preparar dados para criação
                const playerDataToSave: any = {
                  category: 'amateur'
                };
                
                // Filtrar apenas os campos que existem na entidade Player
                const allowedFields = [
                  'name', 'position', 'date_of_birth', 'nationality', 
                  'state', 'image_url', 'youtube_url', 'instagram_url'
                ];
                
                // Adicionar apenas campos válidos
                for (const field of allowedFields) {
                  if (playerData[field] !== undefined) {
                    // Tratar campos especiais
                    if (field === 'date_of_birth') {
                      // Se a data estiver vazia, definir como null
                      if (playerData[field] === '' || playerData[field] === null) {
                        playerDataToSave[field] = null;
                      } else {
                        // Corrigir problema de fuso horário - adicionar 'T00:00:00' para garantir que seja interpretado como meia-noite local
                        const dateString = playerData[field] + 'T00:00:00';
                        const parsedDate = new Date(dateString);
                        console.log('Data original:', playerData[field]);
                        console.log('Data com T00:00:00:', dateString);
                        console.log('Data parseada:', parsedDate);
                        console.log('Data ISO:', parsedDate.toISOString());
                        playerDataToSave[field] = parsedDate;
                      }
                    } else {
                      playerDataToSave[field] = playerData[field];
                    }
                  }
                }
                
                console.log('Dados para salvar:', playerDataToSave);
                
                const player = this.playerRepository.create(playerDataToSave);
                const savedPlayer = await this.playerRepository.save(player);
                
                console.log('Jogador criado:', savedPlayer);
                console.log('=== CREATE AMATEUR PLAYER FINALIZADO ===');
                return savedPlayer;
              }

              async updateAmateurPlayer(id: number, playerData: any) {
                console.log('=== UPDATE AMATEUR PLAYER INICIADO ===');
                console.log('ID:', id);
                console.log('Dados recebidos:', playerData);
                
                // Filtrar apenas os campos que existem na entidade Player
                const allowedFields = [
                  'name', 'position', 'date_of_birth', 'nationality', 
                  'state', 'image_url', 'youtube_url', 'instagram_url', 'category'
                ];
                
                const updateData: any = {
                  category: 'amateur'
                };
                
                // Adicionar apenas campos válidos
                for (const field of allowedFields) {
                  if (playerData[field] !== undefined) {
                    // Tratar campos especiais
                    if (field === 'date_of_birth') {
                      // Se a data estiver vazia, definir como null
                      if (playerData[field] === '' || playerData[field] === null) {
                        updateData[field] = null;
                      } else {
                        // Corrigir problema de fuso horário - adicionar 'T00:00:00' para garantir que seja interpretado como meia-noite local
                        const dateString = playerData[field] + 'T00:00:00';
                        const parsedDate = new Date(dateString);
                        console.log('Data original (update):', playerData[field]);
                        console.log('Data com T00:00:00 (update):', dateString);
                        console.log('Data parseada (update):', parsedDate);
                        console.log('Data ISO (update):', parsedDate.toISOString());
                        updateData[field] = parsedDate;
                      }
                    } else {
                      updateData[field] = playerData[field];
                    }
                  }
                }
                
                console.log('Dados para atualização:', updateData);
                
                await this.playerRepository.update(id, updateData);
                const updatedPlayer = await this.getAmateurPlayer(id);
                console.log('Jogador atualizado:', updatedPlayer);
                console.log('=== UPDATE AMATEUR PLAYER FINALIZADO ===');
                return updatedPlayer;
              }

              async deleteAmateurPlayer(id: number) {
                const player = await this.getAmateurPlayer(id);
                if (!player) {
                  throw new Error('Jogador amador não encontrado');
                }
                await this.playerRepository.delete(id);
                return { success: true, message: 'Jogador amador excluído com sucesso' };
              }

  private groupGoalsByPlayer(goals: any[]): any[] {
    const playerStats = new Map<number, any>();
    
    for (const goal of goals) {
      const playerId = goal.player_id;
      
      if (!playerStats.has(playerId)) {
        playerStats.set(playerId, {
          player_id: playerId,
          goals: 0,
          yellow_cards: 0,
          red_cards: 0
        });
      }
      
      const stats = playerStats.get(playerId);
      stats.goals += 1;
    }
    
    return Array.from(playerStats.values());
  }

  async getAmateurMatch(id: number) {
                console.log('Getting amateur match:', id);
                const match = await this.matchRepository.findOne({
                  where: { id, category: 'amateur' },
                  relations: ['home_team', 'away_team', 'competition', 'stadium']
                });
                console.log('Found match:', match);
                
                if (!match) {
                  return null;
                }
                
                // Buscar gols do jogo
                const goals = await this.goalRepository.find({
                  where: { match_id: id },
                  relations: ['player']
                });
                
                console.log('Goals found:', goals);
                
                // Agrupar gols por jogador e time
                const homeTeamGoals = goals.filter(goal => goal.team_id === match.home_team.id);
                const awayTeamGoals = goals.filter(goal => goal.team_id === match.away_team.id);
                
                // Criar estatísticas dos jogadores
                const homeTeamPlayerStats = this.groupGoalsByPlayer(homeTeamGoals);
                const awayTeamPlayerStats = this.groupGoalsByPlayer(awayTeamGoals);
                
                console.log('Home team player stats:', homeTeamPlayerStats);
                console.log('Away team player stats:', awayTeamPlayerStats);
                
                // Retornar jogo com estatísticas dos jogadores
                return {
                  ...match,
                  home_team_player_stats: homeTeamPlayerStats,
                  away_team_player_stats: awayTeamPlayerStats
                };
              }

              async createAmateurMatch(matchData: any) {
                try {
                  console.log('=== CREATE AMATEUR MATCH INICIADO ===');
                  console.log('Dados recebidos:', matchData);
                  
                  const matchDataToSave: any = {
                    match_date: matchData.match_date ? new Date(matchData.match_date) : null,
                    status: matchData.status || 'scheduled',
                    category: 'amateur'
                  };

                  // Processar competição
                  if (matchData.competition_id && matchData.competition_id !== '') {
                    const competitionId = parseInt(matchData.competition_id);
                    if (!isNaN(competitionId)) {
                      matchDataToSave.competition = { id: competitionId };
                    }
                  }

                  // Processar times
                  if (matchData.home_team_id && matchData.home_team_id !== '') {
                    const homeTeamId = parseInt(matchData.home_team_id);
                    if (!isNaN(homeTeamId)) {
                      matchDataToSave.home_team = { id: homeTeamId };
                    }
                  }

                  if (matchData.away_team_id && matchData.away_team_id !== '') {
                    const awayTeamId = parseInt(matchData.away_team_id);
                    if (!isNaN(awayTeamId)) {
                      matchDataToSave.away_team = { id: awayTeamId };
                    }
                  }

                  // Processar estádio
                  if (matchData.stadium_id && matchData.stadium_id !== '' && matchData.stadium_id !== 'null') {
                    const stadiumId = parseInt(matchData.stadium_id);
                    if (!isNaN(stadiumId) && stadiumId > 0) {
                      matchDataToSave.stadium = { id: stadiumId };
                    }
                  }
                  // Se não houver estádio válido, deixar como null

                  // Processar scores apenas se foram fornecidos e são válidos
                  if (matchData.home_score !== undefined && matchData.home_score !== '' && matchData.home_score !== null) {
                    const homeScore = parseInt(matchData.home_score);
                    if (!isNaN(homeScore) && homeScore >= 0) {
                      matchDataToSave.home_score = homeScore;
                    }
                  }

                  if (matchData.away_score !== undefined && matchData.away_score !== '' && matchData.away_score !== null) {
                    const awayScore = parseInt(matchData.away_score);
                    if (!isNaN(awayScore) && awayScore >= 0) {
                      matchDataToSave.away_score = awayScore;
                    }
                  }

                  console.log('Dados para salvar:', matchDataToSave);

                  const match = this.matchRepository.create(matchDataToSave);
                  const savedMatch = await this.matchRepository.save(match) as any;
                  const matchId = (savedMatch as any).id;
                  
                  console.log('Jogo criado com ID:', matchId);
                  const result = await this.getAmateurMatch(matchId);
                  console.log('Resultado final:', result);
                  console.log('=== CREATE AMATEUR MATCH FINALIZADO ===');
                  return result;
                } catch (error) {
                  console.error('Erro no createAmateurMatch:', error);
                  throw error;
                }
              }

              async updateAmateurMatch(id: number, matchData: any) {
                console.log('=== UPDATE AMATEUR MATCH INICIADO ===');
                console.log('ID:', id);
                console.log('Dados recebidos:', matchData);
                
                // Buscar o jogo existente
                const existingMatch = await this.matchRepository.findOne({
                  where: { id, category: 'amateur' },
                  relations: ['competition', 'home_team', 'away_team', 'stadium']
                });

                if (!existingMatch) {
                  throw new Error('Jogo amador não encontrado');
                }

                console.log('Jogo existente encontrado:', existingMatch);

                // Preparar dados para atualização
                const updateData: any = {
                  category: 'amateur',
                  status: matchData.status || 'scheduled'
                };

                // Processar scores apenas se foram fornecidos
                if (matchData.home_score !== undefined && matchData.home_score !== '') {
                  const homeScore = parseInt(matchData.home_score);
                  updateData.home_score = !isNaN(homeScore) ? homeScore : null;
                }

                if (matchData.away_score !== undefined && matchData.away_score !== '') {
                  const awayScore = parseInt(matchData.away_score);
                  updateData.away_score = !isNaN(awayScore) ? awayScore : null;
                }

                // Processar data apenas se foi fornecida
                if (matchData.match_date) {
                  updateData.match_date = new Date(matchData.match_date);
                }

                // Processar competição se fornecida
                if (matchData.competition_id !== undefined && matchData.competition_id !== '') {
                  const competitionId = parseInt(matchData.competition_id);
                  if (!isNaN(competitionId)) {
                    updateData.competition = { id: competitionId };
                  }
                }

                // Processar times se fornecidos
                if (matchData.home_team_id !== undefined && matchData.home_team_id !== '') {
                  const homeTeamId = parseInt(matchData.home_team_id);
                  if (!isNaN(homeTeamId)) {
                    updateData.home_team = { id: homeTeamId };
                  }
                }

                if (matchData.away_team_id !== undefined && matchData.away_team_id !== '') {
                  const awayTeamId = parseInt(matchData.away_team_id);
                  if (!isNaN(awayTeamId)) {
                    updateData.away_team = { id: awayTeamId };
                  }
                }

                // Processar estádio se fornecido
                if (matchData.stadium_id !== undefined && matchData.stadium_id !== '' && matchData.stadium_id !== 'null') {
                  const stadiumId = parseInt(matchData.stadium_id);
                  if (!isNaN(stadiumId) && stadiumId > 0) {
                    updateData.stadium = { id: stadiumId };
                  } else {
                    updateData.stadium = null;
                  }
                } else {
                  updateData.stadium = null;
                }

                console.log('Dados para atualização:', updateData);
                
                // Atualizar o jogo usando save para lidar com relacionamentos
                const matchToUpdate = await this.matchRepository.findOne({
                  where: { id, category: 'amateur' }
                });

                if (!matchToUpdate) {
                  throw new Error('Jogo amador não encontrado');
                }

                // Atualizar os campos básicos
                Object.assign(matchToUpdate, updateData);

                // Salvar o jogo atualizado
                const savedMatch = await this.matchRepository.save(matchToUpdate);

                // Processar estatísticas dos jogadores (gols)
                if (matchData.home_team_player_stats || matchData.away_team_player_stats) {
                  console.log('Processando estatísticas dos jogadores...');
                  
                  // Limpar gols existentes para este jogo
                  await this.goalRepository.delete({ match_id: id });
                  
                  // Buscar o jogo com relacionamentos para acessar os IDs dos times
                  const matchWithRelations = await this.matchRepository.findOne({
                    where: { id },
                    relations: ['home_team', 'away_team']
                  });
                  
                  if (!matchWithRelations) {
                    throw new Error('Jogo não encontrado');
                  }
                  
                  // Processar gols do time da casa
                  if (matchData.home_team_player_stats && Array.isArray(matchData.home_team_player_stats)) {
                    for (const stat of matchData.home_team_player_stats) {
                      if (stat.player_id && stat.player_id > 0 && stat.goals && stat.goals > 0) {
                        // Buscar o jogador para obter o nome
                        const player = await this.playerRepository.findOne({
                          where: { id: stat.player_id }
                        });
                        
                        for (let i = 0; i < stat.goals; i++) {
                          await this.goalRepository.save({
                            match_id: id,
                            player_id: stat.player_id,
                            player_name: player ? player.name : `Jogador ${stat.player_id}`,
                            team_id: matchWithRelations.home_team.id,
                            type: 'goal',
                            minute: undefined
                          });
                        }
                      }
                    }
                  }
                  
                  // Processar gols do time visitante
                  if (matchData.away_team_player_stats && Array.isArray(matchData.away_team_player_stats)) {
                    for (const stat of matchData.away_team_player_stats) {
                      if (stat.player_id && stat.player_id > 0 && stat.goals && stat.goals > 0) {
                        // Buscar o jogador para obter o nome
                        const player = await this.playerRepository.findOne({
                          where: { id: stat.player_id }
                        });
                        
                        for (let i = 0; i < stat.goals; i++) {
                          await this.goalRepository.save({
                            match_id: id,
                            player_id: stat.player_id,
                            player_name: player ? player.name : `Jogador ${stat.player_id}`,
                            team_id: matchWithRelations.away_team.id,
                            type: 'goal',
                            minute: undefined
                          });
                        }
                      }
                    }
                  }
                  
                  console.log('Estatísticas dos jogadores processadas com sucesso');
                }

                                 // Buscar o jogo atualizado com relacionamentos
                 const updatedMatch = await this.getAmateurMatch(id);
                 
                 // Se o jogo foi finalizado, atualizar as estatísticas da competição
                 if (updatedMatch && updatedMatch.status === MatchStatus.FINISHED && updatedMatch.competition) {
                   await this.updateCompetitionStandings(updatedMatch.competition.id);
                 }
                 
                 console.log('Jogo atualizado:', updatedMatch);
                 console.log('=== UPDATE AMATEUR MATCH FINALIZADO ===');
                 return updatedMatch;
              }

              async deleteAmateurMatch(id: number) {
                const match = await this.getAmateurMatch(id);
                if (!match) {
                  throw new Error('Jogo amador não encontrado');
                }
                await this.matchRepository.delete(id);
                return { success: true, message: 'Jogo amador excluído com sucesso' };
              }

              async getAmateurStadiums() {
                return this.stadiumRepository.find({
                  where: { category: 'amateur' },
                  order: { name: 'ASC' }
                });
              }

              async getAmateurStadium(id: number) {
                return this.stadiumRepository.findOne({
                  where: { id, category: 'amateur' }
                });
              }

              async createAmateurStadium(stadiumData: any) {
                const stadium = this.stadiumRepository.create({
                  ...stadiumData,
                  category: 'amateur'
                });
                return this.stadiumRepository.save(stadium);
              }

              async updateAmateurStadium(id: number, stadiumData: any) {
                console.log('=== UPDATE AMATEUR STADIUM INICIADO ===');
                console.log('ID:', id);
                console.log('Dados recebidos:', stadiumData);
                
                // Filtrar apenas os campos que existem na entidade
                const allowedFields = [
                  'name', 'city', 'state', 'country', 'capacity', 
                  'latitude', 'longitude', 'opened_year', 'history', 
                  'image_url', 'url', 'category'
                ];
                
                const updateData: any = {
                  category: 'amateur'
                };
                
                // Adicionar apenas campos válidos
                for (const field of allowedFields) {
                  if (stadiumData[field] !== undefined) {
                    updateData[field] = stadiumData[field];
                  }
                }
                
                console.log('Dados para atualização:', updateData);
                
                await this.stadiumRepository.update(id, updateData);
                const updatedStadium = await this.getAmateurStadium(id);
                console.log('Estádio atualizado:', updatedStadium);
                console.log('=== UPDATE AMATEUR STADIUM FINALIZADO ===');
                return updatedStadium;
              }

              async deleteAmateurStadium(id: number) {
                const stadium = await this.getAmateurStadium(id);
                if (!stadium) {
                  throw new Error('Estádio amador não encontrado');
                }
                await this.stadiumRepository.delete(id);
                return { success: true, message: 'Estádio amador excluído com sucesso' };
              }

              async getStatisticsComparison() {
                const categories = ['professional', 'amateur'];
                const stats: any[] = [];

                for (const category of categories) {
                  // Contar jogadores
                  const totalPlayers = await this.playerRepository.count({
                    where: { category }
                  });

                  // Contar jogos
                  const totalMatches = await this.matchRepository.count({
                    where: { category }
                  });

                  // Contar gols
                  const totalGoals = await this.goalRepository
                    .createQueryBuilder('goal')
                    .innerJoin('goal.match', 'match')
                    .where('match.category = :category', { category })
                    .getCount();

                  // Calcular média de gols por jogo
                  const avgGoalsPerMatch = totalMatches > 0 ? totalGoals / totalMatches : 0;

                  // Buscar artilheiro
                  const topScorer = await this.goalRepository
                    .createQueryBuilder('goal')
                    .select([
                      'player.name as name',
                      'COUNT(goal.id) as goals'
                    ])
                    .innerJoin('goal.player', 'player')
                    .innerJoin('goal.match', 'match')
                    .where('match.category = :category', { category })
                    .andWhere('player.category = :category', { category })
                    .groupBy('player.id, player.name')
                    .orderBy('goals', 'DESC')
                    .limit(1)
                    .getRawOne();

                  stats.push({
                    category,
                    total_players: totalPlayers,
                    total_matches: totalMatches,
                    total_goals: totalGoals,
                    avg_goals_per_match: avgGoalsPerMatch,
                    top_scorer: topScorer ? {
                      name: topScorer.name,
                      goals: parseInt(topScorer.goals)
                    } : null
                  });
                }

                return stats;
              }

  async getAmateurTeamPlayers(teamId: number) {
    console.log('=== GET AMATEUR TEAM PLAYERS INICIADO ===');
    console.log('Team ID:', teamId);
    
    try {
      // Buscar jogadores associados ao time usando PlayerTeamHistory
      const teamPlayers = await this.playerTeamHistoryRepository
        .createQueryBuilder('pth')
        .leftJoinAndSelect('pth.player', 'player')
        .leftJoinAndSelect('pth.team', 'team')
        .where('pth.team_id = :teamId', { teamId })
        .andWhere('player.category = :category', { category: 'amateur' })
        .andWhere('(pth.end_date IS NULL OR pth.end_date > NOW())')
        .select([
          'player.id',
          'player.name',
          'player.position',
          'player.image_url',
          'player.nationality',
          'player.state',
          'pth.jersey_number',
          'pth.role',
          'pth.start_date',
          'pth.end_date'
        ])
        .getMany();

      console.log('Jogadores encontrados:', teamPlayers.length);
      console.log('=== GET AMATEUR TEAM PLAYERS FINALIZADO ===');
      return teamPlayers;
    } catch (error) {
      console.error('Erro ao buscar jogadores do time:', error);
      throw error;
    }
  }

  async saveAmateurTeamPlayers(teamId: number, teamPlayersDto: any) {
    console.log('=== SAVE AMATEUR TEAM PLAYERS INICIADO ===');
    console.log('Team ID:', teamId);
    console.log('Dados recebidos:', teamPlayersDto);

    try {
      const { team_players } = teamPlayersDto;
      
      if (!Array.isArray(team_players)) {
        throw new Error('team_players deve ser um array');
      }

      // Verificar se o time existe
      const team = await this.teamRepository.findOne({ where: { id: teamId } });
      if (!team) {
        throw new Error('Time não encontrado');
      }

      // Limpar associações existentes para este time
      await this.playerTeamHistoryRepository
        .createQueryBuilder()
        .update(PlayerTeamHistory)
        .set({ end_date: new Date() })
        .where('team_id = :teamId', { teamId })
        .andWhere('end_date IS NULL')
        .execute();

      // Salvar novas associações
      const savedPlayers: any[] = [];
      for (const teamPlayer of team_players) {
        if (teamPlayer.player_id && teamPlayer.player_id > 0) {
          // Verificar se o jogador existe
          const player = await this.playerRepository.findOne({ 
            where: { id: teamPlayer.player_id } 
          });
          
          if (!player) {
            console.warn(`Jogador ${teamPlayer.player_id} não encontrado`);
            continue;
          }

          // Inserir nova associação diretamente
          await this.playerTeamHistoryRepository
            .createQueryBuilder()
            .insert()
            .into(PlayerTeamHistory)
            .values({
              player_id: teamPlayer.player_id,
              team_id: teamId,
              jersey_number: teamPlayer.jersey_number || null,
              role: teamPlayer.role || null,
              start_date: teamPlayer.start_date ? new Date(teamPlayer.start_date) : new Date(),
              end_date: undefined
            })
            .execute();

          savedPlayers.push({
            player_id: teamPlayer.player_id,
            team_id: teamId,
            jersey_number: teamPlayer.jersey_number || null,
            role: teamPlayer.role || null,
            start_date: teamPlayer.start_date || new Date().toISOString().split('T')[0],
            end_date: null
          });
        }
      }

      console.log('Jogadores salvos:', savedPlayers.length);
      console.log('=== SAVE AMATEUR TEAM PLAYERS FINALIZADO ===');
      
      return {
        success: true,
        message: 'Jogadores salvos com sucesso',
        data: savedPlayers
      };
    } catch (error) {
      console.error('Erro ao salvar jogadores do time:', error);
      throw error;
    }
  }

  async getAmateurCompetitionTeams(competitionId: number) {
    try {
      // Buscar times associados à competição
      const competitionTeams = await this.competitionTeamRepository
        .createQueryBuilder('ct')
        .leftJoinAndSelect('ct.competition', 'competition')
        .leftJoinAndSelect('ct.team', 'team')
        .where('ct.competition_id = :competitionId', { competitionId })
        .getMany();

      console.log('Times encontrados para competição', competitionId, ':', competitionTeams.length);
      
      return competitionTeams;
    } catch (error) {
      console.error('Erro ao buscar times da competição:', error);
      throw error;
    }
  }

  async saveAmateurCompetitionTeams(competitionId: number, competitionTeamsDto: any) {
    try {
      const { competition_teams } = competitionTeamsDto;
      
      if (!Array.isArray(competition_teams)) {
        throw new Error('competition_teams deve ser um array');
      }

      // Verificar se a competição existe
      const competition = await this.competitionRepository.findOne({
        where: { id: competitionId, category: 'amateur' }
      });

      if (!competition) {
        throw new Error('Competição amadora não encontrada');
      }

                // Limpar times existentes da competição
          await this.competitionTeamRepository.delete({
            competition: { id: competitionId }
          });

          // Salvar novos times da competição
          const savedTeams: any[] = [];
          for (const teamData of competition_teams) {
            if (teamData.team_id > 0) {
                             const competitionTeam = this.competitionTeamRepository.create({
                 competition: { id: competitionId },
                 team: { id: teamData.team_id },
                 group_name: teamData.group_name || null,
                 points: teamData.points || 0,
                 played: teamData.played || 0,
                 won: teamData.won || 0,
                 drawn: teamData.drawn || 0,
                 lost: teamData.lost || 0,
                 goals_for: teamData.goals_for || 0,
                 goals_against: teamData.goals_against || 0
                 // goal_difference é calculado automaticamente pelo banco
               });

              const savedTeam = await this.competitionTeamRepository.save(competitionTeam);
              savedTeams.push(savedTeam);
            }
          }
      
      return {
        success: true,
        message: 'Times salvos com sucesso',
        data: savedTeams
      };
    } catch (error) {
      console.error('Erro ao salvar times da competição:', error);
      throw error;
    }
  }
} 