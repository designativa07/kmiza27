import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Round } from '../../entities/round.entity';
import { Competition } from '../../entities/competition.entity';

export interface CreateRoundDto {
  competition_id: number;
  name: string;
  round_number?: number;
  phase?: string;
  display_order?: number;
  start_date?: Date;
  end_date?: Date;
  is_current?: boolean;
}

export interface UpdateRoundDto {
  name?: string;
  round_number?: number;
  phase?: string;
  display_order?: number;
  start_date?: Date;
  end_date?: Date;
  is_current?: boolean;
}

export interface RoundWithSuggestions {
  id: number;
  name: string;
  round_number?: number;
  phase?: string;
  display_order: number;
  start_date?: Date;
  end_date?: Date;
  is_current: boolean;
  suggestions?: string[];
}

@Injectable()
export class RoundsService {
  constructor(
    @InjectRepository(Round)
    private roundRepository: Repository<Round>,
    @InjectRepository(Competition)
    private competitionRepository: Repository<Competition>,
  ) {}

  async findByCompetition(competitionId: number): Promise<Round[]> {
    return this.roundRepository.find({
      where: { competition: { id: competitionId } },
      relations: ['competition'],
      order: { display_order: 'ASC', round_number: 'ASC' }
    });
  }

  async findOne(id: number): Promise<Round> {
    const round = await this.roundRepository.findOne({
      where: { id },
      relations: ['competition'],
    });

    if (!round) {
      throw new NotFoundException(`Rodada com ID ${id} não encontrada`);
    }

    return round;
  }

  async create(createRoundDto: CreateRoundDto): Promise<Round> {
    const { competition_id, ...roundData } = createRoundDto;

    // Verificar se a competição existe
    const competition = await this.competitionRepository.findOne({
      where: { id: competition_id }
    });

    if (!competition) {
      throw new NotFoundException(`Competição com ID ${competition_id} não encontrada`);
    }

    // Se display_order não foi fornecido, usar o próximo disponível
    if (!roundData.display_order) {
      const maxOrder = await this.roundRepository
        .createQueryBuilder('round')
        .where('round.competition_id = :competitionId', { competitionId: competition_id })
        .select('MAX(round.display_order)', 'max')
        .getRawOne();
      
      roundData.display_order = (maxOrder?.max || 0) + 1;
    }

    const round = this.roundRepository.create({
      ...roundData,
      competition,
    });

    return this.roundRepository.save(round);
  }

  async update(id: number, updateRoundDto: UpdateRoundDto): Promise<Round> {
    const round = await this.findOne(id);

    Object.assign(round, updateRoundDto);

    return this.roundRepository.save(round);
  }

  async remove(id: number): Promise<void> {
    const round = await this.findOne(id);
    await this.roundRepository.remove(round);
  }

  async reorder(competitionId: number, roundIds: number[]): Promise<Round[]> {
    const rounds = await this.findByCompetition(competitionId);
    
    // Validar se todos os IDs pertencem à competição
    const validIds = rounds.map(r => r.id);
    const invalidIds = roundIds.filter(id => !validIds.includes(id));
    
    if (invalidIds.length > 0) {
      throw new NotFoundException(`Rodadas não encontradas: ${invalidIds.join(', ')}`);
    }

    // Atualizar display_order baseado na nova ordem
    const updates = roundIds.map((id, index) => ({
      id,
      display_order: index + 1
    }));

    await Promise.all(
      updates.map(update => 
        this.roundRepository.update(update.id, { display_order: update.display_order })
      )
    );

    return this.findByCompetition(competitionId);
  }

  async getSuggestions(competitionId: number): Promise<string[]> {
    const competition = await this.competitionRepository.findOne({
      where: { id: competitionId }
    });

    if (!competition) {
      throw new NotFoundException(`Competição com ID ${competitionId} não encontrada`);
    }

    // Sugestões baseadas no tipo de competição
    const suggestions: Record<string, string[]> = {
      'pontos_corridos': [
        'Rodada 1', 'Rodada 2', 'Rodada 3', 'Rodada 4', 'Rodada 5',
        '1º Turno', '2º Turno', 'Turno Único'
      ],
      'mata_mata': [
        'Oitavas de Final', 'Quartas de Final', 'Semifinal', 'Final',
        'Decisão do 3º Lugar', 'Repescagem'
      ],
      'grupos_e_mata_mata': [
        'Rodada 1', 'Rodada 2', 'Rodada 3', 'Rodada 4', 'Rodada 5', 
        'Rodada 6', 'Rodada 7', 'Rodada 8', 'Rodada 9', 'Rodada 10',
        'Oitavas de Final', 'Quartas de Final', 'Semifinal', 'Final'
      ],
      'copa': [
        'Rodada 1', 'Rodada 2', 'Rodada 3', 'Rodada 4', 'Rodada 5', 
        'Rodada 6', 'Rodada 7', 'Rodada 8', 'Rodada 9', 'Rodada 10',
        'Oitavas de Final', 'Quartas de Final', 'Semifinal', 'Final'
      ],
      'serie': [
        'Rodada 1', 'Rodada 2', 'Rodada 3', 'Rodada 4', 'Rodada 5',
        'Rodada 6', 'Rodada 7', 'Rodada 8', 'Rodada 9', 'Rodada 10',
        'Rodada 11', 'Rodada 12', 'Rodada 13', 'Rodada 14', 'Rodada 15',
        'Rodada 16', 'Rodada 17', 'Rodada 18', 'Rodada 19',
        'Quadrangular - Rodada 1', 'Quadrangular - Rodada 2', 'Quadrangular - Rodada 3',
        'Quadrangular - Rodada 4', 'Quadrangular - Rodada 5', 'Quadrangular - Rodada 6'
      ]
    };

    return suggestions[competition.type] || suggestions['pontos_corridos'];
  }

  async getWithSuggestions(competitionId: number): Promise<RoundWithSuggestions[]> {
    const rounds = await this.findByCompetition(competitionId);
    const suggestions = await this.getSuggestions(competitionId);

    return rounds.map(round => ({
      ...round,
      suggestions
    }));
  }
} 