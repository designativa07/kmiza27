import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { Title } from '../../entities/title.entity';
import { Team } from '../../entities/team.entity';

export interface PaginatedTitlesResult {
  data: Title[];
  total: number;
}

@Injectable()
export class TitlesService {
  constructor(
    @InjectRepository(Title)
    private titleRepository: Repository<Title>,
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    teamId?: number,
  ): Promise<PaginatedTitlesResult> {
    const skip = (page - 1) * limit;
    
    const queryBuilder = this.titleRepository
      .createQueryBuilder('title')
      .leftJoinAndSelect('title.team', 'team')
      .orderBy('title.display_order', 'ASC')
      .addOrderBy('title.year', 'DESC')
      .addOrderBy('title.name', 'ASC');

    if (search) {
      queryBuilder.where(
        'LOWER(title.name) LIKE LOWER(:search) OR LOWER(title.competition_name) LIKE LOWER(:search)',
        { search: `%${search}%` }
      );
    }

    if (teamId) {
      queryBuilder.andWhere('title.team_id = :teamId', { teamId });
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: number): Promise<Title> {
    const title = await this.titleRepository.findOne({
      where: { id },
      relations: ['team'],
    });

    if (!title) {
      throw new NotFoundException('Título não encontrado');
    }

    return title;
  }

  async findByTeam(teamId: number): Promise<Title[]> {
    const titles = await this.titleRepository.find({
      where: { team_id: teamId, is_active: true },
      order: {
        display_order: 'ASC',
        year: 'DESC',
        name: 'ASC',
      },
    });

    return titles;
  }

  async create(titleData: Partial<Title>): Promise<Title> {
    // Verificar se o time existe
    if (titleData.team_id) {
      const team = await this.teamRepository.findOne({
        where: { id: titleData.team_id },
      });

      if (!team) {
        throw new BadRequestException('Time não encontrado');
      }
    }

    // Definir ordem de exibição se não fornecida
    if (!titleData.display_order) {
      const lastTitle = await this.titleRepository.findOne({
        where: { team_id: titleData.team_id },
        order: { display_order: 'DESC' },
      });
      titleData.display_order = lastTitle ? lastTitle.display_order + 1 : 1;
    }

    const title = this.titleRepository.create(titleData);
    return await this.titleRepository.save(title);
  }

  async update(id: number, titleData: Partial<Title>): Promise<Title> {
    const title = await this.findOne(id);

    // Verificar se o time existe se estiver sendo alterado
    if (titleData.team_id && titleData.team_id !== title.team_id) {
      const team = await this.teamRepository.findOne({
        where: { id: titleData.team_id },
      });

      if (!team) {
        throw new BadRequestException('Time não encontrado');
      }
    }

    Object.assign(title, titleData);
    return await this.titleRepository.save(title);
  }

  async remove(id: number): Promise<void> {
    const title = await this.findOne(id);
    await this.titleRepository.remove(title);
  }

  async updateDisplayOrder(titles: { id: number; display_order: number }[]): Promise<void> {
    for (const title of titles) {
      await this.titleRepository.update(title.id, {
        display_order: title.display_order,
      });
    }
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    byCategory: { [key: string]: number };
    byType: { [key: string]: number };
    recentTitles: any[];
  }> {
    const [total, active, allTitles] = await Promise.all([
      this.titleRepository.count(),
      this.titleRepository.count({ where: { is_active: true } }),
      this.titleRepository.find({
        relations: ['team'],
        order: { created_at: 'DESC' },
        take: 5
      })
    ]);

    // Estatísticas por categoria
    const byCategory = await this.titleRepository
      .createQueryBuilder('title')
      .select('title.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('title.category IS NOT NULL')
      .groupBy('title.category')
      .getRawMany();

    // Estatísticas por tipo
    const byType = await this.titleRepository
      .createQueryBuilder('title')
      .select('title.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('title.type IS NOT NULL')
      .groupBy('title.type')
      .getRawMany();

    // Converter para objeto
    const categoryStats = byCategory.reduce((acc, item) => {
      acc[item.category] = parseInt(item.count);
      return acc;
    }, {} as { [key: string]: number });

    const typeStats = byType.reduce((acc, item) => {
      acc[item.type] = parseInt(item.count);
      return acc;
    }, {} as { [key: string]: number });

    return {
      total,
      active,
      byCategory: categoryStats,
      byType: typeStats,
      recentTitles: allTitles
    };
  }
} 