import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Not, FindManyOptions, Like } from 'typeorm';
import { Player } from '../../entities/player.entity';
import { PlayerTeamHistory } from '../../entities/player-team-history.entity';
import { Team } from '../../entities/team.entity';
import { Match } from '../../entities/match.entity';
import { Goal } from '../../entities/goal.entity';
import { Card } from '../../entities/card.entity';

export interface PaginatedPlayersResult {
  data: Player[];
  total: number;
}

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

  async testConnection(): Promise<number> {
    try {
      const count = await this.playersRepository.count();
      return count;
    } catch (error) {
      console.error('❌ PlayersService: Erro ao testar conexão:', error);
      throw error;
    }
  }

  async createPlayer(playerData: Partial<Player>): Promise<Player> {
    const newPlayer = this.playersRepository.create(playerData);
    return this.playersRepository.save(newPlayer);
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    search?: string,
  ): Promise<PaginatedPlayersResult> {
    try {
      console.log('🔍 PlayersService.findAll: Iniciando busca...');
      
      // Usar método mais simples sem relações
      const [data, total] = await this.playersRepository.findAndCount({
        select: ['id', 'name', 'position', 'nationality', 'state', 'date_of_birth', 'image_url'],
        order: { name: 'ASC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      
      console.log(`✅ PlayersService.findAll: ${total} jogadores encontrados`);
      return { data, total };
    } catch (error) {
      console.error('❌ PlayersService.findAll: Erro:', error);
      throw error;
    }
  }

  async searchPlayersByName(searchTerm: string): Promise<Player[]> {
    try {
      console.log(`🔍 PlayersService: Buscando jogadores com nome: "${searchTerm}"`);
      const search = `%${searchTerm.trim()}%`;
      
      const players = await this.playersRepository
        .createQueryBuilder('player')
        .where('LOWER(player.name) LIKE LOWER(:search)', { search })
        .orderBy('player.name', 'ASC')
        .getMany();
      
      console.log(`✅ PlayersService: ${players.length} jogadores encontrados para "${searchTerm}"`);
      return players;
    } catch (error) {
      console.error(`❌ PlayersService: Erro ao buscar jogadores por nome "${searchTerm}":`, error);
      return [];
    }
  }

  async findPlayerById(id: number): Promise<Player> {
    const player = await this.playersRepository.findOne({
      where: { id },
      relations: ['team_history', 'team_history.team', 'goals', 'cards'],
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

  async getPlayerCurrentTeam(playerId: number): Promise<Team | null> {
    const historyEntry = await this.playerTeamHistoryRepository.findOne({
      where: { player_id: playerId, end_date: IsNull() },
      relations: ['team'],
    });
    return historyEntry ? historyEntry.team : null;
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