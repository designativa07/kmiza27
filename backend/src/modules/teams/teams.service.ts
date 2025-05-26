import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../../entities';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
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
    await this.teamRepository.delete(id);
  }
} 