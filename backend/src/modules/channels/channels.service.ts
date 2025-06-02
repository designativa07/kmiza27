import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from '../../entities/channel.entity';

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);

  constructor(
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>
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
    return this.channelRepository.find({
      order: {
        type: 'ASC',
        name: 'ASC'
      }
    });
  }

  async findOne(id: number): Promise<Channel> {
    const channel = await this.channelRepository.findOne({
      where: { id }
    });

    if (!channel) {
      throw new BadRequestException('Canal não encontrado');
    }

    return channel;
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
    this.logger.log('Iniciando criação de canal...');
    this.logger.debug('Dados recebidos:', channelData);

    // Validações
    if (!channelData.name?.trim()) {
      this.logger.error('Nome do canal é obrigatório');
      throw new BadRequestException('Nome do canal é obrigatório');
    }

    if (!channelData.type?.trim()) {
      this.logger.error('Tipo do canal é obrigatório');
      throw new BadRequestException('Tipo do canal é obrigatório');
    }

    // Verificar se já existe um canal com este nome
    const existingChannel = await this.channelRepository.findOne({
      where: { name: channelData.name.trim() }
    });

    if (existingChannel) {
      this.logger.error(`Canal com nome "${channelData.name}" já existe`);
      throw new BadRequestException('Já existe um canal com este nome');
    }

    // Criar novo canal
    const channel = this.channelRepository.create({
      name: channelData.name.trim(),
      logo: channelData.logo?.trim(),
      channel_number: channelData.channel_number?.trim(),
      channel_link: channelData.channel_link?.trim(),
      type: channelData.type.trim(),
      active: channelData.active ?? true
    });

    this.logger.debug('Canal preparado para salvar:', channel);

    // Salvar no banco
    try {
      const savedChannel = await this.channelRepository.save(channel);
      this.logger.log(`Canal "${savedChannel.name}" criado com sucesso`);
      return savedChannel;
    } catch (error) {
      this.logger.error('Erro ao salvar canal no banco:', error);
      throw new BadRequestException('Erro ao criar canal: ' + error.message);
    }
  }

  async update(id: number, channelData: Partial<Channel>): Promise<Channel> {
    this.logger.log(`Iniciando atualização do canal ${id}...`);
    this.logger.debug('Dados recebidos:', channelData);

    // Verificar se o canal existe
    const existingChannel = await this.findOne(id);

    if (!existingChannel) {
      this.logger.error(`Canal ${id} não encontrado`);
      throw new BadRequestException('Canal não encontrado');
    }

    // Validações
    if (channelData.name && !channelData.name.trim()) {
      this.logger.error('Nome do canal não pode ser vazio');
      throw new BadRequestException('Nome do canal não pode ser vazio');
    }

    if (channelData.type && !channelData.type.trim()) {
      this.logger.error('Tipo do canal não pode ser vazio');
      throw new BadRequestException('Tipo do canal não pode ser vazio');
    }

    // Verificar se o novo nome já existe (se estiver alterando o nome)
    if (channelData.name && channelData.name !== existingChannel.name) {
      const channelWithSameName = await this.channelRepository.findOne({
        where: { name: channelData.name.trim() }
      });

      if (channelWithSameName) {
        this.logger.error(`Já existe um canal com o nome "${channelData.name}"`);
        throw new BadRequestException('Já existe um canal com este nome');
      }
    }

    // Atualizar dados
    const updatedChannel = {
      ...existingChannel,
      ...channelData,
      name: channelData.name?.trim() || existingChannel.name,
      logo: channelData.logo?.trim(),
      channel_number: channelData.channel_number?.trim(),
      channel_link: channelData.channel_link?.trim(),
      type: channelData.type?.trim() || existingChannel.type
    };

    this.logger.debug('Canal preparado para atualizar:', updatedChannel);

    // Salvar no banco
    try {
      const savedChannel = await this.channelRepository.save(updatedChannel);
      this.logger.log(`Canal "${savedChannel.name}" atualizado com sucesso`);
      return savedChannel;
    } catch (error) {
      this.logger.error('Erro ao atualizar canal no banco:', error);
      throw new BadRequestException('Erro ao atualizar canal: ' + error.message);
    }
  }

  async delete(id: number): Promise<void> {
    const channel = await this.findOne(id);

    if (!channel) {
      throw new BadRequestException('Canal não encontrado');
    }

    try {
      await this.channelRepository.remove(channel);
    } catch (error) {
      throw new BadRequestException('Erro ao excluir canal: ' + error.message);
    }
  }

  async findActive(): Promise<Channel[]> {
    return this.channelRepository.find({
      where: { active: true },
      order: {
        type: 'ASC',
        name: 'ASC'
      }
    });
  }

  async findByType(type: string): Promise<Channel[]> {
    return this.channelRepository.find({
      where: { type },
      order: { name: 'ASC' }
    });
  }
} 