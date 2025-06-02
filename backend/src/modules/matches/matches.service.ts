import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match, Round, MatchBroadcast, Channel } from '../../entities';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(Round)
    private roundRepository: Repository<Round>,
    @InjectRepository(MatchBroadcast)
    private matchBroadcastRepository: Repository<MatchBroadcast>,
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
  ) {}

  async create(createMatchDto: CreateMatchDto): Promise<Match> {
    // Se round_id não foi fornecido mas temos informações para criar uma rodada
    if (!createMatchDto.round_id && createMatchDto.round_name && createMatchDto.competition_id) {
      const roundName = createMatchDto.round_name;
      
      // Verificar se a rodada já existe para esta competição
      let existingRound = await this.roundRepository.findOne({
        where: {
          name: roundName,
          competition: { id: createMatchDto.competition_id }
        }
      });

      if (!existingRound) {
        // Criar nova rodada
        console.log(`🆕 Criando nova rodada: ${roundName} para competição ${createMatchDto.competition_id}`);
        
        // Extrair número da rodada se possível
        const roundNumberMatch = roundName.match(/(\d+)/);
        const roundNumber = roundNumberMatch ? parseInt(roundNumberMatch[1]) : undefined;
        
        const newRound = this.roundRepository.create({
          name: roundName,
          round_number: roundNumber,
          competition: { id: createMatchDto.competition_id }
        });
        
        existingRound = await this.roundRepository.save(newRound);
        console.log(`✅ Rodada criada com ID: ${existingRound.id}`);
      }
      
      // Usar a rodada encontrada ou criada
      if (existingRound) {
        createMatchDto.round_id = existingRound.id;
      }
    }

    // Converter o DTO para o formato correto para o TypeORM
    const matchData: any = {
      match_date: new Date(createMatchDto.match_date),
      status: createMatchDto.status || 'scheduled',
      group_name: createMatchDto.group_name,
      phase: createMatchDto.phase,
      home_score: createMatchDto.home_score,
      away_score: createMatchDto.away_score,
      home_score_penalties: createMatchDto.home_score_penalties,
      away_score_penalties: createMatchDto.away_score_penalties,
      attendance: createMatchDto.attendance,
      referee: createMatchDto.referee,
      broadcast_channels: createMatchDto.broadcast_channels,
      streaming_links: createMatchDto.streaming_links,
      highlights_url: createMatchDto.highlights_url,
      match_stats: createMatchDto.match_stats,
    };

    // Relacionamentos
    if (createMatchDto.home_team_id) {
      matchData.home_team = { id: createMatchDto.home_team_id };
    }
    if (createMatchDto.away_team_id) {
      matchData.away_team = { id: createMatchDto.away_team_id };
    }
    if (createMatchDto.competition_id) {
      matchData.competition = { id: createMatchDto.competition_id };
    }
    if (createMatchDto.round_id) {
      matchData.round = { id: createMatchDto.round_id };
    }
    if (createMatchDto.stadium_id) {
      matchData.stadium = { id: createMatchDto.stadium_id };
    }

    const match = this.matchRepository.create(matchData);
    const savedMatch = await this.matchRepository.save(match);
    const finalMatch = savedMatch[0] || savedMatch;

    // Gerenciar transmissões usando a nova tabela match_broadcasts
    if (createMatchDto.channel_ids && createMatchDto.channel_ids.length > 0) {
      await this.updateMatchBroadcasts(finalMatch.id, createMatchDto.channel_ids);
    }

    return finalMatch;
  }

  async findAll(): Promise<Match[]> {
    console.log('🔍 MatchesService.findAll - Buscando todos os matches...');
    
    const matches = await this.matchRepository.find({
      relations: ['home_team', 'away_team', 'competition', 'stadium', 'round'],
      order: {
        match_date: 'ASC', // Ordenar por data, mais próximos primeiro
        id: 'ASC' // Em caso de empate na data, ordenar por ID
      }
    });
    
    console.log(`✅ MatchesService.findAll - ${matches.length} matches encontrados`);
    return matches;
  }

  async findOne(id: number): Promise<Match | null> {
    return this.matchRepository.findOne({ 
      where: { id },
      relations: ['home_team', 'away_team', 'competition', 'stadium', 'round', 'broadcasts', 'broadcasts.channel']
    });
  }

  async update(id: number, updateMatchDto: UpdateMatchDto): Promise<Match | null> {
    try {
      console.log('🔍 MatchesService.update - Atualizando match:', { id, updateMatchDto });
      
      // Converter o DTO para o formato correto para o TypeORM
      const updateData: any = {};
      
      // Campos diretos
      if (updateMatchDto.match_date !== undefined) {
        updateData.match_date = new Date(updateMatchDto.match_date);
      }
      if (updateMatchDto.status !== undefined) {
        updateData.status = updateMatchDto.status;
      }
      if (updateMatchDto.home_score !== undefined) {
        updateData.home_score = updateMatchDto.home_score;
      }
      if (updateMatchDto.away_score !== undefined) {
        updateData.away_score = updateMatchDto.away_score;
      }
      if (updateMatchDto.home_score_penalties !== undefined) {
        updateData.home_score_penalties = updateMatchDto.home_score_penalties;
      }
      if (updateMatchDto.away_score_penalties !== undefined) {
        updateData.away_score_penalties = updateMatchDto.away_score_penalties;
      }
      if (updateMatchDto.attendance !== undefined) {
        updateData.attendance = updateMatchDto.attendance;
      }
      if (updateMatchDto.referee !== undefined) {
        updateData.referee = updateMatchDto.referee;
      }
      if (updateMatchDto.broadcast_channels !== undefined) {
        updateData.broadcast_channels = updateMatchDto.broadcast_channels;
      }
      if (updateMatchDto.streaming_links !== undefined) {
        updateData.streaming_links = updateMatchDto.streaming_links;
      }
      if (updateMatchDto.highlights_url !== undefined) {
        updateData.highlights_url = updateMatchDto.highlights_url;
      }
      if (updateMatchDto.match_stats !== undefined) {
        updateData.match_stats = updateMatchDto.match_stats;
      }
      if (updateMatchDto.group_name !== undefined) {
        updateData.group_name = updateMatchDto.group_name;
      }
      if (updateMatchDto.phase !== undefined) {
        updateData.phase = updateMatchDto.phase;
      }
      
      // Relacionamentos - usar os nomes das colunas de foreign key
      if (updateMatchDto.home_team_id !== undefined) {
        updateData.home_team = { id: updateMatchDto.home_team_id };
      }
      if (updateMatchDto.away_team_id !== undefined) {
        updateData.away_team = { id: updateMatchDto.away_team_id };
      }
      if (updateMatchDto.competition_id !== undefined) {
        updateData.competition = { id: updateMatchDto.competition_id };
      }
      if (updateMatchDto.round_id !== undefined) {
        updateData.round = { id: updateMatchDto.round_id };
      }
      if (updateMatchDto.stadium_id !== undefined) {
        updateData.stadium = { id: updateMatchDto.stadium_id };
      }
      
      console.log('🔍 MatchesService.update - Dados processados:', updateData);
      
      await this.matchRepository.save({ id, ...updateData });

      // Gerenciar transmissões usando a nova tabela match_broadcasts
      if (updateMatchDto.channel_ids !== undefined) {
        await this.updateMatchBroadcasts(id, updateMatchDto.channel_ids || []);
      }

      const updatedMatch = await this.findOne(id);
      console.log('✅ MatchesService.update - Match atualizado:', updatedMatch);
      return updatedMatch;
    } catch (error) {
      console.error('❌ MatchesService.update - Erro:', error);
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    await this.matchRepository.delete(id);
  }

  private async updateMatchBroadcasts(matchId: number, channelIds: number[]): Promise<void> {
    console.log('🔄 Iniciando atualização de transmissões...', { matchId, channelIds });

    try {
      // Remove todas as transmissões existentes para este jogo
      console.log('🗑️ Removendo transmissões existentes...');
      const deleteResult = await this.matchBroadcastRepository.delete({ match_id: matchId });
      console.log('✅ Transmissões removidas:', deleteResult);

      // Adiciona as novas transmissões
      if (channelIds && channelIds.length > 0) {
        console.log('📝 Preparando novas transmissões...');
        
        // Verificar se todos os canais existem
        const channels = await this.channelRepository.findByIds(channelIds);
        if (channels.length !== channelIds.length) {
          const foundIds = channels.map(c => c.id);
          const missingIds = channelIds.filter(id => !foundIds.includes(id));
          throw new Error(`Canais não encontrados: ${missingIds.join(', ')}`);
        }

        const broadcasts = channelIds.map(channelId => ({
          match_id: matchId,
          channel_id: channelId
        }));

        console.log('💾 Salvando novas transmissões:', broadcasts);
        const insertResult = await this.matchBroadcastRepository.insert(broadcasts);
        console.log('✅ Novas transmissões salvas:', insertResult);
      } else {
        console.log('ℹ️ Nenhum canal para adicionar');
      }

      // Verificar se as transmissões foram salvas corretamente
      const savedBroadcasts = await this.matchBroadcastRepository.find({
        where: { match_id: matchId },
        relations: ['channel']
      });
      console.log('✅ Transmissões atualizadas com sucesso:', savedBroadcasts);

    } catch (error) {
      console.error('❌ Erro ao atualizar transmissões:', error);
      throw error;
    }
  }
} 