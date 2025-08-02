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

      this.logger.log(`✅ REFORM: Temporada inicializada com ${seasonData.calendar.matches.length} partidas`);
      this.logger.log(`🎯 REFORM: Usuário pronto para jogar contra 19 times da máquina na Série D`);
      
      return seasonData;
    } catch (error) {
      this.logger.error('❌ REFORM: Error initializing season:', error);
      throw error;
    }
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
}