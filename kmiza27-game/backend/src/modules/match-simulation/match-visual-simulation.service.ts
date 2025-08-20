import { Injectable, Logger } from '@nestjs/common';
import { PlayerMatchData, TacticalSetup } from './match-simulation.service';

// --- Interfaces para a Simulação Visual ---

interface Vector2D {
  x: number;
  y: number;
}

interface SimulationPlayer extends PlayerMatchData {
  team: 'home' | 'away';
  coordinates: Vector2D; // Posição atual no campo (x, y)
  initialCoordinates: Vector2D; // Posição tática inicial
  hasBall: boolean;
}

interface SimulationBall {
  position: Vector2D;
  controlledBy: string | null; // ID do jogador que controla a bola
  target: Vector2D;
  velocity: Vector2D;
}

interface MatchState {
  minute: number;
  homeTeam: SimulationPlayer[];
  awayTeam: SimulationPlayer[];
  ball: SimulationBall;
  attackingTeam: 'home' | 'away';
  status: 'playing' | 'goal' | 'kickoff';
  lastEventDescription: string;
}

export interface TimelineEvent {
  minute: number;
  type: 'KICKOFF' | 'MOVE' | 'PASS' | 'SHOOT' | 'TACKLE' | 'SAVE' | 'GOAL';
  team: 'home' | 'away' | null;
  playerId?: string;
  fromPlayerId?: string;
  toPlayerId?: string;
  startPos?: Vector2D;
  endPos?: Vector2D;
  isSuccess?: boolean;
  description: string;
}


// --- Constantes do Campo ---
const FIELD_WIDTH = 400;
const FIELD_HEIGHT = 200;
const GOAL_WIDTH = 40;
const HOME_GOAL_X = 0;
const AWAY_GOAL_X = FIELD_WIDTH;


@Injectable()
export class MatchVisualSimulationService {
  private readonly logger = new Logger(MatchVisualSimulationService.name);

  /**
   * Gera uma timeline de eventos visuais para uma partida.
   */
  public async generateVisualSimulationTimeline(
    userTeamData: { players: PlayerMatchData[]; tactics: TacticalSetup },
    machineTeamData: { players: PlayerMatchData[]; tactics: TacticalSetup }
  ): Promise<TimelineEvent[]> {
    try {
      this.logger.log(`🚀 Gerando timeline de simulação visual...`);
      this.logger.log(`📊 Dados recebidos - User Team: ${userTeamData?.players?.length || 0} jogadores, Machine Team: ${machineTeamData?.players?.length || 0} jogadores`);

      // Validar dados de entrada
      if (!userTeamData || !machineTeamData) {
        this.logger.error('❌ Dados de entrada inválidos');
        throw new Error('Dados de entrada inválidos');
      }

      const state = this.initializeMatchState(userTeamData, machineTeamData);
      const timeline: TimelineEvent[] = [];

      // Evento inicial
      timeline.push({
        minute: 0,
        type: 'KICKOFF',
        team: 'home',
        description: 'Começa a partida!'
      });

      // Simular 90 minutos com eventos
      for (let minute = 1; minute <= 90; minute++) {
        state.minute = minute;
        const events = this.simulateMinute(state);
        timeline.push(...events);
      }

      this.logger.log(`✅ Timeline de simulação visual gerada com ${timeline.length} eventos.`);
      return timeline;
    } catch (error) {
      this.logger.error(`❌ Erro ao gerar timeline: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Inicializa o estado da partida com posições dos jogadores.
   */
  private initializeMatchState(userTeamData: any, machineTeamData: any): MatchState {
    try {
      this.logger.log('🔧 Inicializando estado da partida...');
      
      const homePlayers = this.setupPlayers(userTeamData.players || [], 'home', userTeamData.tactics?.formation || '4-4-2');
      const awayPlayers = this.setupPlayers(machineTeamData.players || [], 'away', machineTeamData.tactics?.formation || '4-4-2');

      this.logger.log(`👥 Jogadores configurados - Casa: ${homePlayers.length}, Visitante: ${awayPlayers.length}`);

      const kickOffPlayer = homePlayers.find(p => p.position.includes('ST')) || homePlayers[0];
      if (kickOffPlayer) {
        kickOffPlayer.hasBall = true;
      }

      return {
        minute: 0,
        homeTeam: homePlayers,
        awayTeam: awayPlayers,
        ball: {
          position: { x: FIELD_WIDTH / 2, y: FIELD_HEIGHT / 2 },
          controlledBy: kickOffPlayer?.id || null,
          target: { x: FIELD_WIDTH / 2, y: FIELD_HEIGHT / 2 },
          velocity: { x: 0, y: 0 }
        },
        attackingTeam: 'home',
        status: 'kickoff',
        lastEventDescription: 'Partida iniciada'
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao inicializar estado: ${error.message}`);
      throw error;
    }
  }

