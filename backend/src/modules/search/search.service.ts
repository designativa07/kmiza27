import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Team } from '../../entities/team.entity';
import { Player } from '../../entities/player.entity';
import { Stadium } from '../../entities/stadium.entity';
import { Competition } from '../../entities/competition.entity';
import { Channel } from '../../entities/channel.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
    @InjectRepository(Player)
    private playersRepository: Repository<Player>,
    @InjectRepository(Stadium)
    private stadiumsRepository: Repository<Stadium>,
    @InjectRepository(Competition)
    private competitionsRepository: Repository<Competition>,
    @InjectRepository(Channel)
    private channelsRepository: Repository<Channel>,
  ) {}

  private async searchWithUnaccent(repository: Repository<any>, fields: string[], searchTerm: string, limit: number) {
    try {
      // Primeiro, tentar com UNACCENT se disponível
      const queryBuilder = repository.createQueryBuilder('entity');
      const whereClauses = fields.map(field => `UNACCENT(entity.${field}) ILIKE UNACCENT(:searchTerm)`).join(' OR ');
      
      queryBuilder.where(whereClauses, { searchTerm: `%${searchTerm}%` }).take(limit);
      
      return await queryBuilder.getMany();
    } catch (error) {
      console.warn(`Falha ao usar UNACCENT em ${repository.metadata.tableName}. Fallback para LIKE. Erro: ${error.message}`);
      
      // Fallback: usar LIKE simples
      const fallbackQueryBuilder = repository.createQueryBuilder('entity');
      const fallbackWhereClauses = fields.map(field => `LOWER(entity.${field}) LIKE LOWER(:searchTerm)`).join(' OR ');
      fallbackQueryBuilder.where(fallbackWhereClauses, { searchTerm: `%${searchTerm}%` }).take(limit);
      
      return await fallbackQueryBuilder.getMany();
    }
  }

  async searchAll(query: string, limit: number = 5) {
    if (!query || query.trim().length < 2) {
      return { teams: [], players: [], stadiums: [], competitions: [], channels: [] };
    }

    const searchTerm = query.trim();

    try {
      const [teams, players, stadiums, competitions, channels] = await Promise.all([
        this.searchWithUnaccent(this.teamsRepository, ['name', 'short_name'], searchTerm, limit),
        this.searchWithUnaccent(this.playersRepository, ['name', 'position'], searchTerm, limit),
        this.searchWithUnaccent(this.stadiumsRepository, ['name', 'city', 'state'], searchTerm, limit),
        this.searchWithUnaccent(this.competitionsRepository, ['name'], searchTerm, limit),
        this.searchWithUnaccent(this.channelsRepository, ['name'], searchTerm, limit), // Removido 'description'
      ]);

      return { teams, players, stadiums, competitions, channels };
    } catch (error) {
      console.error('❌ Erro na busca:', error);
      return { teams: [], players: [], stadiums: [], competitions: [], channels: [] };
    }
  }
} 