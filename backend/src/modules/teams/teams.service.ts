import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Team, Match, CompetitionTeam, Player, PlayerTeamHistory } from '../../entities';

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

  async findAll(): Promise<Team[]> {
    return this.teamRepository.find({
      relations: ['stadium'],
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
    const team = this.teamRepository.create(teamData);
    return this.teamRepository.save(team);
  }

  async update(id: number, teamData: Partial<Team>): Promise<Team | null> {
    await this.teamRepository.update(id, teamData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    // Verificar se o time existe
    const team = await this.findOne(id);
    if (!team) {
      throw new BadRequestException('Time não encontrado');
    }

    // Verificar se o time está sendo usado em partidas
    const matchesAsHome = await this.matchRepository.count({
      where: { home_team: { id } }
    });
    
    const matchesAsAway = await this.matchRepository.count({
      where: { away_team: { id } }
    });

    if (matchesAsHome > 0 || matchesAsAway > 0) {
      throw new BadRequestException(
        `Não é possível excluir o time "${team.name}" pois ele possui ${matchesAsHome + matchesAsAway} partida(s) cadastrada(s). Remova as partidas primeiro.`
      );
    }

    // Verificar se o time está em competições
    const competitionTeams = await this.competitionTeamRepository.count({
      where: { team: { id } }
    });

    if (competitionTeams > 0) {
      throw new BadRequestException(
        `Não é possível excluir o time "${team.name}" pois ele está participando de ${competitionTeams} competição(ões). Remova o time das competições primeiro.`
      );
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
} 