import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from '../../entities';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
  ) {}

  // Dados mock para testes quando banco não estiver disponível
  private getMockChannels(): Channel[] {
    return [
      {
        id: 1,
        name: 'SBT',
        logo: 'https://example.com/sbt.png',
        channel_number: '4',
        channel_link: 'https://www.sbt.com.br',
        type: 'tv',
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        name: 'ESPN Brasil',
        logo: 'https://example.com/espn.png',
        channel_number: '70',
        channel_link: 'https://www.espn.com.br',
        type: 'cable',
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 3,
        name: 'Prime Video',
        logo: 'https://example.com/prime.png',
        channel_number: null,
        channel_link: 'https://www.primevideo.com',
        type: 'streaming',
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      }
    ] as Channel[];
  }

  async findAll(): Promise<Channel[]> {
    try {
      return await this.channelRepository.find({
        order: { name: 'ASC' }
      });
    } catch (error) {
      console.log('⚠️ Banco não disponível, usando dados mock para channels');
      return this.getMockChannels();
    }
  }

  async findOne(id: number): Promise<Channel | null> {
    try {
      return await this.channelRepository.findOne({ where: { id } });
    } catch (error) {
      console.log('⚠️ Banco não disponível, usando dados mock para channel');
      const mockChannels = this.getMockChannels();
      return mockChannels.find(c => c.id === id) || null;
    }
  }

  async findByName(name: string): Promise<Channel | null> {
    try {
      return await this.channelRepository.findOne({ where: { name } });
    } catch (error) {
      console.log('⚠️ Banco não disponível, usando dados mock para channel');
      const mockChannels = this.getMockChannels();
      return mockChannels.find(c => c.name === name) || null;
    }
  }

  async create(channelData: Partial<Channel>): Promise<Channel> {
    try {
      const channel = this.channelRepository.create(channelData);
      return await this.channelRepository.save(channel);
    } catch (error) {
      console.log('⚠️ Banco não disponível, simulando criação de channel');
      return {
        id: Date.now(),
        name: channelData.name || 'Novo Canal',
        logo: channelData.logo || '',
        channel_number: channelData.channel_number || '',
        channel_link: channelData.channel_link || '',
        type: channelData.type || 'other',
        active: channelData.active ?? true,
        created_at: new Date(),
        updated_at: new Date(),
      } as Channel;
    }
  }

  async update(id: number, channelData: Partial<Channel>): Promise<Channel | null> {
    try {
      await this.channelRepository.update(id, channelData);
      return this.findOne(id);
    } catch (error) {
      console.log('⚠️ Banco não disponível, simulando atualização de channel');
      return this.findOne(id);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.channelRepository.delete(id);
    } catch (error) {
      console.log('⚠️ Banco não disponível, simulando remoção de channel');
    }
  }

  async findActive(): Promise<Channel[]> {
    try {
      return await this.channelRepository.find({
        where: { active: true },
        order: { name: 'ASC' }
      });
    } catch (error) {
      console.log('⚠️ Banco não disponível, usando dados mock para channels ativos');
      return this.getMockChannels().filter(c => c.active);
    }
  }

  async findByType(type: string): Promise<Channel[]> {
    try {
      return await this.channelRepository.find({
        where: { type },
        order: { name: 'ASC' }
      });
    } catch (error) {
      console.log('⚠️ Banco não disponível, usando dados mock para channels por tipo');
      return this.getMockChannels().filter(c => c.type === type);
    }
  }
} 