import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match, Round, MatchBroadcast, Channel, Competition, Team, Stadium, Player } from '../../entities';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { MatchStatus, MatchLeg } from '../../entities/match.entity';
import { v4 as uuidv4 } from 'uuid';
import { CreateTwoLegTieDto } from './dto/create-two-leg-tie.dto';

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
    @InjectRepository(Competition)
    private competitionRepository: Repository<Competition>,
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
    @InjectRepository(Stadium)
    private stadiumRepository: Repository<Stadium>,
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
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
      status: createMatchDto.status || MatchStatus.SCHEDULED,
      group_name: createMatchDto.group_name,
      phase: createMatchDto.phase,
      home_score: createMatchDto.home_score,
      away_score: createMatchDto.away_score,
      home_score_penalties: createMatchDto.home_score_penalties,
      away_score_penalties: createMatchDto.away_score_penalties,
      attendance: createMatchDto.attendance,
      referee: createMatchDto.referee,
      broadcast_channels: createMatchDto.broadcast_channels,
      highlights_url: createMatchDto.highlights_url,
      match_stats: createMatchDto.match_stats,
      leg: createMatchDto.leg || MatchLeg.SINGLE_MATCH,
      tie_id: createMatchDto.tie_id === '' ? null : createMatchDto.tie_id,
      home_aggregate_score: createMatchDto.home_aggregate_score,
      away_aggregate_score: createMatchDto.away_aggregate_score,
      qualified_team_id: createMatchDto.qualified_team_id,
      home_team_player_stats: createMatchDto.home_team_player_stats,
      away_team_player_stats: createMatchDto.away_team_player_stats,
    };

    // Se for o primeiro jogo de um confronto e não tiver um tie_id, gerar um novo
    if (matchData.leg === MatchLeg.FIRST_LEG && !matchData.tie_id) {
      matchData.tie_id = uuidv4();
    }

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

  async createTwoLegTie(createTwoLegTieDto: CreateTwoLegTieDto): Promise<Match[]> {
    const queryRunner = this.matchRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tieId = uuidv4();
      const { 
        home_team_id, 
        away_team_id, 
        competition_id, 
        round_id, 
        round_name, 
        group_name, 
        phase, 
        match_date_first_leg, 
        stadium_id_first_leg, 
        match_date_second_leg, 
        stadium_id_second_leg, 
        status, 
        channel_ids, 
        broadcast_channels 
      } = createTwoLegTieDto;

      // Buscar entidades completas
      const homeTeam = await this.teamRepository.findOneBy({ id: home_team_id });
      const awayTeam = await this.teamRepository.findOneBy({ id: away_team_id });
      const competition = await this.competitionRepository.findOneBy({ id: competition_id });
      const stadiumFirstLeg = stadium_id_first_leg ? await this.stadiumRepository.findOneBy({ id: stadium_id_first_leg }) : null;
      const stadiumSecondLeg = stadium_id_second_leg ? await this.stadiumRepository.findOneBy({ id: stadium_id_second_leg }) : null;

      if (!homeTeam || !awayTeam || !competition) {
        throw new Error('Times ou competição não encontrados.');
      }

      // Encontrar ou criar a rodada
      let existingRound: Round | null = null;
      if (!round_id && round_name && competition_id) {
        existingRound = await queryRunner.manager.findOne(Round, {
          where: {
            name: round_name,
            competition: { id: competition_id }
          }
        });

        if (!existingRound) {
          const roundNumberMatch = round_name.match(/(\d+)/);
          const roundNumber = roundNumberMatch ? parseInt(roundNumberMatch[1]) : undefined;
          
          const newRound = queryRunner.manager.create(Round, {
            name: round_name,
            round_number: roundNumber,
            competition: competition
          });
          existingRound = await queryRunner.manager.save(newRound);
        }
      }
      const finalRound = round_id ? await this.roundRepository.findOneBy({ id: round_id }) : existingRound;

      // Criar partida de ida
      const firstLegMatchData: Partial<Match> = {
        home_team: homeTeam,
        away_team: awayTeam,
        competition: competition,
        round: finalRound || undefined,
        group_name: group_name,
        phase: phase,
        match_date: new Date(match_date_first_leg),
        status: status || MatchStatus.SCHEDULED,
        leg: MatchLeg.FIRST_LEG,
        tie_id: tieId,
        stadium: stadiumFirstLeg || undefined,
        broadcast_channels: broadcast_channels,
      };
      const firstLeg = queryRunner.manager.create(Match, firstLegMatchData);
      const savedFirstLeg = await queryRunner.manager.save(firstLeg);

      // Gerenciar transmissões para a partida de ida
      if (channel_ids && channel_ids.length > 0) {
        await this.updateMatchBroadcasts(savedFirstLeg.id, channel_ids);
      }

      // Criar partida de volta
      const secondLegMatchData: Partial<Match> = {
        home_team: awayTeam,
        away_team: homeTeam,
        competition: competition,
        round: finalRound || undefined,
        group_name: group_name,
        phase: phase,
        match_date: new Date(match_date_second_leg),
        status: status || MatchStatus.SCHEDULED,
        leg: MatchLeg.SECOND_LEG,
        tie_id: tieId,
        stadium: stadiumSecondLeg || undefined,
        broadcast_channels: broadcast_channels,
      };
      const secondLeg = queryRunner.manager.create(Match, secondLegMatchData);
      const savedSecondLeg = await queryRunner.manager.save(secondLeg);

      // Gerenciar transmissões para a partida de volta
      if (channel_ids && channel_ids.length > 0) {
        await this.updateMatchBroadcasts(savedSecondLeg.id, channel_ids);
      }

      await queryRunner.commitTransaction();
      return [savedFirstLeg, savedSecondLeg];
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error('❌ Erro ao criar confronto de ida e volta:', err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(page: number = 1, limit: number = 20): Promise<{ data: Match[], total: number }> {
    const [data, total] = await this.matchRepository.findAndCount({
      relations: ['home_team', 'away_team', 'competition', 'round', 'stadium', 'broadcasts.channel'],
      order: {
        match_date: 'DESC'
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findOne(id: number): Promise<Match | null> {
    return this.matchRepository.findOne({
      where: { id },
      relations: ['home_team', 'away_team', 'competition', 'round', 'stadium', 'broadcasts.channel'],
    });
  }

  async findByCompetitionId(competitionId: number): Promise<Match[]> {
    return this.matchRepository.find({
      where: { competition: { id: competitionId } },
      relations: ['home_team', 'away_team', 'competition', 'round', 'stadium', 'broadcasts.channel'],
      order: { match_date: 'ASC' }, // Opcional: ordenar por data da partida
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
      if (updateMatchDto.leg !== undefined) {
        updateData.leg = updateMatchDto.leg;
      }
      if (updateMatchDto.tie_id !== undefined) {
        updateData.tie_id = updateMatchDto.tie_id === '' ? null : updateMatchDto.tie_id;
      }
      if (updateMatchDto.home_aggregate_score !== undefined) {
        updateData.home_aggregate_score = updateMatchDto.home_aggregate_score;
      }
      if (updateMatchDto.away_aggregate_score !== undefined) {
        updateData.away_aggregate_score = updateMatchDto.away_aggregate_score;
      }
      if (updateMatchDto.qualified_team_id !== undefined) {
        updateData.qualified_team_id = updateMatchDto.qualified_team_id;
      }
      if (updateMatchDto.home_team_player_stats !== undefined) {
        updateData.home_team_player_stats = updateMatchDto.home_team_player_stats;
      }
      if (updateMatchDto.away_team_player_stats !== undefined) {
        updateData.away_team_player_stats = updateMatchDto.away_team_player_stats;
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
        updateData.stadium = updateMatchDto.stadium_id === null ? null : { id: updateMatchDto.stadium_id };
      }
      
      console.log('🔍 MatchesService.update - Dados processados:', updateData);
      
      const updatedMatch = await this.matchRepository.save({ id, ...updateData });

      // Gerenciar transmissões usando a nova tabela match_broadcasts
      if (updateMatchDto.channel_ids !== undefined) {
        await this.updateMatchBroadcasts(id, updateMatchDto.channel_ids || []);
      }

      // Se o status da partida for finalizado, e a competição for de mata-mata, calcular e atualizar o placar agregado
      const fullMatch = await this.matchRepository.findOne({ 
        where: { id },
        relations: ['competition']
      });

      if (fullMatch && fullMatch.status === MatchStatus.FINISHED && 
          (fullMatch.competition.type === 'mata_mata' || fullMatch.competition.type === 'grupos_e_mata_mata' || fullMatch.competition.type === 'copa')) {
        await this._handleMatchOutcome(fullMatch);
      }

      const finalMatch = await this.findOne(id);
      console.log('✅ MatchesService.update - Match atualizado:', finalMatch);
      return finalMatch;
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

  private async _handleMatchOutcome(match: Match): Promise<void> {
    console.log(`處理比賽結果: ${match.id}`);

    // Carregar a competição completa para verificar o tipo
    const competition = await this.competitionRepository.findOne({ where: { id: match.competition.id } });
    if (!competition || (competition.type !== 'mata_mata' && competition.type !== 'grupos_e_mata_mata' && competition.type !== 'copa')) {
        console.log('ℹ️ Não é uma competição de mata-mata ou copa, ignorando cálculo de placar agregado/classificado.');
        return;
    }

    let qualifiedTeamId: number | null = null;

    // Se for um jogo único, o time classificado é o vencedor do jogo
    if (match.leg === MatchLeg.SINGLE_MATCH) {
        console.log('🔍 _handleMatchOutcome - Tipo de jogo: Único.');
        if (match.home_score !== null && match.away_score !== null) {
            console.log(`🔍 _handleMatchOutcome - Placar do jogo único: ${match.home_score}x${match.away_score}`);
            if (match.home_score > match.away_score) {
                qualifiedTeamId = match.home_team?.id || null;
            } else if (match.away_score > match.home_score) {
                qualifiedTeamId = match.away_team?.id || null;
            }
            // Se houver empate em jogo único, mas tiver pênaltis, verifica os pênaltis
            else if (match.home_score_penalties !== null && match.away_score_penalties !== null) {
                console.log(`🔍 _handleMatchOutcome - Placar pênaltis: ${match.home_score_penalties}x${match.away_score_penalties}`);
                if (match.home_score_penalties > match.away_score_penalties) {
                    qualifiedTeamId = match.home_team?.id || null;
                } else if (match.away_score_penalties > match.home_score_penalties) {
                    qualifiedTeamId = match.away_team?.id || null;
                }
            }
        }
        if (qualifiedTeamId !== null) {
            match.qualified_team_id = qualifiedTeamId;
            await this.matchRepository.save(match);
            console.log(`✅ Time classificado para jogo único ${match.id}: ${qualifiedTeamId}`);
        } else {
            console.log(`⚠️ Jogo único ${match.id} empatado sem vencedor definido (sem pênaltis ou placar nulo).`);
            // Se for um empate e não houver pênaltis, qualifiedTeamId permanece null
            match.qualified_team_id = null; // Garante que é null se não houver vencedor
            await this.matchRepository.save(match);
        }
        return;
    }

    // Para jogos de ida e volta (FIRST_LEG ou SECOND_LEG)
    console.log('🔍 _handleMatchOutcome - Tipo de jogo: Ida/Volta.');
    if (!match.tie_id) {
        console.log('⚠️ Partida de ida/volta sem tie_id. Não é possível calcular o placar agregado.');
        return;
    }

    console.log(`🔍 _handleMatchOutcome - Buscando partidas para o confronto (tie_id: ${match.tie_id})...`);
    const tieMatches = await this.matchRepository.find({
        where: { tie_id: match.tie_id },
        relations: ['home_team', 'away_team'], // Certificar que times são carregados
        order: { match_date: 'ASC' }
    });
    console.log(`🔍 _handleMatchOutcome - Partidas do confronto encontradas (${tieMatches.length}):`, tieMatches.map(m => ({ id: m.id, leg: m.leg, status: m.status, home_score: m.home_score, away_score: m.away_score, home_team_id: m.home_team?.id, away_team_id: m.away_team?.id })));


    if (tieMatches.length !== 2) {
        console.log(`⚠️ Confronto ${match.tie_id} não possui 2 partidas (encontrado ${tieMatches.length}). Não é possível calcular o placar agregado.`);
        return;
    }

    const firstLeg = tieMatches.find(m => m.leg === MatchLeg.FIRST_LEG);
    const secondLeg = tieMatches.find(m => m.leg === MatchLeg.SECOND_LEG);

    if (!firstLeg || !secondLeg) {
        console.log(`⚠️ Uma ou ambas as partidas de ida/volta do confronto ${match.tie_id} não foram encontradas. Não é possível calcular o placar agregado.`);
        return;
    }

    console.log('🔍 _handleMatchOutcome - Detalhes First Leg:', firstLeg ? { id: firstLeg.id, status: firstLeg.status, home_score: firstLeg.home_score, away_score: firstLeg.away_score, home_team: firstLeg.home_team?.name, away_team: firstLeg.away_team?.name } : 'Nulo');
    console.log('🔍 _handleMatchOutcome - Detalhes Second Leg:', secondLeg ? { id: secondLeg.id, status: secondLeg.status, home_score: secondLeg.home_score, away_score: secondLeg.away_score, home_team: secondLeg.home_team?.name, away_team: secondLeg.away_team?.name } : 'Nulo');


    if (firstLeg.status !== MatchStatus.FINISHED || secondLeg.status !== MatchStatus.FINISHED) {
        console.log(`⚠️ Ambas as partidas do confronto ${match.tie_id} precisam estar FINALIZADAS para calcular o placar agregado. Status da Ida: ${firstLeg.status}, Status da Volta: ${secondLeg.status}`);
        return;
    }

    // Calcular placar agregado
    // Precisamos identificar qual time é qual no confronto. Usamos o time da casa da primeira partida como 'Time A'
    // e o time visitante da primeira partida como 'Time B'.

    const teamAId = firstLeg.home_team?.id;
    const teamBId = firstLeg.away_team?.id;

    let teamAScore = 0;
    let teamBScore = 0;
    let teamAAwayGoals = 0; // Gols do Time A quando jogou fora de casa
    let teamBAwayGoals = 0; // Gols do Time B quando jogou fora de casa

    // Adicionar placares do primeiro jogo
    if (firstLeg.home_team?.id === teamAId) { // Time A foi mandante na ida
        teamAScore += firstLeg.home_score || 0;
        teamBScore += firstLeg.away_score || 0;
        teamBAwayGoals += firstLeg.away_score || 0; // Gols do Time B fora de casa (na ida)
    } else { // Time B foi mandante na ida (cenário improvável se firstLeg.home_team é o time A)
        // Isso não deve acontecer se firstLeg é o jogo de ida e o home_team do firstLeg é o teamAId
        console.error("Lógica inconsistente: firstLeg.home_team.id não corresponde ao teamAId.");
        return;
    }

    // Adicionar placares do segundo jogo
    if (secondLeg.home_team?.id === teamAId) { // Time A foi mandante na volta
        teamAScore += secondLeg.home_score || 0;
        teamBScore += secondLeg.away_score || 0;
        teamBAwayGoals += secondLeg.away_score || 0; // Gols do Time B fora de casa (na volta)
    } else if (secondLeg.home_team?.id === teamBId) { // Time B foi mandante na volta
        teamBScore += secondLeg.home_score || 0;
        teamAScore += secondLeg.away_score || 0;
        teamAAwayGoals += secondLeg.away_score || 0; // Gols do Time A fora de casa (na volta)
    } else {
        console.error("Erro na identificação dos times na segunda partida.");
        return;
    }

    console.log(`🔍 _handleMatchOutcome - Placar Agregado (${firstLeg.home_team?.name} vs ${firstLeg.away_team?.name}):`);
    console.log(`   ${firstLeg.home_team?.name} (Total): ${teamAScore}`);
    console.log(`   ${firstLeg.away_team?.name} (Total): ${teamBScore}`);
    console.log(`   ${firstLeg.home_team?.name} (Gols Fora): ${teamAAwayGoals}`);
    console.log(`   ${firstLeg.away_team?.name} (Gols Fora): ${teamBAwayGoals}`);

    if (teamAScore > teamBScore) {
        qualifiedTeamId = teamAId;
    } else if (teamBScore > teamAScore) {
        qualifiedTeamId = teamBId;
    } else {
        // Empate no placar agregado, aplica regra de gol fora
        if (teamAAwayGoals > teamBAwayGoals) {
            qualifiedTeamId = teamAId;
        } else if (teamBAwayGoals > teamAAwayGoals) {
            qualifiedTeamId = teamBId;
        } else {
            // Empate no placar agregado e gols fora, verifica pênaltis no segundo jogo
            if (secondLeg.home_score_penalties !== null && secondLeg.away_score_penalties !== null) {
                console.log(`🔍 _handleMatchOutcome - Placar pênaltis agregado: ${secondLeg.home_score_penalties}x${secondLeg.away_score_penalties}`);
                // Determinar qual time venceu nos pênaltis baseado no segundo jogo
                if (secondLeg.home_team?.id === teamAId) { // Time A foi mandante na volta
                    if (secondLeg.home_score_penalties > secondLeg.away_score_penalties) {
                        qualifiedTeamId = teamAId;
                    } else if (secondLeg.away_score_penalties > secondLeg.home_score_penalties) {
                        qualifiedTeamId = teamBId;
                    }
                } else if (secondLeg.home_team?.id === teamBId) { // Time B foi mandante na volta
                    if (secondLeg.home_score_penalties > secondLeg.away_score_penalties) {
                        qualifiedTeamId = teamBId;
                    } else if (secondLeg.away_score_penalties > secondLeg.home_score_penalties) {
                        qualifiedTeamId = teamAId;
                    }
                }
            } else {
              console.log(`⚠️ Confronto ${match.tie_id} empatado sem informação de pênaltis. Não é possível determinar o classificado.`);
              // qualifiedTeamId permanece null se não houver desempate
            }
        }
    }

    // Atualizar ambas as partidas do confronto
    for (const tm of tieMatches) {
        // Atualizar placares agregados e classificado para ambas as partidas
        // O placar agregado deve ser o mesmo para ambos os jogos do confronto
        tm.home_aggregate_score = teamAScore; // Score do time A (home no primeiro jogo)
        tm.away_aggregate_score = teamBScore; // Score do time B (away no primeiro jogo)
        
        if (qualifiedTeamId !== null) {
          tm.qualified_team_id = qualifiedTeamId;
        } else {
          tm.qualified_team_id = null;
        }
    }
    await this.matchRepository.save(tieMatches);
    console.log(`✅ Placar agregado e classificado atualizados para o confronto ${match.tie_id}. Classificado: ${qualifiedTeamId}`);
  }

  async getTopScorers(): Promise<any[]> {
    try {
      console.log('🔍 Buscando artilheiros...');
      
      // Buscar todas as partidas finalizadas com estatísticas de jogadores
      const matches = await this.matchRepository.find({
        where: { status: MatchStatus.FINISHED },
        relations: ['home_team', 'away_team', 'competition'],
        select: {
          id: true,
          home_team_player_stats: true,
          away_team_player_stats: true,
          home_team: { id: true, name: true, short_name: true, logo_url: true },
          away_team: { id: true, name: true, short_name: true, logo_url: true },
          competition: { id: true, name: true, season: true }
        }
      });

      console.log(`📊 Encontradas ${matches.length} partidas finalizadas`);

      // Mapa para armazenar estatísticas dos jogadores
      const playerStatsMap = new Map<string, any>();

      for (const match of matches) {
        // Processar estatísticas do time da casa
        if (match.home_team_player_stats && Array.isArray(match.home_team_player_stats)) {
          await this.processTeamPlayerStats(
            match.home_team_player_stats,
            match.home_team,
            match.competition,
            playerStatsMap
          );
        }

        // Processar estatísticas do time visitante
        if (match.away_team_player_stats && Array.isArray(match.away_team_player_stats)) {
          await this.processTeamPlayerStats(
            match.away_team_player_stats,
            match.away_team,
            match.competition,
            playerStatsMap
          );
        }
      }

      // Converter mapa para array e ordenar por gols
      const topScorers = Array.from(playerStatsMap.values())
        .filter(stat => stat.goals > 0)
        .sort((a, b) => {
          if (b.goals !== a.goals) {
            return b.goals - a.goals;
          }
          return b.goals_per_match - a.goals_per_match;
        });

      console.log(`🏆 Encontrados ${topScorers.length} artilheiros`);
      return topScorers;

    } catch (error) {
      console.error('❌ Erro ao buscar artilheiros:', error);
      throw error;
    }
  }

  private async processTeamPlayerStats(
    playerStats: any[],
    team: Team,
    competition: Competition,
    playerStatsMap: Map<string, any>
  ): Promise<void> {
    for (const stat of playerStats) {
      if (stat.goals && stat.goals > 0) {
        const key = `${stat.player_id}-${competition.id}`;
        
        // Buscar dados do jogador se ainda não temos
        let playerData: Player | null = null;
        try {
          playerData = await this.playerRepository.findOne({
            where: { id: stat.player_id },
            select: ['id', 'name', 'position', 'image_url']
          });
        } catch (error) {
          console.error(`Erro ao buscar jogador ${stat.player_id}:`, error);
          continue;
        }

        if (playerData) {
          if (playerStatsMap.has(key)) {
            // Atualizar estatísticas existentes
            const existing = playerStatsMap.get(key);
            existing.goals += stat.goals;
            existing.matches_played += 1;
            existing.yellow_cards = (existing.yellow_cards || 0) + (stat.yellow_cards || 0);
            existing.red_cards = (existing.red_cards || 0) + (stat.red_cards || 0);
            existing.goals_per_match = existing.goals / existing.matches_played;
          } else {
            // Criar nova entrada
            playerStatsMap.set(key, {
              player: playerData,
              team: team,
              goals: stat.goals,
              matches_played: 1,
              yellow_cards: stat.yellow_cards || 0,
              red_cards: stat.red_cards || 0,
              goals_per_match: stat.goals,
              competition: competition
            });
          }
        }
      }
    }
  }
} 