  /**
   * Configura os jogadores com posições táticas.
   */
  private setupPlayers(players: any[], team: 'home' | 'away', formation: string): SimulationPlayer[] {
    try {
      this.logger.log(`⚽ Configurando jogadores do time ${team} com formação ${formation}`);
      
      // Se não há jogadores, criar jogadores padrão
      if (!players || players.length === 0) {
        this.logger.log(`🔄 Criando jogadores padrão para time ${team}`);
        return this.createDefaultPlayers(team, formation);
      }

      // Usar jogadores existentes
      return players.map((player, index) => {
        const position = this.getPlayerPosition(index, formation);
        const coords = this.getPlayerCoordinates(position, team);
        
        return {
          ...player,
          team,
          coordinates: coords,
          initialCoordinates: coords,
          hasBall: false
        };
      });
    } catch (error) {
      this.logger.error(`❌ Erro ao configurar jogadores: ${error.message}`);
      // Fallback para jogadores padrão
      return this.createDefaultPlayers(team, formation);
    }
  }

  /**
   * Obtém a posição baseada no índice e formação.
   */
  private getPlayerPosition(index: number, formation: string): string {
    const positions = this.getFormationPositions(formation);
    return positions[index] || 'CM';
  }

  /**
   * Cria jogadores padrão quando não há dados.
   */
  private createDefaultPlayers(team: 'home' | 'away', formation: string): SimulationPlayer[] {
    const positions = this.getFormationPositions(formation);
    const players: SimulationPlayer[] = [];

    positions.forEach((pos, index) => {
      const coords = this.getPlayerCoordinates(pos, team);
      const defaultPlayer: SimulationPlayer = {
        id: `${team}-${index + 1}`,
        name: `Jogador ${index + 1}`,
        position: pos,
        team,
        coordinates: coords,
        initialCoordinates: coords,
        hasBall: false,
        // Atributos padrão
        overall: 70,
        // Atributos específicos do PlayerMatchData
        passing: 70,
        shooting: 70,
        dribbling: 70,
        defending: 70,
        speed: 70,
        stamina: 70,
        strength: 70,
        vision: 70,
        // Estado atual
        morale: 80,
        fitness: 100,
        form: 70,
        fatigue: 0,
        injury_severity: 0
      };

      players.push(defaultPlayer);
    });

    return players;
  }

  /**
   * Obtém posições baseadas na formação.
   */
  private getFormationPositions(formation: string): string[] {
    switch (formation) {
      case '4-4-2':
        return ['GK', 'RB', 'CB', 'CB', 'LB', 'RM', 'CM', 'CM', 'LM', 'ST', 'ST'];
      case '4-3-3':
        return ['GK', 'RB', 'CB', 'CB', 'LB', 'CM', 'CM', 'CM', 'RW', 'ST', 'LW'];
      case '3-5-2':
        return ['GK', 'CB', 'CB', 'CB', 'RWB', 'CM', 'CM', 'CM', 'LWB', 'ST', 'ST'];
      default:
        return ['GK', 'RB', 'CB', 'CB', 'LB', 'RM', 'CM', 'CM', 'LM', 'ST', 'ST'];
    }
  }

