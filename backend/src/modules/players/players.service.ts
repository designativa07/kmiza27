import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Not } from 'typeorm';
import { Player } from '../../entities/player.entity';
import { PlayerTeamHistory } from '../../entities/player-team-history.entity';
import { Team } from '../../entities/team.entity';
import { Match } from '../../entities/match.entity';
import { Goal } from '../../entities/goal.entity';
import { Card } from '../../entities/card.entity';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private playersRepository: Repository<Player>,
    @InjectRepository(PlayerTeamHistory)
    private playerTeamHistoryRepository: Repository<PlayerTeamHistory>,
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
    @InjectRepository(Goal)
    private goalsRepository: Repository<Goal>,
    @InjectRepository(Card)
    private cardsRepository: Repository<Card>,
  ) {}

  async createPlayer(playerData: Partial<Player>): Promise<Player> {
    const newPlayer = this.playersRepository.create(playerData);
    return this.playersRepository.save(newPlayer);
  }

  async findAllPlayers(): Promise<Player[]> {
    return this.playersRepository.find({
      relations: ['team_history', 'team_history.team'],
    });
  }

  async findPlayerById(id: number): Promise<Player> {
    const player = await this.playersRepository.findOne({
      where: { id },
      relations: ['team_history', 'team_history.team'],
    });
    if (!player) {
      throw new NotFoundException(`Jogador com ID "${id}" não encontrado`);
    }
    return player;
  }

  async updatePlayer(id: number, playerData: Partial<Player>): Promise<Player> {
    const player = await this.findPlayerById(id);
    this.playersRepository.merge(player, playerData);
    return this.playersRepository.save(player);
  }

  async deletePlayer(id: number): Promise<void> {
    await this.playersRepository.delete(id);
  }

  async addPlayerToTeam(playerId: number, teamId: number, startDate: Date, jerseyNumber?: string, role?: string): Promise<PlayerTeamHistory> {
    const player = await this.playersRepository.findOneBy({ id: playerId });
    const team = await this.teamsRepository.findOneBy({ id: teamId });

    if (!player) throw new NotFoundException(`Jogador com ID "${playerId}" não encontrado`);
    if (!team) throw new NotFoundException(`Time com ID "${teamId}" não encontrado`);

    // Verificar se o jogador já está em um time e não tem data de fim
    const currentAssignment = await this.playerTeamHistoryRepository.findOne({
      where: { player_id: playerId, end_date: IsNull() },
    });

    if (currentAssignment) {
      // Se já estiver em um time, encerrar o vínculo anterior
      currentAssignment.end_date = new Date(); // Data de hoje
      await this.playerTeamHistoryRepository.save(currentAssignment);
    }

    const historyEntry = this.playerTeamHistoryRepository.create({
      player_id: playerId,
      team_id: teamId,
      start_date: startDate,
      jersey_number: jerseyNumber,
      role: role,
    });
    return this.playerTeamHistoryRepository.save(historyEntry);
  }

  async removePlayerFromTeam(playerId: number, teamId: number, endDate: Date = new Date()): Promise<PlayerTeamHistory> {
    const assignment = await this.playerTeamHistoryRepository.findOne({
      where: { player_id: playerId, team_id: teamId, end_date: IsNull() },
    });

    if (!assignment) {
      throw new NotFoundException(`Vínculo ativo entre jogador ${playerId} e time ${teamId} não encontrado.`);
    }

    assignment.end_date = endDate;
    return this.playerTeamHistoryRepository.save(assignment);
  }

  async getPlayerCurrentTeam(playerId: number): Promise<Team | null> {
    const historyEntry = await this.playerTeamHistoryRepository.findOne({
      where: { player_id: playerId, end_date: IsNull() },
      relations: ['team'],
    });
    return historyEntry ? historyEntry.team : null;
  }

  async getTeamPlayers(teamId: number): Promise<PlayerTeamHistory[]> {
    return this.playerTeamHistoryRepository.find({
      where: { team_id: teamId, end_date: IsNull() },
      relations: ['player'],
    });
  }

  async addGoal(matchId: number, playerId: number, teamId: number, minute: number, type: string = 'normal'): Promise<Goal> {
    const match = await this.matchesRepository.findOneBy({ id: matchId });
    const player = await this.playersRepository.findOneBy({ id: playerId });
    const team = await this.teamsRepository.findOneBy({ id: teamId });

    if (!match) throw new NotFoundException(`Partida com ID "${matchId}" não encontrada`);
    if (!player) throw new NotFoundException(`Jogador com ID "${playerId}" não encontrado`);
    if (!team) throw new NotFoundException(`Time com ID "${teamId}" não encontrado`);

    const newGoal = this.goalsRepository.create({
      match_id: matchId,
      player_id: playerId,
      team_id: teamId,
      minute,
      type,
    });
    return this.goalsRepository.save(newGoal);
  }

  async addCard(matchId: number, playerId: number, type: 'yellow' | 'red', minute: number, reason?: string): Promise<Card> {
    const match = await this.matchesRepository.findOneBy({ id: matchId });
    const player = await this.playersRepository.findOneBy({ id: playerId });

    if (!match) throw new NotFoundException(`Partida com ID "${matchId}" não encontrada`);
    if (!player) throw new NotFoundException(`Jogador com ID "${playerId}" não encontrado`);

    const newCard = this.cardsRepository.create({
      match_id: matchId,
      player_id: playerId,
      type,
      minute,
      reason,
    });
    return this.cardsRepository.save(newCard);
  }

  async getMatchGoals(matchId: number): Promise<Goal[]> {
    return this.goalsRepository.find({
      where: { match_id: matchId },
      relations: ['player', 'team'],
    });
  }

  async getMatchCards(matchId: number): Promise<Card[]> {
    return this.cardsRepository.find({
      where: { match_id: matchId },
      relations: ['player'],
    });
  }
} 