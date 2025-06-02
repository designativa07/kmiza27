import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team, Match, CompetitionTeam } from '../../entities';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(CompetitionTeam)
    private competitionTeamRepository: Repository<CompetitionTeam>,
  ) {}

  async findAll(): Promise<Team[]> {
    return this.teamRepository.find();
  }

  async findOne(id: number): Promise<Team | null> {
    return this.teamRepository.findOne({ where: { id } });
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

    // Se chegou até aqui, pode excluir
    await this.teamRepository.delete(id);
  }
} 