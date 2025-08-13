import { Injectable, Logger } from '@nestjs/common';
import { supabase } from '../../config/supabase.config';
import { SeasonsService } from '../seasons/seasons.service';

@Injectable()
export class GameTeamsReformedService {
  private readonly logger = new Logger(GameTeamsReformedService.name);

  constructor(private readonly seasonsService: SeasonsService) {}

  // ===== CRIAÇÃO DE TIMES REFORMULADA =====

  /**
   * Criar time com novo fluxo reformulado
   * 1. Criar time
   * 2. Criar 23 jogadores
   * 3. Inicializar automaticamente na Série D
   * 4. Gerar calendário da temporada
   * 5. PRONTO PARA JOGAR!
   */
  async createTeam(userId: string, teamData: any) {
    try {
      this.logger.log(`🎮 REFORM: Criando time para usuário ${userId} com novo sistema`);

      // 1. Verificar/criar usuário
      const actualUserId = await this.ensureUserExists(userId);
      
      // 2. Criar time
      const team = await this.createGameTeam(actualUserId, teamData);
      
      // 3. Criar 23 jogadores automaticamente
      await this.createInitialPlayers(team.id);
      
      // 4. NOVO: Inicializar temporada na Série D automaticamente
      await this.autoInitializeSeason(actualUserId, team.id);
      
      this.logger.log(`🎉 REFORM: Time ${team.name} criado e pronto para jogar na Série D!`);
      
      return { 
        team, 
        actualUserId,
        season_initialized: true,
        message: `Time criado com sucesso! Você foi automaticamente inscrito na Série D com 19 adversários. Sua temporada de 38 jogos já está pronta!`
      };
    } catch (error) {
      this.logger.error('❌ REFORM: Error creating team:', error);
      throw error;
    }
  }

  /**
   * Garantir que usuário existe no sistema
   */
  private async ensureUserExists(userId: string): Promise<string> {
    try {
      // Se não é um UUID válido, buscar ou criar usuário padrão
      if (!userId || !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        this.logger.log('🔧 REFORM: UserID inválido, usando/criando usuário padrão');
        
        // Buscar usuário existente
        const { data: existingUsers, error: userError } = await supabase
          .from('game_users')
          .select('id')
          .limit(1);

        if (existingUsers && existingUsers.length > 0) {
          this.logger.log('✅ REFORM: Usando usuário existente');
          return existingUsers[0].id;
        }

        // Criar novo usuário
        return await this.createNewUser();
      }

      // Para UUID válido, verificar se existe
      const { data: existingUser, error: userError } = await supabase
        .from('game_users')
        .select('id')
        .eq('id', userId)
        .single();

      if (existingUser) {
        this.logger.log('✅ REFORM: Usuário existente encontrado');
        return userId;
      }

      // Usuário não existe, criar novo
      this.logger.log('🔧 REFORM: Usuário não encontrado, criando novo');
      return await this.createNewUser();
    } catch (error) {
      this.logger.error('❌ REFORM: Error ensuring user exists:', error);
      throw error;
    }
  }

