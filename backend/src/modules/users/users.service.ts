import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Team } from '../../entities';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['favorite_team'],
      order: { created_at: 'DESC' }
    });
  }

  async findOne(id: number): Promise<User | null> {
    return this.userRepository.findOne({ 
      where: { id },
      relations: ['favorite_team']
    });
  }

  async findByPhone(phoneNumber: string): Promise<User | null> {
    return this.userRepository.findOne({ 
      where: { phone_number: phoneNumber },
      relations: ['favorite_team']
    });
  }

  async createUser(phoneNumber: string, name?: string): Promise<User> {
    const user = this.userRepository.create({
      phone_number: phoneNumber,
      name: name || undefined,
      is_active: true,
      whatsapp_status: 'active',
      preferences: {
        notifications: true,
        language: 'pt-BR'
      }
    });

    return this.userRepository.save(user);
  }

  async findOrCreateUser(phoneNumber: string, name?: string): Promise<User> {
    let user = await this.findByPhone(phoneNumber);
    
    if (!user) {
      console.log(`👤 Criando novo usuário: ${phoneNumber} (${name || 'Nome não informado'})`);
      user = await this.createUser(phoneNumber, name);
    } else {
      // Atualizar nome se foi fornecido e não existe
      if (name && !user.name) {
        user.name = name;
        user = await this.userRepository.save(user);
        console.log(`👤 Nome atualizado para usuário ${phoneNumber}: ${name}`);
      }
    }

    return user;
  }

  async updateUser(id: number, updateData: Partial<User>): Promise<User | null> {
    await this.userRepository.update(id, updateData);
    return this.findOne(id);
  }

  async deleteUser(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.findOne(id);
      if (!user) {
        return { success: false, message: 'Usuário não encontrado' };
      }

      await this.userRepository.delete(id);
      return { success: true, message: 'Usuário excluído com sucesso' };
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      return { success: false, message: 'Erro ao excluir usuário' };
    }
  }

  async setFavoriteTeam(phoneNumber: string, teamSlug: string): Promise<User | null> {
    const user = await this.findByPhone(phoneNumber);
    if (!user) return null;

    const team = await this.teamRepository.findOne({ where: { slug: teamSlug } });
    if (!team) return null;

    user.favorite_team = team;
    return this.userRepository.save(user);
  }

  async updateLastInteraction(phoneNumber: string): Promise<void> {
    await this.userRepository.update(
      { phone_number: phoneNumber },
      { updated_at: new Date() }
    );
  }

  async getUserStats(): Promise<{
    total: number;
    active: number;
    withFavoriteTeam: number;
    recentInteractions: number;
  }> {
    const { Not, IsNull, MoreThan } = require('typeorm');
    
    const total = await this.userRepository.count();
    const active = await this.userRepository.count({ where: { is_active: true } });
    const withFavoriteTeam = await this.userRepository
      .createQueryBuilder('user')
      .where('user.favorite_team_id IS NOT NULL')
      .getCount();
    
    // Usuários que interagiram nas últimas 24 horas
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const recentInteractions = await this.userRepository.count({
      where: { updated_at: MoreThan(yesterday) }
    });

    return { total, active, withFavoriteTeam, recentInteractions };
  }
} 