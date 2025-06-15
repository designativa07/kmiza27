import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Competition, CompetitionTeam, Team, Player, Goal } from '../../entities';
import { AddTeamsToCompetitionDto } from './dto/add-teams.dto';

interface TopScorer {
  player: Player;
  team: Team;
  goals: number;
}

@Injectable()
export class CompetitionsService {
  constructor(
    @InjectRepository(Competition)
    private competitionRepository: Repository<Competition>,
    @InjectRepository(CompetitionTeam)
    private competitionTeamRepository: Repository<CompetitionTeam>,
    @InjectRepository(Goal)
    private goalRepository: Repository<Goal>,
  ) {}

  async findAll(): Promise<Competition[]> {
    return this.competitionRepository.find({
      order: { name: 'ASC' }
    });
  }

  async findOne(id: number): Promise<Competition | null> {
    return this.competitionRepository.findOne({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Competition | null> {
    return this.competitionRepository.findOne({ where: { slug } });
  }

  async create(competitionData: Partial<Competition>): Promise<Competition> {
    const competition = this.competitionRepository.create(competitionData);
    return this.competitionRepository.save(competition);
  }

  async update(id: number, competitionData: Partial<Competition>): Promise<Competition | null> {
    await this.competitionRepository.update(id, competitionData);
    return this.findOne(id);
  }

  async addTeams(competitionId: number, addTeamsDto: AddTeamsToCompetitionDto): Promise<CompetitionTeam[]> {
    const competition = await this.findOne(competitionId);
    if (!competition) {
      throw new Error('Competition not found');
    }

    const competitionTeams: CompetitionTeam[] = [];
    
    for (const teamId of addTeamsDto.team_ids) {
      // Verificar se o time já está na competição
      const existingEntry = await this.competitionTeamRepository.findOne({
        where: { 
          competition: { id: competitionId },
          team: { id: teamId }
        }
      });

      if (!existingEntry) {
        const competitionTeam = this.competitionTeamRepository.create({
          competition: { id: competitionId },
          team: { id: teamId },
          group_name: addTeamsDto.group_name
        });
        
        const saved = await this.competitionTeamRepository.save(competitionTeam);
        competitionTeams.push(saved);
      }
    }

    return competitionTeams;
  }

  async getTeams(competitionId: number): Promise<CompetitionTeam[]> {
    return this.competitionTeamRepository.find({
      where: { competition: { id: competitionId } },
      relations: ['team', 'competition'],
      order: { group_name: 'ASC', points: 'DESC' }
    });
  }

  async removeTeam(competitionId: number, competitionTeamId: number): Promise<void> {
    await this.competitionTeamRepository.delete({
      id: competitionTeamId,
      competition: { id: competitionId }
    });
  }

  async remove(id: number): Promise<void> {
    await this.competitionRepository.delete(id);
  }

  async getTopScorers(competitionId: number): Promise<TopScorer[]> {
    const qb = this.goalRepository.createQueryBuilder('goal')
      .innerJoin('goal.player', 'player')
      .innerJoin('goal.team', 'team')
      .innerJoin('goal.match', 'match')
      .where('match.competition_id = :competitionId', { competitionId })
      .andWhere("goal.type != 'own_goal'") // Não contar gols contra
      .select([
        'player.id as "playerId"',
        'player.name as "playerName"',
        'player.position as "playerPosition"',
        'team.id as "teamId"',
        'team.name as "teamName"',
        'team.logo_url as "teamLogo"',
        'COUNT(goal.id) as "totalGoals"'
      ])
      .groupBy(
        'player.id, player.name, player.position, team.id, team.name, team.logo_url'
      )
      .orderBy('"totalGoals"', 'DESC')
      .limit(20);
      
    const rawResults = await qb.getRawMany();

    return rawResults.map(res => ({
      player: {
        id: res.playerId,
        name: res.playerName,
        position: res.playerPosition
      } as Player,
      team: {
        id: res.teamId,
        name: res.teamName,
        logo_url: res.teamLogo
      } as Team,
      goals: parseInt(res.totalGoals, 10),
    }));
  }
} 