  /**
   * Criar novo usuário no sistema
   */
  private async createNewUser(): Promise<string> {
    try {
      const { data: newUser, error: createError } = await supabase
        .from('game_users')
        .insert({
          email: `user-${Date.now()}@kmiza27.com`,
          username: `user-${Date.now()}`,
          display_name: 'Usuário do Jogo'
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Error creating user: ${createError.message}`);
      }

      this.logger.log(`✅ REFORM: Novo usuário criado: ${newUser.id}`);
      return newUser.id;
    } catch (error) {
      this.logger.error('❌ REFORM: Error creating new user:', error);
      throw error;
    }
  }

  /**
   * Criar time no banco de dados
   */
  private async createGameTeam(userId: string, teamData: any) {
    try {
      this.logger.log('🏗️ REFORM: Criando time no banco de dados');

      // Gerar slug único
      const slug = await this.generateUniqueSlug(teamData.name);
      
      const newTeam = {
        ...teamData,
        slug,
        owner_id: userId,
        team_type: 'user_created',
        budget: teamData.budget || 1000000,
        reputation: teamData.reputation || 50,
        stadium_capacity: teamData.stadium_capacity || 15000,
        fan_base: teamData.fan_base || 5000,
        created_at: new Date().toISOString()
      };

      const { data: team, error } = await supabase
        .from('game_teams')
        .insert(newTeam)
        .select()
        .single();

      if (error) {
        throw new Error(`Error creating team: ${error.message}`);
      }

      this.logger.log(`✅ REFORM: Time criado: ${team.name} (ID: ${team.id})`);
      return team;
    } catch (error) {
      this.logger.error('❌ REFORM: Error creating game team:', error);
      throw error;
    }
  }

  /**
   * NOVO: Inicializar temporada automaticamente na Série D
   */
  private async autoInitializeSeason(userId: string, teamId: string) {
    try {
      this.logger.log('🏁 REFORM: Inicializando temporada automaticamente na Série D');

      const seasonData = await this.seasonsService.initializeUserSeason(
        userId, 
        teamId, 
        new Date().getFullYear()
      );

      // NOVO: Criar estatísticas zeradas para todos os times da máquina da Série D
      await this.createZeroStatsForMachineTeams(userId, 4, new Date().getFullYear());

      this.logger.log(`✅ REFORM: Temporada inicializada com ${seasonData.calendar.matches.length} partidas`);
      this.logger.log(`✅ REFORM: Estatísticas zeradas criadas para 19 times da máquina`);
      this.logger.log(`🎯 REFORM: Usuário pronto para jogar contra 19 times da máquina na Série D`);
      
      return seasonData;
    } catch (error) {
      this.logger.error('❌ REFORM: Error initializing season:', error);
      throw error;
    }
  }

  /**
   * Criar estatísticas zeradas para todos os times da máquina da série
   */
  private async createZeroStatsForMachineTeams(userId: string, tier: number, seasonYear: number) {
    try {
      this.logger.log(`📊 REFORM: Criando estatísticas zeradas para usuário ${userId} na Série ${this.getTierName(tier)}`);
      
      // Buscar todos os times da máquina da série
      const { data: machineTeams, error: teamsError } = await supabase
        .from('game_machine_teams')
        .select('id, name')
        .eq('tier', tier)
        .eq('is_active', true);
      
      if (teamsError) {
        throw new Error(`Erro ao buscar times da máquina: ${teamsError.message}`);
      }
      
      if (!machineTeams || machineTeams.length === 0) {
        this.logger.warn(`⚠️ REFORM: Nenhum time da máquina encontrado para Série ${this.getTierName(tier)}`);
        return;
      }
      
      this.logger.log(`🔍 REFORM: Encontrados ${machineTeams.length} times da máquina para criar estatísticas zeradas`);
      
      let created = 0;
      let existing = 0;
      
      // Criar estatísticas zeradas para cada time da máquina
      for (const team of machineTeams) {
        const { data, error: insertError } = await supabase
          .from('game_user_machine_team_stats')
          .insert({
            user_id: userId,
            team_id: team.id,
            team_name: team.name,
            season_year: seasonYear,
            tier: tier,
            games_played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goals_for: 0,
            goals_against: 0,
            points: 0
          })
          .select();
        
        if (insertError) {
          if (insertError.code === '23505') {
            // Registro já existe
            existing++;
            this.logger.log(`   ⚠️ ${team.name} - estatísticas já existem`);
          } else {
            this.logger.error(`   ❌ ${team.name} - erro:`, insertError.message);
          }
        } else {
          created++;
          this.logger.log(`   ✅ ${team.name} - estatísticas zeradas criadas`);
        }
      }
      
      this.logger.log(`📊 REFORM: ${created} estatísticas criadas, ${existing} já existiam`);
      
    } catch (error) {
      this.logger.error('❌ REFORM: Erro ao criar estatísticas zeradas:', error);
      // Não falhar a criação do time se isso der erro
    }
  }

  /**
   * Converte tier numérico para nome da série
   */
  private getTierName(tier: number): string {
    const names = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
    return names[tier] || tier.toString();
  }

  // ===== CRIAÇÃO DE JOGADORES (MANTIDO) =====

  /**
   * Criar 23 jogadores iniciais para o time
   */
  private async createInitialPlayers(teamId: string) {
    try {
      this.logger.log(`👥 REFORM: Criando 23 jogadores para o time ${teamId}`);

      const players = this.generateInitialPlayers(teamId);
      
      // Inserir jogadores em lotes
      const batchSize = 10;
      let createdCount = 0;

      for (let i = 0; i < players.length; i += batchSize) {
        const batch = players.slice(i, i + batchSize);
        
        const { data, error } = await supabase
          .from('youth_players')
          .insert(batch)
          .select();

        if (error) {
          this.logger.error(`❌ REFORM: Error creating players batch:`, error);
          continue;
        }

        createdCount += data?.length || 0;
      }

      this.logger.log(`✅ REFORM: ${createdCount} jogadores criados`);
      return createdCount;
    } catch (error) {
      this.logger.error('❌ REFORM: Error creating initial players:', error);
      throw error;
    }
  }

  /**
   * Gerar dados dos 23 jogadores iniciais
   */
  private generateInitialPlayers(teamId: string) {
    const positions = [
      // 3 Goleiros
      { position: 'Goleiro', count: 3 },
      // 8 Defensores
      { position: 'Zagueiro', count: 4 },
      { position: 'Lateral Esquerdo', count: 2 },
      { position: 'Lateral Direito', count: 2 },
      // 8 Meio-campistas
      { position: 'Volante', count: 2 },
      { position: 'Meia Central', count: 2 },
      { position: 'Meia Ofensivo', count: 2 },
      { position: 'Ponta Esquerda', count: 1 },
      { position: 'Ponta Direita', count: 1 },
      // 4 Atacantes
      { position: 'Atacante', count: 2 },
      { position: 'Centroavante', count: 2 }
    ];

    const players = [];
    const firstNames = [
      'João', 'Pedro', 'Gabriel', 'Lucas', 'Matheus', 'Rafael', 'Daniel', 'Diego',
      'Carlos', 'Bruno', 'André', 'Felipe', 'Rodrigo', 'Thiago', 'Marcelo', 'Leonardo',
      'Fernando', 'Gustavo', 'Eduardo', 'Ricardo', 'Paulo', 'Sérgio', 'Roberto', 'Marcos'
    ];
    const lastNames = [
      'Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Rodrigues',
      'Almeida', 'Nascimento', 'Ferreira', 'Araújo', 'Ribeiro', 'Barbosa', 'Cardoso', 'Martins'
    ];

    for (const positionGroup of positions) {
      for (let i = 0; i < positionGroup.count; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const age = 16 + Math.floor(Math.random() * 5); // 16-20 anos
        
        const attributes = this.generatePlayerAttributes(positionGroup.position);
        const potential = this.generatePlayerPotential(attributes);

        players.push({
          name: `${firstName} ${lastName}`,
          position: positionGroup.position,
          date_of_birth: new Date(Date.now() - age * 365 * 24 * 60 * 60 * 1000),
          nationality: 'Brasil',
          team_id: teamId,
          attributes: attributes,
          potential: potential,
          status: 'contracted',
          contract_date: new Date(),
          created_at: new Date().toISOString()
        });
      }
    }

    return players;
  }

  /**
   * Gerar atributos baseados na posição
   */
  private generatePlayerAttributes(position: string) {
    const baseAttributes = {
      pace: 50 + Math.floor(Math.random() * 25),
      shooting: 50 + Math.floor(Math.random() * 25),
      passing: 50 + Math.floor(Math.random() * 25),
      dribbling: 50 + Math.floor(Math.random() * 25),
      defending: 50 + Math.floor(Math.random() * 25),
      physical: 50 + Math.floor(Math.random() * 25)
    };

    // Ajustar atributos baseado na posição
    switch (position) {
      case 'Goleiro':
        baseAttributes.defending = Math.max(75, baseAttributes.defending + 15);
        baseAttributes.physical = Math.max(70, baseAttributes.physical + 10);
        break;
      case 'Zagueiro':
        baseAttributes.defending = Math.max(70, baseAttributes.defending + 10);
        baseAttributes.physical = Math.max(70, baseAttributes.physical + 10);
        break;
      case 'Lateral Esquerdo':
      case 'Lateral Direito':
        baseAttributes.pace = Math.max(70, baseAttributes.pace + 10);
        baseAttributes.defending = Math.max(65, baseAttributes.defending + 5);
        break;
      case 'Volante':
        baseAttributes.defending = Math.max(70, baseAttributes.defending + 10);
        baseAttributes.physical = Math.max(70, baseAttributes.physical + 10);
        break;
      case 'Meia Central':
      case 'Meia Ofensivo':
        baseAttributes.passing = Math.max(70, baseAttributes.passing + 10);
        baseAttributes.dribbling = Math.max(65, baseAttributes.dribbling + 5);
        break;
      case 'Ponta Esquerda':
      case 'Ponta Direita':
        baseAttributes.pace = Math.max(70, baseAttributes.pace + 10);
        baseAttributes.dribbling = Math.max(70, baseAttributes.dribbling + 10);
        break;
      case 'Atacante':
      case 'Centroavante':
        baseAttributes.shooting = Math.max(70, baseAttributes.shooting + 10);
        baseAttributes.pace = Math.max(70, baseAttributes.pace + 10);
        break;
    }

    return baseAttributes;
  }

  /**
   * Gerar potencial de evolução do jogador
   */
  private generatePlayerPotential(attributes: any) {
    return {
      pace: Math.min(99, attributes.pace + Math.floor(Math.random() * 15)),
      shooting: Math.min(99, attributes.shooting + Math.floor(Math.random() * 15)),
      passing: Math.min(99, attributes.passing + Math.floor(Math.random() * 15)),
      dribbling: Math.min(99, attributes.dribbling + Math.floor(Math.random() * 15)),
      defending: Math.min(99, attributes.defending + Math.floor(Math.random() * 15)),
      physical: Math.min(99, attributes.physical + Math.floor(Math.random() * 15))
    };
  }

  // ===== UTILITÁRIOS =====

  /**
   * Gerar slug único para o time
   */
  private async generateUniqueSlug(teamName: string): Promise<string> {
    try {
      let baseSlug = teamName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      let slug = baseSlug;
      let counter = 1;

      while (true) {
        const { data: existingTeam, error } = await supabase
          .from('game_teams')
          .select('id')
          .eq('slug', slug)
          .single();

        if (!existingTeam) {
          break;
        }

        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      return slug;
    } catch (error) {
      // Se houve erro na consulta, provavelmente o slug não existe
      return teamName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    }
  }

  // ===== CONSULTAS =====

  /**
   * Buscar times do usuário
   */
  async getUserTeams(userId: string) {
    try {
      this.logger.log(`🔍 REFORM: Buscando times do usuário ${userId}`);

      // Garantir que o usuário existe
      const actualUserId = await this.ensureUserExists(userId);

      const { data: teams, error } = await supabase
        .from('game_teams')
        .select(`
          *,
          user_progress:game_user_competition_progress(
            current_tier,
            position,
            points,
            games_played,
            season_status
          )
        `)
        .eq('owner_id', actualUserId)
        .eq('team_type', 'user_created');

      if (error) {
        throw new Error(`Error fetching user teams: ${error.message}`);
      }

      this.logger.log(`✅ REFORM: Encontrados ${teams?.length || 0} times`);
      return teams || [];
    } catch (error) {
      this.logger.error('❌ REFORM: Error getting user teams:', error);
      throw error;
    }
  }

  /**
   * Buscar time específico com progresso da temporada
   */
  async getTeamWithProgress(teamId: string) {
    try {
      const { data: team, error } = await supabase
        .from('game_teams')
        .select(`
          *,
          user_progress:game_user_competition_progress(
            current_tier,
            position,
            points,
            games_played,
            wins,
            draws,
            losses,
            goals_for,
            goals_against,
            season_status,
            season_year
          ),
          youth_players(
            id,
            name,
            position,
            attributes
          )
        `)
        .eq('id', teamId)
        .single();

      if (error) {
        throw new Error(`Error fetching team: ${error.message}`);
      }

      return team;
    } catch (error) {
      this.logger.error('❌ REFORM: Error getting team with progress:', error);
      throw error;
    }
  }

  // ===== DELEÇÃO DE TIMES =====

  /**
   * Deletar time com limpeza COMPLETA e TOTAL
   * 1. Deletar partidas da temporada
   * 2. Deletar progresso da temporada
   * 3. Deletar estatísticas dos times da máquina
   * 4. Deletar TODOS os jogadores (youth_players + game_players)
   * 5. Deletar academia do time
   * 6. Deletar testes da academia
   * 7. Deletar notícias do time
   * 8. Deletar o time
   * 9. LIMPEZA TOTAL GARANTIDA!
   */
  async deleteTeam(teamId: string, userId: string) {
    try {
      this.logger.log(`🗑️ REFORM: Iniciando DELETÇÃO COMPLETA do time ${teamId} do usuário ${userId}`);

      // 1. Verificar se o time pertence ao usuário
      const { data: team, error: teamError } = await supabase
        .from('game_teams')
        .select('id, name, owner_id')
        .eq('id', teamId)
        .eq('owner_id', userId)
        .single();

      if (teamError || !team) {
        throw new Error('Time não encontrado ou não pertence ao usuário');
      }

      this.logger.log(`🔍 REFORM: Deletando time "${team.name}" com LIMPEZA TOTAL`);

      // 2. Deletar partidas da temporada atual
      await this.deleteSeasonMatches(userId, teamId);

      // 3. Deletar progresso da temporada atual
      await this.deleteUserProgress(userId, teamId);

      // 4. Deletar estatísticas dos times da máquina do usuário
      await this.deleteUserMachineTeamStats(userId, teamId);

      // 5. Deletar histórico de temporadas (opcional - vou manter por enquanto)
      // await this.deleteSeasonHistory(userId, teamId);

      // 6. Deletar TODOS os jogadores do time (youth_players + game_players)
      await this.deleteTeamPlayers(teamId);

      // 7. NOVO: Deletar academia do time
      await this.deleteTeamAcademy(teamId);

      // 8. NOVO: Deletar testes da academia
      await this.deleteTeamTryouts(teamId);

      // 9. NOVO: Deletar notícias do time
      await this.deleteTeamNews(teamId);

      // 10. Deletar o time
      const { error: deleteTeamError } = await supabase
        .from('game_teams')
        .delete()
        .eq('id', teamId)
        .eq('owner_id', userId);

      if (deleteTeamError) {
        throw new Error(`Error deleting team: ${deleteTeamError.message}`);
      }

      this.logger.log(`✅ REFORM: Time "${team.name}" DELETADO COMPLETAMENTE com LIMPEZA TOTAL!`);

      return {
        success: true,
        message: `Time "${team.name}" foi deletado com sucesso. TODOS os dados foram completamente removidos.`,
        team_name: team.name
      };

    } catch (error) {
      this.logger.error('❌ REFORM: Error deleting team:', error);
      throw error;
    }
  }

  /**
   * Deletar partidas da temporada atual
   */
  private async deleteSeasonMatches(userId: string, teamId: string) {
    try {
      const currentYear = new Date().getFullYear();
      
      const { error } = await supabase
        .from('game_season_matches')
        .delete()
        .eq('user_id', userId);

      if (error) {
        this.logger.warn(`⚠️ Erro ao deletar partidas: ${error.message}`);
      } else {
        this.logger.log('🗑️ Partidas da temporada deletadas');
      }
    } catch (error) {
      this.logger.warn('⚠️ Erro ao deletar partidas:', error);
    }
  }

  /**
   * Deletar progresso da temporada atual
   */
  private async deleteUserProgress(userId: string, teamId: string) {
    try {
      const { error } = await supabase
        .from('game_user_competition_progress')
        .delete()
        .eq('user_id', userId)
        .eq('team_id', teamId);

      if (error) {
        this.logger.warn(`⚠️ Erro ao deletar progresso: ${error.message}`);
      } else {
        this.logger.log('🗑️ Progresso da temporada deletado');
      }
    } catch (error) {
      this.logger.warn('⚠️ Erro ao deletar progresso:', error);
    }
  }

  /**
   * Deletar estatísticas dos times da máquina do usuário
   */
  private async deleteUserMachineTeamStats(userId: string, teamId: string) {
    try {
      const { error } = await supabase
        .from('game_user_machine_team_stats')
        .delete()
        .eq('user_id', userId);

      if (error) {
        this.logger.warn(`⚠️ Erro ao deletar estatísticas dos times da máquina: ${error.message}`);
      } else {
        this.logger.log('🗑️ Estatísticas dos times da máquina deletadas');
      }
    } catch (error) {
      this.logger.warn('⚠️ Erro ao deletar estatísticas dos times da máquina:', error);
    }
  }

  /**
   * Deletar jogadores do time
   */
  private async deleteTeamPlayers(teamId: string) {
    try {
      // 1. Deletar jogadores da academia (youth_players)
      const { error: youthError } = await supabase
        .from('youth_players')
        .delete()
        .eq('team_id', teamId);

      if (youthError) {
        this.logger.warn(`⚠️ Erro ao deletar youth_players: ${youthError.message}`);
      } else {
        this.logger.log('🗑️ Youth players do time deletados');
      }

      // 2. Deletar jogadores principais (game_players)
      const { error: gameError } = await supabase
        .from('game_players')
        .delete()
        .eq('team_id', teamId);

      if (gameError) {
        this.logger.warn(`⚠️ Erro ao deletar game_players: ${gameError.message}`);
      } else {
        this.logger.log('🗑️ Game players do time deletados');
      }

      this.logger.log('✅ Todos os jogadores do time foram deletados com sucesso');
    } catch (error) {
      this.logger.warn('⚠️ Erro ao deletar jogadores:', error);
    }
  }

  /**
   * Deletar histórico de temporadas (opcional)
   */
  private async deleteSeasonHistory(userId: string, teamId: string) {
    try {
      const { error } = await supabase
        .from('game_season_history')
        .delete()
        .eq('user_id', userId)
        .eq('team_id', teamId);

      if (error) {
        this.logger.warn(`⚠️ Erro ao deletar histórico: ${error.message}`);
      } else {
        this.logger.log('🗑️ Histórico de temporadas deletado');
      }
    } catch (error) {
      this.logger.warn('⚠️ Erro ao deletar histórico:', error);
    }
  }

  /**
   * NOVO: Deletar academia do time
   */
  private async deleteTeamAcademy(teamId: string) {
    try {
      const { error } = await supabase
        .from('youth_academies')
        .delete()
        .eq('team_id', teamId);

      if (error) {
        this.logger.warn(`⚠️ Erro ao deletar academia: ${error.message}`);
      } else {
        this.logger.log('🗑️ Academia do time deletada');
      }
    } catch (error) {
      this.logger.warn('⚠️ Erro ao deletar academia:', error);
    }
  }

  /**
   * NOVO: Deletar testes da academia do time
   */
  private async deleteTeamTryouts(teamId: string) {
    try {
      const { error } = await supabase
        .from('youth_tryouts')
        .delete()
        .eq('team_id', teamId);

      if (error) {
        this.logger.warn(`⚠️ Erro ao deletar testes da academia: ${error.message}`);
      } else {
        this.logger.log('🗑️ Testes da academia do time deletados');
      }
    } catch (error) {
      this.logger.warn('⚠️ Erro ao deletar testes da academia:', error);
    }
  }

  /**
   * NOVO: Deletar notícias do time
   */
  private async deleteTeamNews(teamId: string) {
    try {
      const { error } = await supabase
        .from('game_news')
        .delete()
        .eq('team_id', teamId);

      if (error) {
        this.logger.warn(`⚠️ Erro ao deletar notícias: ${error.message}`);
      } else {
        this.logger.log('🗑️ Notícias do time deletadas');
      }
    } catch (error) {
      this.logger.warn('⚠️ Erro ao deletar notícias:', error);
    }
  }
}