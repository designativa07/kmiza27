import { Injectable, Logger } from '@nestjs/common';
import { supabase } from '../../config/supabase.config';

@Injectable()
export class YouthService {
  private readonly logger = new Logger(YouthService.name);

  async promotePlayer(playerId: string, teamId: string) {
    this.logger.log(`SERVICE: Promoting player ${playerId} for team ${teamId}`);

    // Passo 1: Encontrar o jogador na base
    const { data: youthPlayer, error: findError } = await supabase
      .from('youth_players')
      .select('*')
      .eq('id', playerId)
      .single();

    if (findError || !youthPlayer) {
      this.logger.error('Youth player not found', findError);
      throw new Error('Player not found in youth academy.');
    }

    // Passo 2: Criar um novo registro em game_players com os dados do jogador
    const { data: professionalPlayer, error: createError } = await supabase
      .from('game_players')
      .insert({
        name: youthPlayer.name,
        position: youthPlayer.position,
        date_of_birth: youthPlayer.date_of_birth,
        nationality: youthPlayer.nationality,
        team_id: teamId,
        attributes: youthPlayer.attributes, // Atributos atuais viram os de profissional
        market_value: youthPlayer.market_value * 2, // Ex: Valor dobra ao ser promovido
        salary: 1000, // Salário inicial padrão
      })
      .select()
      .single();

    if (createError) {
      this.logger.error('Failed to create professional player', createError);
      throw new Error('Could not promote player.');
    }

    // Passo 3: Remover o jogador da base
    const { error: deleteError } = await supabase
      .from('youth_players')
      .delete()
      .eq('id', playerId);

    if (deleteError) {
      this.logger.error('Failed to delete youth player', deleteError);
      // Opcional: Adicionar lógica para reverter a criação do profissional se a deleção falhar
      throw new Error('Failed to finalize promotion.');
    }

    this.logger.log(
      `Player ${youthPlayer.name} promoted successfully to professional!`,
    );
    return {
      success: true,
      message: 'Player promoted successfully!',
      player: professionalPlayer,
    };
  }
}
