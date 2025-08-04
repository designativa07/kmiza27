import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Team } from '../../entities';
import * as bcrypt from 'bcrypt';

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

  async getAdminUsers(): Promise<User[]> {
    return this.userRepository.find({
      where: { is_admin: true },
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

  async createUser(phoneNumber: string, name?: string, origin: string = 'whatsapp'): Promise<User> {
    const user = this.userRepository.create({
      phone_number: phoneNumber,
      name: name || undefined,
      is_active: true,
      whatsapp_status: 'active',
      origin: origin,
      preferences: {
        notifications: true,
        language: 'pt-BR'
      }
    });

    return this.userRepository.save(user);
  }

  async createAdminUser(userData: {
    name: string;
    email?: string;
    phone_number?: string;
    password: string;
  }): Promise<User> {
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(userData.password, saltRounds);

    const adminUser = this.userRepository.create({
      name: userData.name,
      email: userData.email,
      phone_number: userData.phone_number,
      password_hash,
      is_admin: true,
      is_active: true,
      preferences: {
        notifications: true,
        language: 'pt-BR'
      }
    });

    return this.userRepository.save(adminUser);
  }

  async findOrCreateUser(phoneNumber: string, name?: string, origin: string = 'whatsapp'): Promise<User> {
    let user = await this.findByPhone(phoneNumber);
    
    if (!user) {
      console.log(`👤 Criando novo usuário: ${phoneNumber} (${name || 'Nome não informado'}) - Origem: ${origin}`);
      user = await this.createUser(phoneNumber, name, origin);
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

  async promoteToAdmin(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.findOne(id);
      if (!user) {
        return { success: false, message: 'Usuário não encontrado' };
      }

      if (user.is_admin) {
        return { success: false, message: 'Usuário já é administrador' };
      }

      await this.userRepository.update(id, { is_admin: true });
      return { success: true, message: 'Usuário promovido a administrador com sucesso' };
    } catch (error) {
      console.error('Erro ao promover usuário:', error);
      return { success: false, message: 'Erro ao promover usuário' };
    }
  }

  async demoteFromAdmin(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.findOne(id);
      if (!user) {
        return { success: false, message: 'Usuário não encontrado' };
      }

      if (!user.is_admin) {
        return { success: false, message: 'Usuário não é administrador' };
      }

      await this.userRepository.update(id, { is_admin: false });
      return { success: true, message: 'Privilégios de administrador removidos com sucesso' };
    } catch (error) {
      console.error('Erro ao remover privilégios de admin:', error);
      return { success: false, message: 'Erro ao remover privilégios de admin' };
    }
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

  async removeFavoriteTeam(phoneNumber: string): Promise<User | null> {
    const user = await this.findByPhone(phoneNumber);
    if (!user) return null;

    user.favorite_team = null;
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
    admins: number;
  }> {
    const { Not, IsNull, MoreThan } = require('typeorm');
    
    const total = await this.userRepository.count();
    const active = await this.userRepository.count({ where: { is_active: true } });
    const admins = await this.userRepository.count({ where: { is_admin: true } });
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

    return { total, active, withFavoriteTeam, recentInteractions, admins };
  }

  async getUserProfileStats(userId: number): Promise<any> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Estatísticas de bolões (mockado por enquanto, será implementado quando o módulo de pools estiver disponível)
      const poolStats = {
        pools_participated: 0,
        pools_won: 0,
        total_predictions: 0,
        exact_predictions: 0,
        total_points: 0
      };

      return {
        ...poolStats,
        amateur_competitions: 0, // Será implementado quando necessário
        whatsapp_conversations: 0, // Será implementado quando necessário
        game_sessions: 0, // Será implementado quando necessário
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas do perfil:', error);
      return {
        pools_participated: 0,
        pools_won: 0,
        total_predictions: 0,
        exact_predictions: 0,
        total_points: 0,
        amateur_competitions: 0,
        whatsapp_conversations: 0,
        game_sessions: 0,
      };
    }
  }

  async updateProfile(userId: number, updateData: any): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Campos que podem ser atualizados
      const allowedFields = ['name', 'email', 'preferences'];
      const updateFields: any = {};

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updateFields[field] = updateData[field];
        }
      }

      await this.userRepository.update(userId, updateFields);
      
      // Retornar usuário atualizado
      const updatedUser = await this.findOne(userId);
      if (!updatedUser) {
        throw new Error('Usuário não encontrado após atualização');
      }
      return updatedUser;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  }
} 