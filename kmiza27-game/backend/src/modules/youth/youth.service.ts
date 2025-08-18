import { Injectable, Logger } from '@nestjs/common';
import { supabase, SupabaseConfig } from '../../config/supabase.config';

@Injectable()
export class YouthService {
  private readonly logger = new Logger(YouthService.name);

  async promotePlayer(playerId: string, teamId: string) {
    this.logger.log(`PROMOTING: ${playerId} to team ${teamId}`);

    // Forçar recriação do client Supabase para garantir schema atualizado
    SupabaseConfig.resetInstance();
    const freshSupabase = SupabaseConfig.getInstance().getClient();

    try {
      // 1. Buscar jogador juvenil
      const { data: youth, error: youthError } = await freshSupabase
        .from('youth_players')
        .select('*')
        .eq('id', playerId)
        .single();

      if (youthError || !youth) {
        throw new Error('Youth player not found');
      }

      this.logger.log(`Found youth: ${youth.name}`);
      this.logger.log(`Youth market value: ${youth.market_value}`);

      // 2. Mapear posição para código de 3 caracteres
      const getPositionCode = (position: string): string => {
        const positionMap = {
          'Goleiro': 'GK',
          'Zagueiro': 'CB',
          'Lateral Direito': 'RB',
          'Lateral Esquerdo': 'LB',
          'Volante': 'CDM',
          'Meio-Campo': 'CM',
          'Meia': 'CAM',
          'Atacante': 'ST',
          'Ponta Direita': 'RW',
          'Ponta Esquerda': 'LW'
        };
        return positionMap[position] || position.substring(0, 3).toUpperCase();
      };

      const positionCode = getPositionCode(youth.position);
      const isGoalkeeper = youth.position === 'Goleiro' || positionCode === 'GK';
      
      this.logger.log(`Position: "${youth.position}" -> Code: "${positionCode}" -> IsGoalkeeper: ${isGoalkeeper}`);

      // 3. Criar dados usando apenas campos essenciais e seguros
      const proData = {
        // Campos básicos obrigatórios
        name: youth.name,
        position: positionCode,
        nationality: 'BRA', // Código padrão para Brasil
        team_id: teamId,
        age: youth.age || 18,
        team_type: 'first_team',
        // Removido campo alternative_positions que pode não existir no schema
        
        // Atributos principais (usando nomes corretos do schema)
        speed: this.getAttr(youth, 'pace'), // pace -> speed
        strength: this.getAttr(youth, 'physical'), // physical -> strength
        shooting: this.getAttr(youth, 'shooting'),
        passing: this.getAttr(youth, 'passing'),
        dribbling: this.getAttr(youth, 'dribbling'),
        defending: this.getAttr(youth, 'defending'),
        
        // Atributos adicionais necessários
        crossing: 50,
        finishing: 50,
        stamina: 50,
        jumping: 50,
        concentration: 50,
        creativity: 50,
        vision: 50,
        leadership: 50,
        tackling: 50,
        heading: 50,
        
        // Atributo especial para goleiros (constraint válida)
        goalkeeping: isGoalkeeper ? 
          Math.max(this.getAttr(youth, 'goalkeeping'), 70) : // Goleiro com valor mínimo 70
          Math.min(this.getAttr(youth, 'goalkeeping'), 20),  // Outros com valor máximo 20 (conforme constraint)
        
        // Campos obrigatórios do schema
        potential: 75,
        development_rate: 0.5,
        morale: 75,
        fitness: 85,
        form: 6,
        
        // Valor de mercado baseado nos atributos e idade do jogador
        market_value: (() => {
          const calculatedValue = this.calculateMarketValue(youth, isGoalkeeper);
          this.logger.log('Calculated market value:', calculatedValue);
          this.logger.log('Youth attributes for calculation:', {
            speed: this.getAttr(youth, 'speed'),
            shooting: this.getAttr(youth, 'shooting'),
            passing: this.getAttr(youth, 'passing'),
            dribbling: this.getAttr(youth, 'dribbling'),
            defending: this.getAttr(youth, 'defending'),
            strength: this.getAttr(youth, 'strength'),
            goalkeeping: this.getAttr(youth, 'goalkeeping'),
            age: youth.age,
            potential: youth.potential
          });
          this.logger.log('Calculation details:', {
            averageAttribute: (this.getAttr(youth, 'speed') + this.getAttr(youth, 'shooting') + this.getAttr(youth, 'passing') + this.getAttr(youth, 'dribbling') + this.getAttr(youth, 'defending') + this.getAttr(youth, 'strength')) / 6,
            ageMultiplier: youth.age <= 18 ? 2.5 : youth.age <= 20 ? 2.0 : 1.5,
            potentialMultiplier: (() => {
              if (youth.potential && typeof youth.potential === 'object') {
                const potentialValues = Object.values(youth.potential).filter(v => typeof v === 'number');
                if (potentialValues.length > 0) {
                  const avgPotential = potentialValues.reduce((sum, val) => sum + val, 0) / potentialValues.length;
                  return avgPotential / 75;
                }
              }
              return 1.0;
            })()
          });
          return calculatedValue;
        })(),
        
        // Salário (usando nome correto do schema)
        salary_monthly: 1000
      };

      this.logger.log('Inserting professional player...');
      this.logger.log('Data to insert:', JSON.stringify(proData, null, 2));
      this.logger.log('Market value being inserted:', proData.market_value);
      
      // Debug: verificar tamanho dos campos
      Object.keys(proData).forEach(key => {
        const value = proData[key];
        if (typeof value === 'string' && value.length > 3) {
          this.logger.warn(`Campo ${key} tem ${value.length} caracteres: "${value}"`);
        }
      });

      const { data: pro, error: proError } = await freshSupabase
        .from('game_players')
        .insert(proData)
        .select('id, name, position, nationality, team_id, age, team_type, market_value, salary_monthly')
        .single();

      if (proError) {
        this.logger.error('Pro creation error:', proError);
        this.logger.error('Error details:', {
          code: proError.code,
          message: proError.message,
          details: proError.details,
          hint: proError.hint
        });
        this.logger.error('Data that failed:', JSON.stringify(proData, null, 2));
        throw new Error(`Failed to create professional: ${proError.message}`);
      }

      this.logger.log('Professional created, removing youth...');
      this.logger.log('Created player data:', JSON.stringify(pro, null, 2));
      this.logger.log('Market value in response:', pro?.market_value);

      // 3. Remover da base
      const { error: deleteError } = await freshSupabase
        .from('youth_players')
        .delete()
        .eq('id', playerId);

      if (deleteError) {
        this.logger.error('Delete error:', deleteError);
        throw new Error('Failed to remove from youth');
      }

      this.logger.log('Promotion completed successfully!');

      return {
        success: true,
        message: 'Player promoted successfully!',
        player: pro,
      };

    } catch (error) {
      this.logger.error('Promotion error:', error.message);
      throw new Error(`Promotion failed: ${error.message}`);
    }
  }

