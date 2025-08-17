import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Like, FindManyOptions } from 'typeorm';
import { Team, Match, CompetitionTeam, Player, PlayerTeamHistory, InternationalTeam, Competition, CompetitionType } from '../../entities';
import { MatchStatus } from '../../entities/match.entity';
import { StandingsService } from '../standings/standings.service';
import { SimulationResult } from '../../entities/simulation-result.entity';

export interface PaginatedTeamsResult {
  data: Team[];
  total: number;
}

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(CompetitionTeam)
    private competitionTeamRepository: Repository<CompetitionTeam>,
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
    @InjectRepository(PlayerTeamHistory)
    private playerTeamHistoryRepository: Repository<PlayerTeamHistory>,
    @InjectRepository(InternationalTeam)
    private internationalTeamRepository: Repository<InternationalTeam>,
    @InjectRepository(SimulationResult)
    private simulationRepository: Repository<SimulationResult>,
    private standingsService: StandingsService,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 20,
    search?: string,
    state?: string,
    city?: string,
    country?: string,
    competitionId?: number,
  ): Promise<PaginatedTeamsResult> {
    const queryBuilder = this.teamRepository.createQueryBuilder('team')
      .leftJoinAndSelect('team.stadium', 'stadium')
      .orderBy('team.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    let whereConditions: string[] = [];
    let parameters: any = {};

    if (search) {
      const searchTerm = search.trim();
      whereConditions.push(
        `(LOWER(team.name) LIKE LOWER(:searchTerm) OR 
         LOWER(team.short_name) LIKE LOWER(:searchTerm) OR
         LOWER(team.city) LIKE LOWER(:searchTerm) OR
         LOWER(team.state) LIKE LOWER(:searchTerm))`
      );
      parameters.searchTerm = `%${searchTerm}%`;
    }

    if (state) {
      whereConditions.push('team.state = :state');
      parameters.state = state.trim();
    }

    if (city) {
      whereConditions.push('team.city = :city');
      parameters.city = city.trim();
    }

    if (country) {
      whereConditions.push('team.country = :country');
      parameters.country = country.trim();
    }

    if (competitionId) {
      queryBuilder.innerJoin('team.competitionTeams', 'competitionTeam')
                  .innerJoin('competitionTeam.competition', 'competition');
      whereConditions.push('competition.id = :competitionId');
      parameters.competitionId = competitionId;
    }

    if (whereConditions.length > 0) {
      queryBuilder.where(whereConditions.join(' AND '), parameters);
    }

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async findAllForAutocomplete(): Promise<Team[]> {
    return this.teamRepository.find({
      select: ['id', 'name', 'short_name', 'logo_url'],
      order: {
        name: 'ASC'
      }
    });
  }

  async search(query: string): Promise<Team[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = `%${query.trim()}%`;
    
    return this.teamRepository.find({
      where: [
        { name: Like(searchTerm) },
        { short_name: Like(searchTerm) },
      ],
      relations: ['stadium'],
      take: 10, // Limitar a 10 resultados
      order: {
        name: 'ASC',
      },
    });
  }

  async findOne(id: number): Promise<Team | null> {
    return this.teamRepository.findOne({
      where: { id },
      relations: ['stadium'],
    });
  }

  async findBySlug(slug: string): Promise<Team | null> {
    return this.teamRepository.findOne({ where: { slug } });
  }

  async create(teamData: Partial<Team>): Promise<Team> {
    try {
      console.log('🏗️ Criando time com dados:', teamData);

      // Garantir que exista um slug único caso ele não seja enviado no DTO
      if (!teamData.slug && teamData.name) {
        teamData.slug = await this.generateUniqueSlug(teamData.name);
        console.log('🔗 Slug gerado:', teamData.slug);
      }

      // Validar campos obrigatórios
      if (!teamData.name) {
        throw new BadRequestException('Nome do time é obrigatório.');
      }

      console.log('✅ Dados finais para criação:', teamData);

      const team = this.teamRepository.create(teamData);
      const savedTeam = await this.teamRepository.save(team);
      
      console.log('🎉 Time criado com sucesso:', savedTeam);
      return savedTeam;
    } catch (error) {
      console.error("❌ Erro ao criar o time:", error);
      
      if (error instanceof BadRequestException) {
        throw error; // Re-throw BadRequestException
      }
      
      if (error.code === '23505') { // Código de erro PostgreSQL para violação de restrição única
        throw new BadRequestException('Já existe um time com este slug ou nome.');
      }
      if (error.code === '23502') { // NOT NULL violation (por exemplo, name ausente)
        throw new BadRequestException('Campos obrigatórios não foram enviados.');
      }
      if (error.code === '23503') { // Foreign key violation
        throw new BadRequestException('Referência inválida (ex: estádio não existe).');
      }
      
      throw new BadRequestException(`Erro ao criar o time: ${error.message}`);
    }
  }

  /**
   * Gera um slug "url-friendly" a partir do nome do time e garante unicidade no banco.
   */
  private async generateUniqueSlug(name: string): Promise<string> {
    // Função básica de slugify sem dependências externas
    const baseSlug = name
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentuação
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 250); // reserva espaço para sufixo se necessário

    let slug = baseSlug;
    let counter = 1;

    // Verificar se o slug já existe; se existir, acrescentar sufixo incremental
    while (await this.teamRepository.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`.substring(0, 255);
      counter++;
    }

    return slug;
  }

  async update(id: number, teamData: Partial<Team>): Promise<Team | null> {
    if (teamData.slug) {
      const existingTeam = await this.teamRepository.findOne({ where: { slug: teamData.slug } });
      if (existingTeam && existingTeam.id !== id) {
        throw new BadRequestException('Já existe um time com este slug.');
      }
    }

    const dataToUpdate: Partial<Team> = { ...teamData };

    // Garante que stadium_id seja null se for uma string vazia
    if (typeof dataToUpdate.stadium_id === 'string' && dataToUpdate.stadium_id === '') {
      (dataToUpdate as any).stadium_id = null; // Cast para any para permitir atribuição de null
    }

    try {
      await this.teamRepository.update(id, dataToUpdate);
      return this.findOne(id);
    } catch (error) {
      console.error("Erro ao atualizar o time:", error);
      throw new BadRequestException('Erro ao atualizar o time. Verifique os dados fornecidos.');
    }
  }

  async updateAliases(id: number, aliases: string[]): Promise<Team | null> {
    const team = await this.findOne(id);
    if (!team) {
      throw new NotFoundException(`Time com ID ${id} não encontrado`);
    }

    // Validar aliases
    if (aliases && !Array.isArray(aliases)) {
      throw new BadRequestException('Aliases deve ser um array de strings');
    }

    // Remover aliases vazios e duplicados
    const cleanAliases = aliases
      ?.filter(alias => alias && alias.trim().length > 0)
      ?.map(alias => alias.trim().toLowerCase())
      ?.filter((alias, index, arr) => arr.indexOf(alias) === index) || [];

    team.aliases = cleanAliases;
    return this.teamRepository.save(team);
  }

  async addAlias(id: number, alias: string): Promise<Team | null> {
    const team = await this.findOne(id);
    if (!team) {
      throw new NotFoundException(`Time com ID ${id} não encontrado`);
    }

    const cleanAlias = alias.trim().toLowerCase();
    if (!cleanAlias) {
      throw new BadRequestException('Alias não pode estar vazio');
    }

    const currentAliases = team.aliases || [];
    if (currentAliases.includes(cleanAlias)) {
      throw new BadRequestException('Alias já existe para este time');
    }

    team.aliases = [...currentAliases, cleanAlias];
    return this.teamRepository.save(team);
  }

  async removeAlias(id: number, alias: string): Promise<Team | null> {
    const team = await this.findOne(id);
    if (!team) {
      throw new NotFoundException(`Time com ID ${id} não encontrado`);
    }

    const cleanAlias = alias.trim().toLowerCase();
    const currentAliases = team.aliases || [];
    
    if (!currentAliases.includes(cleanAlias)) {
      throw new BadRequestException('Alias não encontrado para este time');
    }

    team.aliases = currentAliases.filter(a => a !== cleanAlias);
    return this.teamRepository.save(team);
  }

  async checkTeamDependencies(id: number): Promise<{
    team: Team;
    canDelete: boolean;
    dependencies: {
      matches: number;
      competitions: number;
      players: number;
    };
    message?: string;
  }> {
    // Verificar se o time existe
    const team = await this.findOne(id);
    if (!team) {
      throw new BadRequestException('Time não encontrado');
    }

    // Verificar dependências
    const matchesAsHome = await this.matchRepository.count({
      where: { home_team: { id } }
    });
    
    const matchesAsAway = await this.matchRepository.count({
      where: { away_team: { id } }
    });

    const totalMatches = matchesAsHome + matchesAsAway;

    const competitionTeams = await this.competitionTeamRepository.count({
      where: { team: { id } }
    });

    const playerHistories = await this.playerTeamHistoryRepository.count({
      where: { team: { id } }
    });

    const canDelete = totalMatches === 0 && competitionTeams === 0;
    
    let message = '';
    if (!canDelete) {
      const issues: string[] = [];
      if (totalMatches > 0) {
        issues.push(`${totalMatches} partida(s)`);
      }
      if (competitionTeams > 0) {
        issues.push(`${competitionTeams} competição(ões)`);
      }
      message = `Não é possível excluir o time "${team.name}" pois ele possui: ${issues.join(' e ')}.`;
    }

    return {
      team,
      canDelete,
      dependencies: {
        matches: totalMatches,
        competitions: competitionTeams,
        players: playerHistories,
      },
      message: canDelete ? undefined : message,
    };
  }

  async remove(id: number, force: boolean = false): Promise<void> {
    const dependencyCheck = await this.checkTeamDependencies(id);
    
    if (!dependencyCheck.canDelete && !force) {
      throw new BadRequestException(dependencyCheck.message);
    }

    if (force) {
      // Remover dependências antes de excluir o time
      // 1. Remover das competições
      await this.competitionTeamRepository.delete({ team: { id } });
      
      // 2. Remover partidas onde o time participa
      await this.matchRepository.delete({ home_team: { id } });
      await this.matchRepository.delete({ away_team: { id } });
    }

    // Excluir histórico de jogadores associado ao time
    await this.playerTeamHistoryRepository.delete({ team: { id } });

    // Se chegou até aqui, pode excluir
    await this.teamRepository.delete(id);
  }

  async addPlayerToTeam(
    teamId: number,
    playerId: number,
    start_date: Date,
    jersey_number?: string,
    role?: string,
  ): Promise<PlayerTeamHistory> {
    const team = await this.teamRepository.findOneBy({ id: teamId });
    const player = await this.playerRepository.findOneBy({ id: playerId });

    if (!team) {
      throw new NotFoundException('Time não encontrado');
    }
    if (!player) {
      throw new NotFoundException('Jogador não encontrado');
    }

    // Opcional: verificar se o jogador já está no time com uma data de término nula
    const currentHistory = await this.playerTeamHistoryRepository.findOne({
      where: { player: { id: playerId }, team: { id: teamId }, end_date: IsNull() },
    });

    if (currentHistory) {
      throw new BadRequestException('Jogador já está no elenco ativo deste time.');
    }

    const playerTeamHistory = this.playerTeamHistoryRepository.create({
      team,
      player,
      start_date,
      jersey_number,
      role,
    });

    return this.playerTeamHistoryRepository.save(playerTeamHistory);
  }

  async removePlayerFromTeam(historyId: number, teamId: number, end_date: Date): Promise<PlayerTeamHistory> {
    const historyEntry = await this.playerTeamHistoryRepository.findOne({
      where: { id: historyId, team: { id: teamId } },
      relations: ['player', 'team'],
    });

    if (!historyEntry) {
      throw new NotFoundException('Histórico de jogador no time não encontrado');
    }

    if (historyEntry.end_date !== null) {
      throw new BadRequestException('Este jogador já foi removido deste elenco.');
    }

    historyEntry.end_date = end_date;
    return this.playerTeamHistoryRepository.save(historyEntry);
  }

  async getTeamPlayersHistory(teamId: number): Promise<PlayerTeamHistory[]> {
    const team = await this.teamRepository.findOneBy({ id: teamId });
    if (!team) {
      throw new NotFoundException('Time não encontrado');
    }

    return this.playerTeamHistoryRepository.find({
      where: { team: { id: teamId } },
      relations: ['player'], // Carrega os dados do jogador associado
      order: { start_date: 'DESC' },
    });
  }

  async getTeamActivePlayers(teamId: number): Promise<PlayerTeamHistory[]> {
    const team = await this.teamRepository.findOneBy({ id: teamId });
    if (!team) {
      throw new NotFoundException('Time não encontrado');
    }

    return this.playerTeamHistoryRepository.find({
      where: { team: { id: teamId }, end_date: IsNull() },
      relations: ['player'],
      order: { start_date: 'DESC' },
    });
  }

  async getUniqueStates(country?: string): Promise<string[]> {
    const queryBuilder = this.teamRepository
      .createQueryBuilder('team')
      .select('DISTINCT team.state', 'state')
      .where('team.state IS NOT NULL AND team.state != \'\'');
    
    if (country) {
      queryBuilder.andWhere('team.country = :country', { country });
    }
    
    const result = await queryBuilder
      .orderBy('team.state', 'ASC')
      .getRawMany();
    
    return result.map(item => item.state).filter(Boolean);
  }

  async getUniqueCities(country?: string, state?: string): Promise<string[]> {
    const queryBuilder = this.teamRepository
      .createQueryBuilder('team')
      .select('DISTINCT team.city', 'city')
      .where('team.city IS NOT NULL AND team.city != \'\'');
    
    if (country) {
      queryBuilder.andWhere('team.country = :country', { country });
    }
    
    if (state) {
      queryBuilder.andWhere('team.state = :state', { state });
    }
    
    const result = await queryBuilder
      .orderBy('team.city', 'ASC')
      .getRawMany();
    
    return result.map(item => item.city).filter(Boolean);
  }

  async getUniqueCountries(): Promise<string[]> {
    const result = await this.teamRepository
      .createQueryBuilder('team')
      .select('DISTINCT team.country', 'country')
      .where('team.country IS NOT NULL AND team.country != \'\'')
      .orderBy('team.country', 'ASC')
      .getRawMany();
    
    return result.map(item => item.country).filter(Boolean);
  }

  /**
   * Busca os últimos 3 jogos finalizados de um time
   */
  async getTeamRecentMatches(teamId: number): Promise<Match[]> {
    const team = await this.teamRepository.findOneBy({ id: teamId });
    if (!team) {
      throw new NotFoundException('Time não encontrado');
    }

    return this.matchRepository.find({
      where: [
        { home_team: { id: teamId }, status: MatchStatus.FINISHED },
        { away_team: { id: teamId }, status: MatchStatus.FINISHED },
      ],
      relations: ['home_team', 'away_team', 'competition', 'round', 'stadium'],
      order: { match_date: 'DESC' },
      take: 3,
    });
  }

  /**
   * Busca os próximos 3 jogos agendados de um time
   */
  async getTeamUpcomingMatches(teamId: number): Promise<Match[]> {
    const team = await this.teamRepository.findOneBy({ id: teamId });
    if (!team) {
      throw new NotFoundException('Time não encontrado');
    }

    return this.matchRepository.find({
      where: [
        { home_team: { id: teamId }, status: MatchStatus.SCHEDULED },
        { away_team: { id: teamId }, status: MatchStatus.SCHEDULED },
      ],
      relations: ['home_team', 'away_team', 'competition', 'round', 'stadium'],
      order: { match_date: 'ASC' },
      take: 3,
    });
  }

  // Métodos para times internacionais
  async getInternationalTeams(): Promise<Team[]> {
    try {
      const internationalTeams = await this.internationalTeamRepository.find({
        relations: ['team'],
        order: { displayOrder: 'ASC' }
      });
      
      return internationalTeams.map(it => it.team);
    } catch (error) {
      console.error('Erro ao buscar times internacionais:', error);
      // Se houver erro, retornar array vazio
      return [];
    }
  }

  async addInternationalTeam(teamId: number, order: number): Promise<void> {
    // Verificar se o time já é internacional
    const existing = await this.internationalTeamRepository.findOneBy({ teamId });
    if (existing) {
      throw new BadRequestException('Time já está na lista internacional');
    }

    // Verificar limite de 20 times
    const count = await this.internationalTeamRepository.count();
    if (count >= 20) {
      throw new BadRequestException('Limite máximo de 20 times internacionais atingido');
    }

    // Verificar se o time existe
    const team = await this.teamRepository.findOneBy({ id: teamId });
    if (!team) {
      throw new NotFoundException('Time não encontrado');
    }

    // Criar entrada na tabela de times internacionais
    await this.internationalTeamRepository.save({
      teamId,
      displayOrder: order
    });
  }

  async removeInternationalTeam(teamId: number): Promise<void> {
    const internationalTeam = await this.internationalTeamRepository.findOneBy({ teamId });
    if (!internationalTeam) {
      throw new BadRequestException('Time não está na lista internacional');
    }

    await this.internationalTeamRepository.remove(internationalTeam);
  }

  async updateInternationalTeamOrder(teamId: number, newOrder: number): Promise<void> {
    const internationalTeam = await this.internationalTeamRepository.findOneBy({ teamId });
    if (!internationalTeam) {
      throw new BadRequestException('Time não está na lista internacional');
    }

    internationalTeam.displayOrder = newOrder;
    await this.internationalTeamRepository.save(internationalTeam);
  }

  async getInternationalTeamsCount(): Promise<number> {
    return this.internationalTeamRepository.count();
  }

  // ===== MÉTODOS DE ESTATÍSTICAS AVANÇADAS =====

  /**
   * Obtém estatísticas gerais de um time
   */
  async getTeamStatistics(teamId: number) {
    const team = await this.teamRepository.findOneBy({ id: teamId });
    if (!team) {
      throw new NotFoundException('Time não encontrado');
    }

    // Buscar todas as partidas do time
    const matches = await this.matchRepository.find({
      where: [
        { home_team: { id: teamId } },
        { away_team: { id: teamId } }
      ],
      relations: ['home_team', 'away_team', 'competition', 'round'],
      order: { match_date: 'ASC' }
    });

    // Separar partidas por status
    const finishedMatches = matches.filter(m => m.status === MatchStatus.FINISHED);
    const scheduledMatches = matches.filter(m => m.status === MatchStatus.SCHEDULED);

    // Estatísticas de partidas finalizadas
    const homeMatches = finishedMatches.filter(m => m.home_team.id === teamId);
    const awayMatches = finishedMatches.filter(m => m.away_team.id === teamId);

    const homeWins = homeMatches.filter(m => m.home_score > m.away_score).length;
    const homeDraws = homeMatches.filter(m => m.home_score === m.away_score).length;
    const homeLosses = homeMatches.filter(m => m.home_score < m.away_score).length;

    const awayWins = awayMatches.filter(m => m.away_score > m.home_score).length;
    const awayDraws = awayMatches.filter(m => m.away_score === m.home_score).length;
    const awayLosses = awayMatches.filter(m => m.away_score < m.home_score).length;

    // Calcular pontos
    const homePoints = (homeWins * 3) + homeDraws;
    const awayPoints = (awayWins * 3) + awayDraws;
    const totalPoints = homePoints + awayPoints;

    // Gols
    const homeGoalsFor = homeMatches.reduce((sum, m) => sum + (m.home_score || 0), 0);
    const homeGoalsAgainst = homeMatches.reduce((sum, m) => sum + (m.away_score || 0), 0);
    const awayGoalsFor = awayMatches.reduce((sum, m) => sum + (m.away_score || 0), 0);
    const awayGoalsAgainst = awayMatches.reduce((sum, m) => sum + (m.home_score || 0), 0);

    return {
      team: {
        id: team.id,
        name: team.name,
        logo_url: team.logo_url,
      },
      matches: {
        total: matches.length,
        finished: finishedMatches.length,
        scheduled: scheduledMatches.length,
        home: {
          played: homeMatches.length,
          won: homeWins,
          drawn: homeDraws,
          lost: homeLosses,
          points: homePoints,
          goalsFor: homeGoalsFor,
          goalsAgainst: homeGoalsAgainst
        },
        away: {
          played: awayMatches.length,
          won: awayWins,
          drawn: awayDraws,
          lost: awayLosses,
          points: awayPoints,
          goalsFor: awayGoalsFor,
          goalsAgainst: awayGoalsAgainst
        }
      },
      totals: {
        points: totalPoints,
        won: homeWins + awayWins,
        drawn: homeDraws + awayDraws,
        lost: homeLosses + awayLosses,
        goalsFor: homeGoalsFor + awayGoalsFor,
        goalsAgainst: homeGoalsAgainst + awayGoalsAgainst,
        goalDifference:
          homeGoalsFor + awayGoalsFor - (homeGoalsAgainst + awayGoalsAgainst),
      },
    };
  }

  /**
   * Análise de dificuldade da tabela restante
   */
  async getDifficultyAnalysis(teamId: number) {
    const team = await this.teamRepository.findOneBy({ id: teamId });
    if (!team) {
      throw new NotFoundException('Time não encontrado');
    }

    const competitionTeams = await this.competitionTeamRepository.find({
      where: { team: { id: teamId } },
      relations: ['competition'],
    });

    const filteredCompetitionTeams = competitionTeams.filter(
      (ct) =>
        ct.competition.name.toLowerCase() !== 'mundial de clubes' &&
        ct.competition.is_active,
    );

    if (filteredCompetitionTeams.length === 0) {
      return {
        team: { id: team.id, name: team.name },
        analysis: [],
      };
    }

    const analysisResults = await Promise.all(
      filteredCompetitionTeams.map(async (ct) => {
        const competition = ct.competition;
        const standings = await this.getCompetitionStandings(competition.id);
        const teamStanding = standings.find((s) => s.team.id === teamId);

        // LÓGICA PARA PONTOS CORRIDOS
        if (competition.type === CompetitionType.PONTOS_CORRIDOS) {
          if (!teamStanding) return null;

          const remainingMatches = await this.matchRepository.find({
            where: [
              { competition: { id: competition.id }, home_team: { id: teamId }, status: MatchStatus.SCHEDULED },
              { competition: { id: competition.id }, away_team: { id: teamId }, status: MatchStatus.SCHEDULED },
            ],
            relations: ['home_team', 'away_team'],
          });

          if (remainingMatches.length === 0) return null;

          const opponentIds = remainingMatches.map((m) =>
            m.home_team.id === teamId ? m.away_team.id : m.home_team.id,
          );
          const opponentStandings = standings.filter((s) =>
            opponentIds.includes(s.team.id),
          );

          const totalOpponentPosition = opponentStandings.reduce(
            (sum, s) => sum + s.position,
            0,
          );
          const averageOpponentPosition =
            opponentStandings.length > 0
              ? totalOpponentPosition / opponentStandings.length
              : 0;

          const difficultyScore = Math.min(100, 100 - (averageOpponentPosition * 2.5));

          return {
            analysisType: 'round-robin',
            competition: { id: competition.id, name: competition.name },
            remainingMatches: remainingMatches.length,
            homeGames: remainingMatches.filter(m => m.home_team.id === teamId).length,
            awayGames: remainingMatches.filter(m => m.away_team.id === teamId).length,
            strongOpponents: opponentStandings.filter(s => s.position <= 4).length,
            difficultOpponents: opponentStandings.filter(s => s.position >= 5 && s.position <= 10).length,
            mediumOpponents: opponentStandings.filter(s => s.position >= 11 && s.position <= 16).length,
            weakOpponents: opponentStandings.filter(s => s.position >= standings.length - 3).length, // Z4
            averageOpponentPosition: Math.round(averageOpponentPosition * 10) / 10,
            difficultyScore: Math.round(difficultyScore),
            difficultyLevel: this.getDifficultyLevel(difficultyScore),
          };
        }
        
        // LÓGICA PARA MATA-MATA
        else {
          const nextMatch = await this.matchRepository.findOne({
            where: [
              { competition: { id: competition.id }, home_team: { id: teamId }, status: MatchStatus.SCHEDULED },
              { competition: { id: competition.id }, away_team: { id: teamId }, status: MatchStatus.SCHEDULED },
            ],
            relations: ['home_team', 'away_team', 'round'],
            order: { match_date: 'ASC' },
          });

          if (!nextMatch) return null;

          const opponent = nextMatch.home_team.id === teamId ? nextMatch.away_team : nextMatch.home_team;
          const isHome = nextMatch.home_team.id === teamId;

          let opponentPosition = 10; // Posição padrão
          let positionContext = 'na liga'; // Contexto padrão

          // Lógica para competições nacionais (ex: Copa do Brasil)
          if (competition.name.toLowerCase().includes('copa do brasil')) {
            const brasileiraoStandings = await this.getCompetitionStandings(1); // ID 1 = Brasileirão
            const opponentStandingInBrasileirao = brasileiraoStandings.find(s => s.team.id === opponent.id);
            if (opponentStandingInBrasileirao) {
              opponentPosition = opponentStandingInBrasileirao.position;
            }
            positionContext = 'no Brasileirão';
          } 
          // Lógica para competições internacionais (ex: Libertadores)
          else {
            const opponentStandingInGroup = standings.find(s => s.team.id === opponent.id);
            if (opponentStandingInGroup) {
              opponentPosition = opponentStandingInGroup.position;
            }
            positionContext = 'no grupo';
          }

          let difficultyScore = 110 - (opponentPosition * 5);
          difficultyScore += isHome ? -10 : 10;

          return {
            analysisType: 'knockout',
            competition: { id: competition.id, name: competition.name },
            roundName: nextMatch.round?.name || 'Próxima Fase',
            nextOpponent: {
              id: opponent.id,
              name: opponent.name,
              logo_url: opponent.logo_url,
              position: opponentPosition,
              positionContext,
            },
            isHome,
            difficultyScore: Math.round(Math.max(0, Math.min(100, difficultyScore))),
            difficultyLevel: this.getDifficultyLevel(difficultyScore),
          };
        }
      }),
    );

    return {
      team: {
        id: team.id,
        name: team.name,
      },
      analysis: analysisResults.filter(Boolean), // Filtra os resultados nulos
    };
  }

  /**
   * Compara dois times baseado na dificuldade das tabelas
   */
  async compareTeams(teamId: number, otherTeamId: number) {
    const [team1, team2] = await Promise.all([
      this.teamRepository.findOneBy({ id: teamId }),
      this.teamRepository.findOneBy({ id: otherTeamId })
    ]);

    if (!team1 || !team2) {
      throw new NotFoundException('Um ou ambos os times não foram encontrados');
    }

    // Obter análise de dificuldade para ambos os times
    const [analysis1, analysis2] = await Promise.all([
      this.getDifficultyAnalysis(teamId),
      this.getDifficultyAnalysis(otherTeamId)
    ]);

    // Calcular diferença de dificuldade
    const validAnalysis1 = analysis1.analysis?.filter(Boolean) || [];
    const avgDifficulty1 =
      validAnalysis1.reduce((sum, a) => sum + (a?.difficultyScore ?? 0), 0) /
      (validAnalysis1.length || 1) || 0;

    const validAnalysis2 = analysis2.analysis?.filter(Boolean) || [];
    const avgDifficulty2 =
      validAnalysis2.reduce((sum, a) => sum + (a?.difficultyScore ?? 0), 0) /
      (validAnalysis2.length || 1) || 0;

    const difficultyDifference = avgDifficulty1 - avgDifficulty2;
    const easierSchedule = difficultyDifference > 0 ? 'team2' : difficultyDifference < 0 ? 'team1' : 'equal';

    return {
      team1: {
        id: team1.id,
        name: team1.name,
        logo_url: team1.logo_url,
        averageDifficulty: Math.round(avgDifficulty1 * 100) / 100
      },
      team2: {
        id: team2.id,
        name: team2.name,
        logo_url: team2.logo_url,
        averageDifficulty: Math.round(avgDifficulty2 * 100) / 100
      },
      comparison: {
        difficultyDifference: Math.round(Math.abs(difficultyDifference) * 100) / 100,
        easierSchedule,
        advantage: easierSchedule === 'equal' ? 0 : Math.round(Math.abs(difficultyDifference) * 100) / 100,
        analysis: {
          team1: analysis1.analysis,
          team2: analysis2.analysis
        }
      }
    };
  }

  /**
   * Método auxiliar para classificar nível de dificuldade
   */
  private getDifficultyLevel(score: number): string {
    if (score <= 25) return 'Muito Fácil';
    if (score <= 45) return 'Fácil';
    if (score <= 65) return 'Moderado';
    if (score <= 85) return 'Difícil';
    return 'Muito Difícil';
  }

  /**
   * Método auxiliar para obter standings de uma competição
   */
  private async getCompetitionStandings(competitionId: number) {
    // Usar o StandingsService real para obter dados corretos
    return this.standingsService.getCompetitionStandings(competitionId);
  }

  // ===== MÉTODOS DE PROBABILIDADES E ESTATÍSTICAS AVANÇADAS =====

  /**
   * Calcula as chances de título de um time (com dados de simulação quando disponível)
   */
  async getTitleChances(teamId: number) {
    const team = await this.teamRepository.findOneBy({ id: teamId });
    if (!team) {
      throw new NotFoundException('Time não encontrado');
    }

    // 1. TENTAR BUSCAR DADOS DE SIMULAÇÃO PRIMEIRO (novo sistema)
    const simulationData = await this.getTeamSimulationData(teamId);
    if (simulationData) {
      return {
        team: {
          id: team.id,
          name: team.name,
          logo_url: team.logo_url,
        },
        simulation_based: true,
        execution_date: simulationData.execution_date,
        title_probability: simulationData.prediction.title_probability,
        current_position: simulationData.prediction.current_position,
        competition: simulationData.competition,
        analysis: {
          canWin: simulationData.prediction.title_probability > 0,
          likely: simulationData.prediction.title_probability > 20,
          favorite: simulationData.prediction.title_probability > 50,
        },
        advanced_stats: {
          top4_probability: simulationData.prediction.top4_probability,
          average_final_position: simulationData.prediction.average_final_position,
          average_final_points: simulationData.prediction.average_final_points,
        }
      };
    }

    // 2. FALLBACK: USAR SISTEMA ANTIGO (se não houver simulação)
    return this.getTitleChancesLegacy(teamId);
  }

  /**
   * Método legado para cálculo de chances de título (fallback)
   */
  private async getTitleChancesLegacy(teamId: number) {
    const team = await this.teamRepository.findOneBy({ id: teamId });
    if (!team) {
      throw new NotFoundException('Time não encontrado');
    }

    // Buscar competições ativas do time
    const competitionTeams = await this.competitionTeamRepository.find({
      where: { team: { id: teamId } },
      relations: ['competition']
    });

    const titleChances: Array<{
      competition: {
        id: number;
        name: string;
        type: CompetitionType;
      };
      currentPosition: number;
      currentPoints: number;
      pointsGap: number;
      gamesRemaining: number;
      titleChance: number;
      analysis: {
        canWin: boolean;
        needsHelp: boolean;
        criticalGames: boolean;
      };
    }> = [];

    for (const ct of competitionTeams) {
      const competition = ct.competition;
      
      // Só calcular para competições de pontos corridos
      if (competition.type !== CompetitionType.PONTOS_CORRIDOS) continue;

      const standings = await this.getCompetitionStandings(competition.id);
      const teamStanding = standings.find(s => s.team.id === teamId);
      
      if (!teamStanding) continue;

      // Calcular pontos necessários para título
      const currentLeader = standings[0];
      const pointsGap = currentLeader.points - teamStanding.points;
      
      // Calcular jogos restantes baseado no total de times e formato da competição
      const totalTeams = standings.length;
      let totalGames = 0;
      
      if (competition.type === CompetitionType.PONTOS_CORRIDOS) {
        // Para pontos corridos: (n-1) * 2 jogos (ida e volta)
        totalGames = (totalTeams - 1) * 2;
      } else {
        // Para outras competições, usar um valor padrão
        totalGames = 38;
      }
      
      const gamesRemaining = totalGames - teamStanding.played;
      
      // Calcular probabilidade baseada na posição e jogos restantes
      let titleChance = 0;
      
      if (teamStanding.position === 1) {
        titleChance = 85; // Líder tem alta chance
      } else if (teamStanding.position <= 3) {
        titleChance = Math.max(0, 70 - (teamStanding.position - 1) * 15);
      } else if (teamStanding.position <= 6) {
        titleChance = Math.max(0, 40 - (teamStanding.position - 3) * 10);
      } else if (teamStanding.position <= 10) {
        titleChance = Math.max(0, 20 - (teamStanding.position - 6) * 5);
      }

      // Ajustar baseado no gap de pontos
      if (pointsGap > 0) {
        titleChance = Math.max(0, titleChance - (pointsGap * 5));
      }

      // Ajustar baseado nos jogos restantes
      if (gamesRemaining < 10) {
        titleChance = Math.max(0, titleChance - 20);
      }

      titleChances.push({
        competition: {
          id: competition.id,
          name: competition.name,
          type: competition.type
        },
        currentPosition: teamStanding.position,
        currentPoints: teamStanding.points,
        pointsGap: pointsGap,
        gamesRemaining: gamesRemaining,
        titleChance: Math.min(100, Math.max(0, titleChance)),
        analysis: {
          canWin: titleChance > 30,
          needsHelp: pointsGap > 6,
          criticalGames: gamesRemaining <= 5
        }
      });
    }

    return {
      team: {
        id: team.id,
        name: team.name
      },
      titleChances
    };
  }

  /**
   * Calcula o risco de rebaixamento de um time (com dados de simulação quando disponível)
   */
  async getRelegationRisk(teamId: number) {
    const team = await this.teamRepository.findOneBy({ id: teamId });
    if (!team) {
      throw new NotFoundException('Time não encontrado');
    }

    // 1. TENTAR BUSCAR DADOS DE SIMULAÇÃO PRIMEIRO (novo sistema)
    const simulationData = await this.getTeamSimulationData(teamId);
    if (simulationData) {
      return {
        team: {
          id: team.id,
          name: team.name,
          logo_url: team.logo_url,
        },
        simulation_based: true,
        execution_date: simulationData.execution_date,
        relegation_probability: simulationData.prediction.relegation_probability,
        current_position: simulationData.prediction.current_position,
        competition: simulationData.competition,
        analysis: {
          inDanger: simulationData.prediction.relegation_probability > 10,
          highRisk: simulationData.prediction.relegation_probability > 30,
          criticalSituation: simulationData.prediction.relegation_probability > 50,
        },
        advanced_stats: {
          average_final_position: simulationData.prediction.average_final_position,
          average_final_points: simulationData.prediction.average_final_points,
          top6_probability: simulationData.prediction.top6_probability,
        }
      };
    }

    // 2. FALLBACK: USAR SISTEMA ANTIGO (se não houver simulação)
    return this.getRelegationRiskLegacy(teamId);
  }

  /**
   * Método legado para cálculo de risco de rebaixamento (fallback)
   */
  private async getRelegationRiskLegacy(teamId: number) {
    const team = await this.teamRepository.findOneBy({ id: teamId });
    if (!team) {
      throw new NotFoundException('Time não encontrado');
    }

    // Buscar competições ativas do time
    const competitionTeams = await this.competitionTeamRepository.find({
      where: { team: { id: teamId } },
      relations: ['competition']
    });

    const relegationRisks: Array<{
      competition: {
        id: number;
        name: string;
        type: CompetitionType;
      };
      currentPosition: number;
      currentPoints: number;
      pointsGap: number;
      gamesRemaining: number;
      relegationRisk: number;
      analysis: {
        inDanger: boolean;
        needsPoints: boolean;
        criticalPosition: boolean;
      };
    }> = [];

    for (const ct of competitionTeams) {
      const competition = ct.competition;
      
      // Só calcular para competições de pontos corridos
      if (competition.type !== CompetitionType.PONTOS_CORRIDOS) continue;

      const standings = await this.getCompetitionStandings(competition.id);
      const teamStanding = standings.find(s => s.team.id === teamId);
      
      if (!teamStanding) continue;

      // Calcular risco de rebaixamento
      const totalTeams = standings.length;
      // Para o Brasileirão: 4 times rebaixam (últimos 4)
      const relegationZone = competition.name.toLowerCase().includes('brasileirão') ? 4 : Math.ceil(totalTeams * 0.15);
      const currentPosition = teamStanding.position;
      
      let relegationRisk = 0;
      
      // LÓGICA COMPLETAMENTE REFATORADA
      if (currentPosition === 1) {
        // 1º lugar: risco zero
        relegationRisk = 0;
      } else if (currentPosition === 2) {
        // 2º lugar: risco muito baixo
        relegationRisk = 1;
      } else if (currentPosition === 3) {
        // 3º lugar: risco baixo
        relegationRisk = 2;
      } else if (currentPosition <= relegationZone) {
        // Já está na zona de rebaixamento
        relegationRisk = 85 + (relegationZone - currentPosition) * 5;
      } else if (currentPosition <= relegationZone + 3) {
        // Próximo da zona de rebaixamento
        relegationRisk = 40 + (relegationZone + 3 - currentPosition) * 10;
      } else if (currentPosition <= relegationZone + 6) {
        // Zona de atenção
        relegationRisk = 20 + (relegationZone + 6 - currentPosition) * 5;
      } else {
        // Zona de segurança
        relegationRisk = Math.max(0, 15 - (currentPosition - (relegationZone + 6)));
      }

      // Ajustar baseado nos pontos
      const lastSafePosition = standings[relegationZone - 1]; // -1 porque array é 0-based
      const pointsGap = lastSafePosition ? (lastSafePosition.points - teamStanding.points) : 0;
      
      if (pointsGap > 0) {
        // Time precisa de pontos para segurança
        relegationRisk += pointsGap * 3;
      } else if (pointsGap < 0) {
        // Time tem pontos de vantagem sobre a zona de rebaixamento
        // Reduzir o risco baseado na vantagem de pontos
        const pointsAdvantage = Math.abs(pointsGap);
        relegationRisk = Math.max(0, relegationRisk - (pointsAdvantage * 2));
      }

      // Ajustar baseado nos jogos restantes
      let totalGames = 0;
      
      if (competition.type === CompetitionType.PONTOS_CORRIDOS) {
        totalGames = (totalTeams - 1) * 2;
      } else {
        totalGames = 38;
      }
      
      const gamesRemaining = totalGames - teamStanding.played;
      if (gamesRemaining < 10) {
        relegationRisk += 15;
      }

      relegationRisk = Math.min(100, Math.max(0, relegationRisk));

      relegationRisks.push({
        competition: {
          id: competition.id,
          name: competition.name,
          type: competition.type
        },
        currentPosition: teamStanding.position,
        currentPoints: teamStanding.points,
        pointsGap: pointsGap,
        gamesRemaining: gamesRemaining,
        relegationRisk: Math.round(relegationRisk),
        analysis: {
          inDanger: relegationRisk > 60,
          needsPoints: pointsGap > 0,
          criticalPosition: currentPosition <= relegationZone + 2
        }
      });
    }

    return {
      team: {
        id: team.id,
        name: team.name
      },
      relegationRisks
    };
  }

  /**
   * Obtém estatísticas avançadas combinadas
   */
  async getAdvancedStats(teamId: number) {
    const [statistics, difficultyAnalysis, titleChances, relegationRisk] = await Promise.all([
      this.getTeamStatistics(teamId),
      this.getDifficultyAnalysis(teamId),
      this.getTitleChances(teamId),
      this.getRelegationRisk(teamId)
    ]);

    return {
      team: statistics.team,
      statistics,
      difficultyAnalysis,
      titleChances,
      relegationRisk
    };
  }

  /**
   * Busca dados de simulação para um time específico
   * Prioriza Brasileirão Série A, depois Série B
   */
  private async getTeamSimulationData(teamId: number): Promise<{
    execution_date: Date;
    prediction: any;
    competition: any;
  } | null> {
    // Verificar se o time participa das competições permitidas (Série A ou B)
    const competitions = [1, 2]; // IDs do Brasileirão Série A e B
    
    for (const competitionId of competitions) {
      // Verificar se o time participa desta competição
      const competitionTeam = await this.competitionTeamRepository.findOne({
        where: { 
          team: { id: teamId },
          competition: { id: competitionId }
        },
        relations: ['competition']
      });

      if (!competitionTeam) continue;

      // Buscar simulação mais recente desta competição
      const latestSimulation = await this.simulationRepository.findOne({
        where: {
          competition: { id: competitionId },
          is_latest: true,
        },
        relations: ['competition'],
      });

      if (!latestSimulation) continue;

      // Buscar previsão específica do time
      const teamPrediction = latestSimulation.getTeamPrediction(teamId);
      
      if (teamPrediction) {
        return {
          execution_date: latestSimulation.execution_date,
          prediction: teamPrediction,
          competition: {
            id: latestSimulation.competition.id,
            name: latestSimulation.competition.name,
          }
        };
      }
    }

    return null; // Nenhuma simulação encontrada
  }
} 