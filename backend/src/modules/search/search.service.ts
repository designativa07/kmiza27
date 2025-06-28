import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../../entities/team.entity';
import { Player } from '../../entities/player.entity';
import { Stadium } from '../../entities/stadium.entity';
import { Competition } from '../../entities/competition.entity';

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
  ) {}

  private async searchWithUnaccent(repository: Repository<any>, fields: string[], searchTerm: string, limit: number) {
    const queryBuilder = repository.createQueryBuilder('entity');
    const whereClauses = fields.map(field => `UNACCENT(entity.${field}) ILIKE UNACCENT(:searchTerm)`).join(' OR ');
    
    queryBuilder.where(whereClauses, { searchTerm: `%${searchTerm}%` }).take(limit);

    try {
      return await queryBuilder.getMany();
    } catch (error) {
      console.warn(`Falha ao usar UNACCENT em ${repository.metadata.tableName}. Fallback para LIKE. Erro: ${error.message}`);
      const fallbackQueryBuilder = repository.createQueryBuilder('entity');
      const fallbackWhereClauses = fields.map(field => `LOWER(entity.${field}) LIKE LOWER(:searchTerm)`).join(' OR ');
      fallbackQueryBuilder.where(fallbackWhereClauses, { searchTerm: `%${searchTerm}%` }).take(limit);
      return await fallbackQueryBuilder.getMany();
    }
  }

  async searchAll(query: string, limit: number = 5) {
    if (!query || query.trim().length < 2) {
      return { teams: [], players: [], stadiums: [], competitions: [] };
    }

    const searchTerm = query.trim();

    const [teams, players, stadiums, competitions] = await Promise.all([
      this.searchWithUnaccent(this.teamsRepository, ['name', 'short_name'], searchTerm, limit),
      this.searchWithUnaccent(this.playersRepository, ['name', 'position'], searchTerm, limit),
      this.searchWithUnaccent(this.stadiumsRepository, ['name', 'city', 'state'], searchTerm, limit),
      this.searchWithUnaccent(this.competitionsRepository, ['name'], searchTerm, limit),
    ]);

    return { teams, players, stadiums, competitions };
  }
} 