  private getAttr(youth: any, attr: string): number {
    if (youth.attributes && youth.attributes[attr]) {
      return youth.attributes[attr];
    }
    if (youth[attr]) {
      return youth[attr];
    }
    return 50; // Valor padrão
  }

  private calculateMarketValue(youth: any, isGoalkeeper: boolean): number {
    // Usar os atributos que realmente existem no objeto youth
    const speed = this.getAttr(youth, 'speed');
    const shooting = this.getAttr(youth, 'shooting');
    const passing = this.getAttr(youth, 'passing');
    const dribbling = this.getAttr(youth, 'dribbling');
    const defending = this.getAttr(youth, 'defending');
    const strength = this.getAttr(youth, 'strength');
    
    let averageAttribute = (speed + shooting + passing + dribbling + defending + strength) / 6;
    
    // Para goleiros, usar atributo de goleiro
    if (isGoalkeeper) {
      const goalkeeping = this.getAttr(youth, 'goalkeeping');
      averageAttribute = Math.max(averageAttribute, goalkeeping);
    }
    
    // Base do valor de mercado
    let baseValue = averageAttribute * 1000;
    
    // Multiplicador por idade (jogadores mais jovens valem mais)
    const ageMultiplier = youth.age <= 18 ? 2.5 : youth.age <= 20 ? 2.0 : 1.5;
    
    // Multiplicador por potencial (se disponível)
    let potentialMultiplier = 1.0;
    if (youth.potential) {
      if (typeof youth.potential === 'object') {
        // Se potential for um objeto, calcular média dos valores
        const potentialValues = Object.values(youth.potential).filter(v => typeof v === 'number');
        if (potentialValues.length > 0) {
          const avgPotential = potentialValues.reduce((sum, val) => sum + val, 0) / potentialValues.length;
          potentialMultiplier = avgPotential / 75;
        }
      } else if (typeof youth.potential === 'number') {
        potentialMultiplier = youth.potential / 75;
      }
    }
    
    // Valor final com limites
    const finalValue = Math.round(baseValue * ageMultiplier * potentialMultiplier);
    
    return Math.max(50000, Math.min(5000000, finalValue));
  }
}