  /**
   * Obtém coordenadas baseadas na posição e time.
   */
  private getPlayerCoordinates(position: string, team: 'home' | 'away'): Vector2D {
    const isHome = team === 'home';
    const baseX = isHome ? 50 : FIELD_WIDTH - 50;
    
    switch (position) {
      case 'GK':
        return { x: isHome ? 20 : FIELD_WIDTH - 20, y: FIELD_HEIGHT / 2 };
      case 'RB':
        return { x: baseX, y: FIELD_HEIGHT / 2 - 40 };
      case 'CB':
        return { x: baseX, y: FIELD_HEIGHT / 2 + (isHome ? -20 : 20) };
      case 'LB':
        return { x: baseX, y: FIELD_HEIGHT / 2 + 40 };
      case 'RM':
        return { x: baseX + (isHome ? 50 : -50), y: FIELD_HEIGHT / 2 - 30 };
      case 'CM':
        return { x: baseX + (isHome ? 50 : -50), y: FIELD_HEIGHT / 2 + (isHome ? -10 : 10) };
      case 'LM':
        return { x: baseX + (isHome ? 50 : -50), y: FIELD_HEIGHT / 2 + 30 };
      case 'RW':
        return { x: baseX + (isHome ? 100 : -100), y: FIELD_HEIGHT / 2 - 25 };
      case 'ST':
        return { x: baseX + (isHome ? 100 : -100), y: FIELD_HEIGHT / 2 + (isHome ? -15 : 15) };
      case 'LW':
        return { x: baseX + (isHome ? 100 : -100), y: FIELD_HEIGHT / 2 + 25 };
      case 'RWB':
        return { x: baseX + (isHome ? 30 : -30), y: FIELD_HEIGHT / 2 - 35 };
      case 'LWB':
        return { x: baseX + (isHome ? 30 : -30), y: FIELD_HEIGHT / 2 + 35 };
      default:
        return { x: baseX, y: FIELD_HEIGHT / 2 };
    }
  }

  /**
   * Simula um minuto de jogo.
   */
  private simulateMinute(state: MatchState): TimelineEvent[] {
    const events: TimelineEvent[] = [];
    
    // Simular eventos básicos
    if (Math.random() < 0.3) { // 30% de chance de movimento
      const player = this.getRandomPlayer(state);
      if (player) {
        events.push({
          minute: state.minute,
          type: 'MOVE',
          team: player.team,
          playerId: player.id,
          endPos: this.getRandomPosition(),
          description: `${player.name} se move`
        });
      }
    }

    if (Math.random() < 0.2) { // 20% de chance de passe
      const fromPlayer = this.getRandomPlayer(state);
      const toPlayer = this.getRandomPlayer(state, fromPlayer?.team);
      if (fromPlayer && toPlayer && fromPlayer.id !== toPlayer.id) {
        events.push({
          minute: state.minute,
          type: 'PASS',
          team: fromPlayer.team,
          fromPlayerId: fromPlayer.id,
          toPlayerId: toPlayer.id,
          startPos: fromPlayer.coordinates,
          endPos: toPlayer.coordinates,
          isSuccess: Math.random() > 0.3, // 70% de sucesso
          description: `${fromPlayer.name} passa para ${toPlayer.name}`
        });
      }
    }

    if (Math.random() < 0.05) { // 5% de chance de gol
      const scoringTeam = Math.random() > 0.5 ? 'home' : 'away';
      events.push({
        minute: state.minute,
        type: 'GOAL',
        team: scoringTeam,
        endPos: scoringTeam === 'home' ? { x: 0, y: FIELD_HEIGHT / 2 } : { x: FIELD_WIDTH, y: FIELD_HEIGHT / 2 },
        description: `GOL! Time ${scoringTeam === 'home' ? 'da casa' : 'visitante'} marca!`
      });
    }

    return events;
  }

  /**
   * Obtém um jogador aleatório.
   */
  private getRandomPlayer(state: MatchState, team?: 'home' | 'away'): SimulationPlayer | null {
    const players = team === 'home' ? state.homeTeam : 
                   team === 'away' ? state.awayTeam : 
                   [...state.homeTeam, ...state.awayTeam];
    
    if (players.length === 0) return null;
    return players[Math.floor(Math.random() * players.length)];
  }

  /**
   * Obtém uma posição aleatória no campo.
   */
  private getRandomPosition(): Vector2D {
    return {
      x: Math.random() * FIELD_WIDTH,
      y: Math.random() * FIELD_HEIGHT
    };
  }
}
