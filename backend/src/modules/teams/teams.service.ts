import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Like, FindManyOptions } from 'typeorm';
import { Team, Match, CompetitionTeam, Player, PlayerTeamHistory } from '../../entities';

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
        `(UNACCENT(team.name) ILIKE UNACCENT(:searchTerm) OR 
         UNACCENT(team.short_name) ILIKE UNACCENT(:searchTerm) OR
         UNACCENT(team.city) ILIKE UNACCENT(:searchTerm) OR
         UNACCENT(team.state) ILIKE UNACCENT(:searchTerm))`
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
} 