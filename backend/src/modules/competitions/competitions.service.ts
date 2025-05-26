import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Competition, CompetitionTeam, Team } from '../../entities';
import { AddTeamsToCompetitionDto } from './dto/add-teams.dto';

@Injectable()
export class CompetitionsService {
  constructor(
    @InjectRepository(Competition)
    private competitionRepository: Repository<Competition>,
    @InjectRepository(CompetitionTeam)
    private competitionTeamRepository: Repository<CompetitionTeam>,
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
} 