'use client';

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { gameApiReformed } from '@/services/gameApiReformed';

// Tipos para o simulador visual
interface TimelineEvent {
  minute: number;
  type: 'KICKOFF' | 'MOVE' | 'PASS' | 'SHOOT' | 'TACKLE' | 'SAVE' | 'GOAL';
  team: 'home' | 'away' | null;
  playerId?: string;
  fromPlayerId?: string;
  toPlayerId?: string;
  startPos?: { x: number; y: number };
  endPos?: { x: number; y: number };
  isSuccess?: boolean;
  description: string;
}

interface VisualPlayer {
  id: string;
  name: string;
  position: string;
  x: number;
  y: number;
  team: 'home' | 'away';
  isWithBall: boolean;
  targetX: number;
  targetY: number;
  attributes: {
    PAC: number;
    FIN: number;
    PAS: number;
    DRI: number;
    DEF: number;
    FIS: number;
    GOL?: number;
  };
}

interface VisualMatch {
  homeTeam: {
    name: string;
    colors: { primary: string; secondary: string };
    players: VisualPlayer[];
  };
  awayTeam: {
    name: string;
    colors: { primary: string; secondary: string };
    players: VisualPlayer[];
  };
  ballPosition: { x: number; y: number; targetX: number; targetY: number };
  ballVelocity: { x: number; y: number };
  score: { home: number; away: number };
  minute: number;
  possession: { home: number; away: number };
  status: 'pre_match' | 'playing' | 'paused' | 'finished';
  lastGoal: { team: 'home' | 'away' | null; minute: number };
}

interface MatchVisualSimulatorProps {
  matchId: string;
  homeTeam: any;
  awayTeam: any;
  onMatchEnd: (result: { homeScore: number; awayScore: number }) => void;
  onClose: () => void;
}

export default function MatchVisualSimulator({
  matchId,
  homeTeam,
  awayTeam,
  onMatchEnd,
  onClose,
}: MatchVisualSimulatorProps) {
  console.log('🎮 MatchVisualSimulator renderizando com props:', { matchId, homeTeam, awayTeam });
  
  // Estados simples e diretos
  const [isLoading, setIsLoading] = useState(true);
  const [statusText, setStatusText] = useState('Carregando...');
  const [isPaused, setIsPaused] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [canvasReady, setCanvasReady] = useState(false);
  
  // Refs para o jogo
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<VisualMatch | null>(null);
  const timelineRef = useRef<TimelineEvent[] | null>(null);
  const currentEventIndexRef = useRef(0);
  const lastTimestampRef = useRef(0);
  const timeSinceLastEventRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // Callback ref para capturar o canvas quando for montado
  const setCanvasRef = useCallback((node: HTMLCanvasElement | null) => {
    if (node) {
      console.log('🎯 Canvas montado via callback ref:', node);
      (canvasRef as any).current = node;
      setCanvasReady(true);
    }
  }, []);
  
  // Funções auxiliares para o jogo
  const findPlayer = useCallback((id: string, state: VisualMatch): VisualPlayer | undefined => {
    return [...state.homeTeam.players, ...state.awayTeam.players].find(p => p.id === id);
  }, []);

  const processEvent = useCallback((event: TimelineEvent, state: VisualMatch) => {
    state.minute = event.minute;
    
    switch (event.type) {
      case 'GOAL':
        if (event.team === 'home') {
          state.score.home++;
        } else if (event.team === 'away') {
          state.score.away++;
        }
        state.lastGoal = { team: event.team, minute: event.minute };
        break;
      case 'MOVE':
        if (event.playerId && event.endPos) {
          const player = findPlayer(event.playerId, state);
          if (player) {
            player.targetX = event.endPos.x;
            player.targetY = event.endPos.y;
            if (event.playerId.includes('h')) {
              state.ballPosition.targetX = event.endPos.x;
              state.ballPosition.targetY = event.endPos.y;
            }
          }
        }
        break;
      case 'PASS':
        if (event.fromPlayerId && event.toPlayerId && event.endPos) {
          const fromPlayer = findPlayer(event.fromPlayerId, state);
          const toPlayer = findPlayer(event.toPlayerId, state);
          if (fromPlayer) fromPlayer.isWithBall = false;
          if (toPlayer) {
            toPlayer.isWithBall = true;
            toPlayer.targetX = event.endPos.x;
            toPlayer.targetY = event.endPos.y;
            state.ballPosition.targetX = event.endPos.x;
            state.ballPosition.targetY = event.endPos.y;
          }
        }
        break;
    }
  }, [findPlayer]);

  const updatePlayerPositions = useCallback((state: VisualMatch) => {
    const speed = 0.08;
    const fieldWidth = 600;
    const fieldHeight = 300;
    const margin = 30;
    
    // Atualizar posições dos jogadores da casa
    state.homeTeam.players.forEach(player => {
      const dx = player.targetX - player.x;
      const dy = player.targetY - player.y;
      
      if (Math.abs(dx) > 0.5) {
        player.x += dx * speed;
      } else {
        player.x = player.targetX;
      }
      
      if (Math.abs(dy) > 0.5) {
        player.y += dy * speed;
      } else {
        player.y = player.targetY;
      }
    });
    
    // Atualizar posições dos jogadores visitantes
    state.awayTeam.players.forEach(player => {
      const dx = player.targetX - player.x;
      const dy = player.targetY - player.y;
      
      if (Math.abs(dx) > 0.5) {
        player.x += dx * speed;
      } else {
        player.x = player.targetX;
      }
      
      if (Math.abs(dy) > 0.5) {
        player.y += dy * speed;
      } else {
        player.y = player.targetY;
      }
    });
    
    // Atualizar posição da bola com física realista
    if (state.ballVelocity.x !== 0 || state.ballVelocity.y !== 0) {
      state.ballPosition.x += state.ballVelocity.x;
      state.ballPosition.y += state.ballVelocity.y;
      
      // Fricção da bola (desaceleração)
      state.ballVelocity.x *= 0.95;
      state.ballVelocity.y *= 0.95;
      
      // Parar a bola quando muito lenta
      if (Math.abs(state.ballVelocity.x) < 0.1) state.ballVelocity.x = 0;
      if (Math.abs(state.ballVelocity.y) < 0.1) state.ballVelocity.y = 0;
      
      // Rebater nas bordas do campo
      if (state.ballPosition.x <= margin || state.ballPosition.x >= fieldWidth - margin) {
        state.ballVelocity.x *= -0.8;
        state.ballPosition.x = Math.max(margin, Math.min(fieldWidth - margin, state.ballPosition.x));
      }
      if (state.ballPosition.y <= margin || state.ballPosition.y >= fieldHeight - margin) {
        state.ballVelocity.y *= -0.8;
        state.ballPosition.y = Math.max(margin, Math.min(fieldHeight - margin, state.ballPosition.y));
      }
    }
    
    // Inteligência tática dos jogadores
    if (state.status === 'playing') {
      updateTacticalPositions(state, fieldWidth, fieldHeight, margin);
    }
  }, []);

  // Função para atualizar posições táticas dos jogadores
  const updateTacticalPositions = useCallback((state: VisualMatch, fieldWidth: number, fieldHeight: number, margin: number) => {
    const allPlayers = [...state.homeTeam.players, ...state.awayTeam.players];
    
    // Atualizar posições táticas baseadas na posse da bola
    const ballCarrier = allPlayers.find(p => p.isWithBall);
    
    if (ballCarrier) {
      // Jogador com a bola: procurar espaço para atacar
      if (ballCarrier.team === 'home') {
        // Time da casa atacando (direita)
        const attackDirection = 1;
        updateAttackFormation(state.homeTeam, ballCarrier, fieldWidth, fieldHeight, margin, attackDirection);
        updateDefenseFormation(state.awayTeam, ballCarrier, fieldWidth, fieldHeight, margin);
      } else {
        // Time visitante atacando (esquerda)
        const attackDirection = -1;
        updateAttackFormation(state.awayTeam, ballCarrier, fieldWidth, fieldHeight, margin, attackDirection);
        updateDefenseFormation(state.homeTeam, ballCarrier, fieldWidth, fieldHeight, margin);
      }
    } else {
      // Bola livre: jogadores procuram posições táticas
      updateFormationPositions(state.homeTeam, fieldWidth, fieldHeight, margin, 1);
      updateFormationPositions(state.awayTeam, fieldWidth, fieldHeight, margin, -1);
    }
  }, []);

  // Função para atualizar formação de ataque
  const updateAttackFormation = useCallback((team: { players: VisualPlayer[] }, ballCarrier: VisualPlayer, fieldWidth: number, fieldHeight: number, margin: number, direction: number) => {
    const centerX = fieldWidth / 2;
    const centerY = fieldHeight / 2;
    
    team.players.forEach(player => {
      if (player.id === ballCarrier.id) {
        // Jogador com a bola: procurar espaço para atacar
        if (direction > 0) {
          // Atacar para direita
          player.targetX = Math.min(player.x + 40, fieldWidth - margin - 80);
        } else {
          // Atacar para esquerda
          player.targetX = Math.max(player.x - 40, margin + 80);
        }
        player.targetY = centerY + (Math.random() - 0.5) * 30;
      } else {
        // Outros jogadores: posicionamento tático de ataque
        const distanceFromBall = Math.sqrt((player.x - ballCarrier.x) ** 2 + (player.y - ballCarrier.y) ** 2);
        
        if (distanceFromBall < 80) {
          // Jogador próximo: dar opção de passe
          player.targetX = ballCarrier.x + (Math.random() - 0.5) * 50;
          player.targetY = ballCarrier.y + (Math.random() - 0.5) * 50;
        } else {
          // Jogador distante: posicionamento tático avançado
          updateAdvancedAttackPosition(player, fieldWidth, fieldHeight, margin, direction, ballCarrier);
        }
      }
    });
  }, []);

  // Função para posicionamento tático avançado de ataque
  const updateAdvancedAttackPosition = useCallback((player: VisualPlayer, fieldWidth: number, fieldHeight: number, margin: number, direction: number, ballCarrier: VisualPlayer) => {
    const centerY = fieldHeight / 2;
    
    // Posicionamento baseado na posição do jogador e direção do ataque
    switch (player.position) {
      case 'ST':
        // Atacantes: avançar muito no campo adversário
        if (direction > 0) {
          // Time da casa atacando (direita)
          player.targetX = Math.max(player.x, fieldWidth * 0.7);
          player.targetY = centerY + (player.id.includes('1') ? -25 : 25);
        } else {
          // Time visitante atacando (esquerda)
          player.targetX = Math.min(player.x, fieldWidth * 0.3);
          player.targetY = centerY + (player.id.includes('1') ? -25 : 25);
        }
        break;
        
      case 'LM':
      case 'RM':
        // Pontas: avançar nas laterais
        if (direction > 0) {
          player.targetX = Math.max(player.x, fieldWidth * 0.6);
        } else {
          player.targetX = Math.min(player.x, fieldWidth * 0.4);
        }
        player.targetY = centerY + (player.position === 'RM' ? -60 : 60);
        break;
        
      case 'CM':
        // Meio-campistas: avançar no centro
        if (direction > 0) {
          player.targetX = Math.max(player.x, fieldWidth * 0.55);
        } else {
          player.targetX = Math.min(player.x, fieldWidth * 0.45);
        }
        player.targetY = centerY + (player.id.includes('1') ? -40 : 40);
        break;
        
      case 'CDM':
        // Volante: avançar um pouco menos
        if (direction > 0) {
          player.targetX = Math.max(player.x, fieldWidth * 0.5);
        } else {
          player.targetX = Math.min(player.x, fieldWidth * 0.5);
        }
        player.targetY = centerY;
        break;
        
      case 'CB':
      case 'RB':
      case 'LB':
        // Defensores: avançar moderadamente
        if (direction > 0) {
          player.targetX = Math.max(player.x, fieldWidth * 0.35);
        } else {
          player.targetX = Math.min(player.x, fieldWidth * 0.65);
        }
        player.targetY = centerY + (player.position === 'RB' ? -50 : player.position === 'LB' ? 50 : (player.id.includes('1') ? -30 : 30));
        break;
        
      case 'GK':
        // Goleiro: sair um pouco do gol
        if (direction > 0) {
          player.targetX = Math.max(player.x, fieldWidth * 0.15);
        } else {
          player.targetX = Math.min(player.x, fieldWidth * 0.85);
        }
        player.targetY = centerY;
        break;
    }
    
    // Adicionar variação aleatória para movimento natural
    player.targetX += (Math.random() - 0.5) * 15;
    player.targetY += (Math.random() - 0.5) * 15;
    
    // Manter dentro dos limites
    player.targetX = Math.max(margin + 20, Math.min(fieldWidth - margin - 20, player.targetX));
    player.targetY = Math.max(margin + 20, Math.min(fieldHeight - margin - 20, player.targetY));
  }, []);

  // Função para atualizar formação de defesa
  const updateDefenseFormation = useCallback((team: { players: VisualPlayer[] }, ballCarrier: VisualPlayer, fieldWidth: number, fieldHeight: number, margin: number) => {
    const centerX = fieldWidth / 2;
    const centerY = fieldHeight / 2;
    
    team.players.forEach(player => {
      if (player.position === 'GK') {
        // Goleiro: defender o gol com inteligência
        updateGoalkeeperPosition(player, ballCarrier, fieldWidth, fieldHeight, margin);
      } else if (player.position === 'CB' || player.position === 'RB' || player.position === 'LB') {
        // Zagueiros: manter posicionamento defensivo
        updateDefenderPosition(player, ballCarrier, fieldWidth, fieldHeight, margin);
      } else {
        // Meio-campistas e atacantes: pressionar e marcar
        const distanceFromBall = Math.sqrt((player.x - ballCarrier.x) ** 2 + (player.y - ballCarrier.y) ** 2);
        
        if (distanceFromBall < 100) {
          // Jogador próximo da bola: pressionar
          player.targetX = ballCarrier.x + (Math.random() - 0.5) * 25;
          player.targetY = ballCarrier.y + (Math.random() - 0.5) * 25;
        } else {
          // Jogador distante: posicionamento defensivo tático
          updateDefensiveMidfieldPosition(player, ballCarrier, fieldWidth, fieldHeight, margin);
        }
      }
    });
  }, []);

  // Função para posicionamento inteligente do goleiro
  const updateGoalkeeperPosition = useCallback((player: VisualPlayer, ballCarrier: VisualPlayer, fieldWidth: number, fieldHeight: number, margin: number) => {
    const centerY = fieldHeight / 2;
    const isHomeTeam = player.team === 'home';
    
    if (isHomeTeam) {
      // Goleiro da casa (gol esquerdo)
      if (ballCarrier.team === 'away') {
        // Bola no campo da casa: goleiro fica no gol
        player.targetX = margin + 20;
      } else {
        // Bola no campo adversário: goleiro pode sair um pouco
        player.targetX = Math.max(player.x - 15, margin + 5);
      }
    } else {
      // Goleiro visitante (gol direito)
      if (ballCarrier.team === 'home') {
        // Bola no campo da casa: goleiro fica no gol
        player.targetX = fieldWidth - margin - 20;
      } else {
        // Bola no campo adversário: goleiro pode sair um pouco
        player.targetX = Math.min(player.x + 15, fieldWidth - margin - 5);
      }
    }
    
    // Ajustar posição Y baseado na posição da bola
    const ballY = ballCarrier.y;
    if (ballY < centerY - 40) {
      player.targetY = centerY - 30; // Bola alta
    } else if (ballY > centerY + 40) {
      player.targetY = centerY + 30; // Bola baixa
    } else {
      player.targetY = centerY; // Bola no centro
    }
  }, []);

  // Função para posicionamento defensivo dos zagueiros
  const updateDefenderPosition = useCallback((player: VisualPlayer, ballCarrier: VisualPlayer, fieldWidth: number, fieldHeight: number, margin: number) => {
    const centerY = fieldHeight / 2;
    const isHomeTeam = player.team === 'home';
    
    // Zagueiros mantêm posicionamento defensivo
    if (isHomeTeam) {
      // Zagueiros da casa (lado esquerdo)
      switch (player.position) {
        case 'CB':
          player.targetX = margin + 90;
          player.targetY = centerY + (player.id.includes('1') ? -35 : 35);
          break;
        case 'RB':
          player.targetX = margin + 90;
          player.targetY = centerY - 60;
          break;
        case 'LB':
          player.targetX = margin + 90;
          player.targetY = centerY + 60;
          break;
      }
    } else {
      // Zagueiros visitantes (lado direito)
      switch (player.position) {
        case 'CB':
          player.targetX = fieldWidth - margin - 90;
          player.targetY = centerY + (player.id.includes('1') ? -35 : 35);
          break;
        case 'RB':
          player.targetX = fieldWidth - margin - 90;
          player.targetY = centerY - 60;
          break;
        case 'LB':
          player.targetX = fieldWidth - margin - 90;
          player.targetY = centerY + 60;
          break;
      }
    }
    
    // Adicionar variação aleatória para movimento natural
    player.targetX += (Math.random() - 0.5) * 10;
    player.targetY += (Math.random() - 0.5) * 10;
  }, []);

  // Função para posicionamento defensivo do meio-campo
  const updateDefensiveMidfieldPosition = useCallback((player: VisualPlayer, ballCarrier: VisualPlayer, fieldWidth: number, fieldHeight: number, margin: number) => {
    const centerY = fieldHeight / 2;
    const isHomeTeam = player.team === 'home';
    
    // Meio-campistas e atacantes se posicionam defensivamente
    if (isHomeTeam) {
      // Time da casa defendendo (lado esquerdo)
      switch (player.position) {
        case 'CDM':
          player.targetX = margin + 150;
          player.targetY = centerY;
          break;
        case 'CM':
          player.targetX = margin + 150;
          player.targetY = centerY + (player.id.includes('1') ? -40 : 40);
          break;
        case 'RM':
          player.targetX = margin + 150;
          player.targetY = centerY - 60;
          break;
        case 'LM':
          player.targetX = margin + 150;
          player.targetY = centerY + 60;
          break;
        case 'ST':
          player.targetX = margin + 200;
          player.targetY = centerY + (player.id.includes('1') ? -25 : 25);
          break;
      }
    } else {
      // Time visitante defendendo (lado direito)
      switch (player.position) {
        case 'CDM':
          player.targetX = fieldWidth - margin - 150;
          player.targetY = centerY;
          break;
        case 'CM':
          player.targetX = fieldWidth - margin - 150;
          player.targetY = centerY + (player.id.includes('1') ? -40 : 40);
          break;
        case 'RM':
          player.targetX = fieldWidth - margin - 150;
          player.targetY = centerY - 60;
          break;
        case 'LM':
          player.targetX = fieldWidth - margin - 150;
          player.targetY = centerY + 60;
          break;
        case 'ST':
          player.targetX = fieldWidth - margin - 200;
          player.targetY = centerY + (player.id.includes('1') ? -25 : 25);
          break;
      }
    }
    
    // Adicionar variação aleatória para movimento natural
    player.targetX += (Math.random() - 0.5) * 15;
    player.targetY += (Math.random() - 0.5) * 15;
  }, []);

  // Função para atualizar posições de formação
  const updateFormationPositions = useCallback((team: { players: VisualPlayer[] }, fieldWidth: number, fieldHeight: number, margin: number, direction: number) => {
    team.players.forEach(player => {
      updateFormationPosition(player, fieldWidth, fieldHeight, margin, direction);
    });
  }, []);

  // Função para atualizar posição individual de formação
  const updateFormationPosition = useCallback((player: VisualPlayer, fieldWidth: number, fieldHeight: number, margin: number, direction: number) => {
    const centerX = fieldWidth / 2;
    const centerY = fieldHeight / 2;
    
    let targetX = player.x;
    let targetY = player.y;
    
    // Posições baseadas na posição do jogador
    switch (player.position) {
      case 'GK':
        if (direction > 0) {
          targetX = margin + 20; // Gol esquerdo
        } else {
          targetX = fieldWidth - margin - 20; // Gol direito
        }
        targetY = centerY;
        break;
        
      case 'CB':
        if (direction > 0) {
          targetX = margin + 90;
        } else {
          targetX = fieldWidth - margin - 90;
        }
        targetY = centerY + (player.id.includes('1') ? -35 : 35);
        break;
        
      case 'RB':
        if (direction > 0) {
          targetX = margin + 90;
        } else {
          targetX = fieldWidth - margin - 90;
        }
        targetY = centerY - 60;
        break;
        
      case 'LB':
        if (direction > 0) {
          targetX = margin + 90;
        } else {
          targetX = fieldWidth - margin - 90;
        }
        targetY = centerY + 60;
        break;
        
      case 'CDM':
        if (direction > 0) {
          targetX = margin + 180;
        } else {
          targetX = fieldWidth - margin - 180;
        }
        targetY = centerY;
        break;
        
      case 'CM':
        if (direction > 0) {
          targetX = margin + 180;
        } else {
          targetX = fieldWidth - margin - 180;
        }
        targetY = centerY + (player.id.includes('1') ? -45 : 45);
        break;
        
      case 'RM':
        if (direction > 0) {
          targetX = margin + 180;
        } else {
          targetX = fieldWidth - margin - 180;
        }
        targetY = centerY - 70;
        break;
        
      case 'LM':
        if (direction > 0) {
          targetX = margin + 180;
        } else {
          targetX = fieldWidth - margin - 180;
        }
        targetY = centerY + 70;
        break;
        
      case 'ST':
        if (direction > 0) {
          targetX = margin + 270;
        } else {
          targetX = fieldWidth - margin - 270;
        }
        targetY = centerY + (player.id.includes('1') ? -30 : 30);
        break;
    }
    
    // Adicionar variação aleatória para movimento natural
    if (Math.abs(player.x - player.targetX) < 5 && Math.abs(player.y - player.targetY) < 5) {
      targetX += (Math.random() - 0.5) * 20;
      targetY += (Math.random() - 0.5) * 20;
    }
    
    // Manter dentro dos limites
    player.targetX = Math.max(margin + 20, Math.min(fieldWidth - margin - 20, targetX));
    player.targetY = Math.max(margin + 20, Math.min(fieldHeight - margin - 20, targetY));
  }, []);

  // Sistema de jogadas de futebol
  const executeFootballActions = useCallback((state: VisualMatch, fieldWidth: number, fieldHeight: number, margin: number) => {
    const allPlayers = [...state.homeTeam.players, ...state.awayTeam.players];
    const ballCarrier = allPlayers.find(p => p.isWithBall);
    
    if (!ballCarrier) {
      // Bola livre: verificar se algum jogador pode pegá-la
      const closestPlayer = findClosestPlayerToBall(state);
      if (closestPlayer) {
        const distanceToBall = Math.sqrt((closestPlayer.x - state.ballPosition.x) ** 2 + (closestPlayer.y - state.ballPosition.y) ** 2);
        if (distanceToBall < 15) {
          // Jogador pegou a bola
          closestPlayer.isWithBall = true;
          state.ballPosition.x = closestPlayer.x;
          state.ballPosition.y = closestPlayer.y;
          state.ballVelocity.x = 0;
          state.ballVelocity.y = 0;
        }
      }
      return;
    }
    
    // Jogador com a bola: executar ações baseadas na posição e situação
    const actionChance = Math.random();
    const isNearGoal = isPlayerNearGoal(ballCarrier, fieldWidth, fieldHeight, margin);
    
    if (isNearGoal && actionChance < 0.6) {
      // 60% de chance de chutar quando próximo ao gol
      executeShot(state, ballCarrier, fieldWidth, fieldHeight, margin);
    } else if (actionChance < 0.4) {
      // 40% de chance de passar
      executePass(state, ballCarrier, fieldWidth, fieldHeight, margin);
    } else if (actionChance < 0.7) {
      // 30% de chance de driblar
      executeDribble(state, ballCarrier, fieldWidth, fieldHeight, margin);
    }
    // 30% de chance de continuar com a bola
  }, []);

  // Função para verificar se jogador está próximo ao gol
  const isPlayerNearGoal = useCallback((player: VisualPlayer, fieldWidth: number, fieldHeight: number, margin: number): boolean => {
    const centerY = fieldHeight / 2;
    
    if (player.team === 'home') {
      // Time da casa: verificar proximidade com gol direito
      const distanceToGoal = Math.sqrt((player.x - (fieldWidth - margin)) ** 2 + (player.y - centerY) ** 2);
      return distanceToGoal < 120; // Dentro de 120px do gol
    } else {
      // Time visitante: verificar proximidade com gol esquerdo
      const distanceToGoal = Math.sqrt((player.x - margin) ** 2 + (player.y - centerY) ** 2);
      return distanceToGoal < 120; // Dentro de 120px do gol
    }
  }, []);

  // Função para encontrar jogador mais próximo da bola
  const findClosestPlayerToBall = useCallback((state: VisualMatch): VisualPlayer | null => {
    const allPlayers = [...state.homeTeam.players, ...state.awayTeam.players];
    let closestPlayer: VisualPlayer | null = null;
    let minDistance = Infinity;
    
    allPlayers.forEach(player => {
      const distance = Math.sqrt((player.x - state.ballPosition.x) ** 2 + (player.y - state.ballPosition.y) ** 2);
      if (distance < minDistance) {
        minDistance = distance;
        closestPlayer = player;
      }
    });
    
    return closestPlayer;
  }, []);

  // Função para executar passe
  const executePass = useCallback((state: VisualMatch, ballCarrier: VisualPlayer, fieldWidth: number, fieldHeight: number, margin: number) => {
    const teammates = (ballCarrier.team === 'home' ? state.homeTeam : state.awayTeam).players.filter(p => p.id !== ballCarrier.id);
    
    if (teammates.length === 0) return;
    
    // Escolher companheiro para passar baseado na posição e situação
    const targetPlayer = findBestPassTarget(ballCarrier, teammates, fieldWidth, fieldHeight, margin);
    
    if (!targetPlayer) return; // Nenhum alvo bom encontrado
    
    // Calcular direção do passe
    const dx = targetPlayer.x - ballCarrier.x;
    const dy = targetPlayer.y - ballCarrier.y;
    const distance = Math.sqrt(dx ** 2 + dy ** 2);
    
    if (distance > 180) return; // Passe muito longo
    
    // Executar passe
    ballCarrier.isWithBall = false;
    targetPlayer.isWithBall = true;
    
    // Mover bola para o alvo
    const passSpeed = 3.5;
    state.ballVelocity.x = (dx / distance) * passSpeed;
    state.ballVelocity.y = (dy / distance) * passSpeed;
    
    // Atualizar posição alvo da bola
    state.ballPosition.targetX = targetPlayer.x;
    state.ballPosition.targetY = targetPlayer.y;
    
    console.log(`⚽ ${ballCarrier.name} passou para ${targetPlayer.name}`);
  }, []);

  // Função para encontrar melhor alvo para passe
  const findBestPassTarget = useCallback((ballCarrier: VisualPlayer, teammates: VisualPlayer[], fieldWidth: number, fieldHeight: number, margin: number): VisualPlayer | null => {
    const centerY = fieldHeight / 2;
    const isHomeTeam = ballCarrier.team === 'home';
    
    // Filtrar companheiros que estão em posições vantajosas
    const goodTargets = teammates.filter(teammate => {
      const distance = Math.sqrt((teammate.x - ballCarrier.x) ** 2 + (teammate.y - ballCarrier.y) ** 2);
      
      // Passe não muito curto nem muito longo
      if (distance < 30 || distance > 180) return false;
      
      // Verificar se está em posição de ataque
      if (isHomeTeam) {
        // Time da casa: procurar jogadores à direita (ataque)
        return teammate.x > ballCarrier.x + 20;
      } else {
        // Time visitante: procurar jogadores à esquerda (ataque)
        return teammate.x < ballCarrier.x - 20;
      }
    });
    
    if (goodTargets.length === 0) return null;
    
    // Escolher o melhor alvo baseado na posição e distância
    let bestTarget = goodTargets[0];
    let bestScore = 0;
    
    goodTargets.forEach(teammate => {
      const distance = Math.sqrt((teammate.x - ballCarrier.x) ** 2 + (teammate.y - ballCarrier.y) ** 2);
      const positionScore = getPositionScore(teammate, isHomeTeam, fieldWidth, fieldHeight, margin);
      const totalScore = positionScore - (distance / 10); // Preferir posições melhores e distâncias menores
      
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestTarget = teammate;
      }
    });
    
    return bestTarget;
  }, []);

  // Função para calcular pontuação da posição do jogador
  const getPositionScore = useCallback((player: VisualPlayer, isHomeTeam: boolean, fieldWidth: number, fieldHeight: number, margin: number): number => {
    let score = 0;
    
    // Pontuação baseada na posição do jogador
    switch (player.position) {
      case 'ST':
        score += 100; // Atacantes são prioridade
        break;
      case 'LM':
      case 'RM':
        score += 80; // Pontas são bons alvos
        break;
      case 'CM':
        score += 70; // Meio-campistas
        break;
      case 'CDM':
        score += 50; // Volante
        break;
      case 'CB':
      case 'RB':
      case 'LB':
        score += 30; // Defensores
        break;
      case 'GK':
        score += 10; // Goleiro (última opção)
        break;
    }
    
    // Bônus por estar em posição de ataque
    if (isHomeTeam && player.x > fieldWidth * 0.6) {
      score += 50; // Avançou no campo adversário
    } else if (!isHomeTeam && player.x < fieldWidth * 0.4) {
      score += 50; // Avançou no campo adversário
    }
    
    return score;
  }, []);

  // Função para executar chute
  const executeShot = useCallback((state: VisualMatch, ballCarrier: VisualPlayer, fieldWidth: number, fieldHeight: number, margin: number) => {
    // Determinar direção do chute baseado na posição do jogador
    let shotDirection = 1; // Direita
    let goalX = fieldWidth - margin;
    let goalY = fieldHeight / 2;
    
    if (ballCarrier.team === 'away') {
      shotDirection = -1; // Esquerda
      goalX = margin;
    }
    
    // Calcular direção do chute
    const dx = goalX - ballCarrier.x;
    const dy = goalY - ballCarrier.y;
    const distance = Math.sqrt(dx ** 2 + dy ** 2);
    
    // Executar chute
    ballCarrier.isWithBall = false;
    
    // Velocidade do chute baseada na distância
    const shotSpeed = Math.min(8, 3 + (distance / 100));
    state.ballVelocity.x = (dx / distance) * shotSpeed;
    state.ballVelocity.y = (dy / distance) * shotSpeed;
    
    // Adicionar variação aleatória para realismo
    state.ballVelocity.x += (Math.random() - 0.5) * 2;
    state.ballVelocity.y += (Math.random() - 0.5) * 2;
    
    console.log(`⚽ ${ballCarrier.name} chutou para o gol!`);
    
    // Verificar se é gol
    setTimeout(() => {
      checkGoal(state, ballCarrier.team, fieldWidth, fieldHeight, margin);
    }, 1000);
  }, []);

  // Função para executar drible
  const executeDribble = useCallback((state: VisualMatch, ballCarrier: VisualPlayer, fieldWidth: number, fieldHeight: number, margin: number) => {
    // Mover bola em direção ao movimento do jogador
    const moveDirection = ballCarrier.team === 'home' ? 1 : -1;
    const dribbleSpeed = 2;
    
    state.ballVelocity.x = moveDirection * dribbleSpeed;
    state.ballVelocity.y = (Math.random() - 0.5) * dribbleSpeed;
    
    // Mover jogador junto com a bola
    ballCarrier.targetX += moveDirection * 20;
    ballCarrier.targetY += (Math.random() - 0.5) * 20;
    
    // Manter dentro dos limites
    ballCarrier.targetX = Math.max(margin + 20, Math.min(fieldWidth - margin - 20, ballCarrier.targetX));
    ballCarrier.targetY = Math.max(margin + 20, Math.min(fieldHeight - margin - 20, ballCarrier.targetY));
    
    console.log(`⚽ ${ballCarrier.name} driblou!`);
  }, []);

  // Função para verificar gol
  const checkGoal = useCallback((state: VisualMatch, scoringTeam: 'home' | 'away', fieldWidth: number, fieldHeight: number, margin: number) => {
    const ballX = state.ballPosition.x;
    const ballY = state.ballPosition.y;
    
    // Verificar se a bola entrou no gol
    if (scoringTeam === 'home') {
      // Gol direito
      if (ballX >= fieldWidth - margin && ballY >= 90 && ballY <= 210) {
        state.score.home++;
        state.lastGoal = { team: 'home', minute: state.minute };
        console.log(`🎉 GOL! ${state.homeTeam.name} marca! Placar: ${state.score.home} - ${state.score.away}`);
        resetBallToCenter(state, fieldWidth, fieldHeight);
      }
    } else {
      // Gol esquerdo
      if (ballX <= margin && ballY >= 90 && ballY <= 210) {
        state.score.away++;
        state.lastGoal = { team: 'away', minute: state.minute };
        console.log(`🎉 GOL! ${state.awayTeam.name} marca! Placar: ${state.score.home} - ${state.score.away}`);
        resetBallToCenter(state, fieldWidth, fieldHeight);
      }
    }
  }, []);

  // Função para resetar bola ao centro
  const resetBallToCenter = useCallback((state: VisualMatch, fieldWidth: number, fieldHeight: number) => {
    state.ballPosition.x = fieldWidth / 2;
    state.ballPosition.y = fieldHeight / 2;
    state.ballVelocity.x = 0;
    state.ballVelocity.y = 0;
    state.ballPosition.targetX = fieldWidth / 2;
    state.ballPosition.targetY = fieldHeight / 2;
    
    // Nenhum jogador tem a bola
    [...state.homeTeam.players, ...state.awayTeam.players].forEach(p => p.isWithBall = false);
  }, []);

  // Funções auxiliares de desenho
  const drawField = useCallback((ctx: CanvasRenderingContext2D) => {
    // Campo verde maior
    ctx.fillStyle = '#2D5A27';
    ctx.fillRect(0, 0, 600, 300);
    
    // Linhas brancas
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    
    // Linha central
    ctx.beginPath();
    ctx.moveTo(300, 0);
    ctx.lineTo(300, 300);
    ctx.stroke();
    
    // Círculo central
    ctx.beginPath();
    ctx.arc(300, 150, 40, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Áreas do gol
    ctx.strokeRect(0, 90, 60, 120); // Gol esquerdo
    ctx.strokeRect(540, 90, 60, 120); // Gol direito
    
    // Linhas de área
    ctx.strokeRect(0, 60, 120, 180); // Área esquerda
    ctx.strokeRect(480, 60, 120, 180); // Área direita
    
    // Pontos de pênalti
    ctx.beginPath();
    ctx.arc(120, 150, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(480, 150, 3, 0, 2 * Math.PI);
    ctx.fill();
  }, []);

  const drawGoals = useCallback((ctx: CanvasRenderingContext2D) => {
    // Traves
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    
    // Gol esquerdo
    ctx.beginPath();
    ctx.moveTo(0, 90);
    ctx.lineTo(0, 210);
    ctx.stroke();
    
    // Gol direito
    ctx.beginPath();
    ctx.moveTo(600, 90);
    ctx.lineTo(600, 210);
    ctx.stroke();
  }, []);

  const drawPlayers = useCallback((ctx: CanvasRenderingContext2D, state: VisualMatch) => {
    // Jogadores da casa
    state.homeTeam.players.forEach(player => {
      ctx.fillStyle = state.homeTeam.colors.primary;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      if (player.isWithBall) {
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
    
    // Jogadores visitantes
    state.awayTeam.players.forEach(player => {
      ctx.fillStyle = state.awayTeam.colors.primary;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      if (player.isWithBall) {
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  }, []);

  const drawBall = useCallback((ctx: CanvasRenderingContext2D, state: VisualMatch) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(state.ballPosition.x, state.ballPosition.y, 4, 0, 2 * Math.PI);
    ctx.fill();
  }, []);

  // Função de Desenho principal
  const draw = useCallback(() => {
    if (!canvasRef.current || !gameStateRef.current) {
      return;
    }
    
    const ctx = canvasRef.current.getContext('2d');
    const state = gameStateRef.current;
    if (!ctx) return;

    // Limpa o canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Desenha o campo
    drawField(ctx);
    drawGoals(ctx);
    drawPlayers(ctx, state);
    drawBall(ctx, state);

    // Desenha o placar e stats
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${state.homeTeam.name} ${state.score.home} - ${state.score.away} ${state.awayTeam.name}`, canvasRef.current.width / 2, 20);
    ctx.font = '12px Arial';
    ctx.fillText(`Minuto: ${state.minute}'`, canvasRef.current.width / 2, 40);

    if(state.status === 'finished') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '30px Arial';
        ctx.fillText('Fim de Jogo', canvasRef.current.width / 2, canvasRef.current.height / 2 - 20);
    }
  }, [drawField, drawGoals, drawPlayers, drawBall]);
  
  // Função para iniciar o loop do jogo
  const startGameLoop = useCallback(() => {
    console.log('🎮 startGameLoop chamada');
    console.log('📊 Estado atual:', { 
      gameStateRef: gameStateRef.current, 
      timelineRef: timelineRef.current,
      isPaused 
    });
    
    const gameLoop = (timestamp: number) => {
      if (isPaused || !gameStateRef.current || !timelineRef.current) {
        console.log('⏸️ Jogo pausado ou dados não disponíveis:', { 
          isPaused, 
          hasGameState: !!gameStateRef.current, 
          hasTimeline: !!timelineRef.current 
        });
        lastTimestampRef.current = timestamp;
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }
      
      const state = gameStateRef.current;
      console.log('🎯 Estado do jogo:', state?.status);
      
      if (state?.status === 'playing') {
        const gameSpeed = simulationSpeed === 'slow' ? 1500 : simulationSpeed === 'normal' ? 750 : 300;

        if (timeSinceLastEventRef.current >= gameSpeed) {
          if (currentEventIndexRef.current < timelineRef.current!.length) {
            const event = timelineRef.current![currentEventIndexRef.current];
            
            console.log(`⚽ Processando evento ${currentEventIndexRef.current + 1}/${timelineRef.current!.length}:`, event);
            
            // Processar evento
            processEvent(event, state);
            currentEventIndexRef.current++;
            timeSinceLastEventRef.current = 0;
            
            // Verificar se acabou
            if (currentEventIndexRef.current >= timelineRef.current!.length) {
              console.log('🏁 Fim da simulação!');
              state.status = 'finished';
              onMatchEnd({ homeScore: state.score.home, awayScore: state.score.away });
              return;
            }
          }
        }
        
        timeSinceLastEventRef.current += timestamp - lastTimestampRef.current;
        lastTimestampRef.current = timestamp;
        
        // Atualizar posições dos jogadores
        updatePlayerPositions(state);
        
        // Executar ações de futebol
        executeFootballActions(state, 600, 300, 30);
        
        // Redesenhar
        draw();
      }
      
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };
    
    // Definir status inicial como 'playing'
    if (gameStateRef.current) {
      console.log('✅ Definindo status como playing');
      gameStateRef.current.status = 'playing';
    } else {
      console.log('❌ gameStateRef.current não disponível');
    }
    
    console.log('🎬 Iniciando requestAnimationFrame');
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [isPaused, simulationSpeed, onMatchEnd, processEvent, updatePlayerPositions, draw]);
  
  // Função para inicializar o jogo quando o canvas estiver pronto
  const initializeGame = useCallback(async () => {
    console.log('🔧 initializeGame chamada');
    
    if (!canvasRef.current) {
      console.log('❌ Canvas ainda não disponível em initializeGame');
      return;
    }
    
    console.log('✅ Canvas disponível em initializeGame');
    
    try {
      console.log('🚀 Iniciando simulação visual...');
      console.log('📊 Dados recebidos:', { matchId, homeTeam, awayTeam });
      
      // 1. Criar estado inicial do jogo
      console.log('🔧 Criando estado inicial...');
      const initialMatchState = initializeMatch(homeTeam, awayTeam);
      gameStateRef.current = initialMatchState;
      console.log('✅ Estado inicial criado:', initialMatchState);
      
      // 2. Buscar timeline da API
      console.log('🔄 Buscando timeline da API...');
      const events = await gameApiReformed.getVisualSimulationTimeline(
        matchId, 
        { players: homeTeam?.players || [], tactics: { formation: '4-4-2' } },
        { players: awayTeam?.players || [], tactics: { formation: '4-4-2' } }
      );
      
      console.log('📈 Timeline recebida:', events);
      
      // 3. Configurar timeline e iniciar
      timelineRef.current = events;
      console.log('✅ Timeline configurada');
      
      setIsLoading(false);
      setStatusText('Jogando');
      console.log('✅ Estados atualizados: isLoading=false, statusText="Jogando"');
      
      // 4. Iniciar loop do jogo
      console.log('🎮 Chamando startGameLoop...');
      startGameLoop();
      
    } catch (error) {
      console.error('❌ Erro ao carregar simulação:', error);
      setStatusText(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsLoading(false);
    }
  }, [matchId, homeTeam, awayTeam, startGameLoop]);
  
  // useLayoutEffect para detectar o canvas imediatamente após renderização
  useLayoutEffect(() => {
    console.log('🎨 useLayoutEffect para inicialização iniciado');
    
    // O callback ref vai cuidar da detecção do canvas
    // Apenas verificar se já está disponível
    if (canvasRef.current) {
      console.log('✅ Canvas já disponível via useLayoutEffect');
      setCanvasReady(true);
    }
  }, []);

  // useEffect para inicializar o jogo quando o canvas estiver pronto
  useEffect(() => {
    if (canvasReady && canvasRef.current) {
      console.log('🎮 Canvas pronto, inicializando jogo...');
      initializeGame();
    }
  }, [canvasReady, initializeGame]);

  // Fallback: se o canvas não estiver pronto após 2 segundos, mostrar erro
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!canvasReady) {
        console.log('⚠️ Timeout: Canvas não detectado após 2 segundos');
        setIsLoading(false);
        setStatusText('Erro: Canvas não detectado - tente recarregar a página');
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [canvasReady]);

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
  };

  // Efeitos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          handleTogglePause();
          break;
        case '1':
          setSimulationSpeed('slow');
          break;
        case '2':
          setSimulationSpeed('normal');
          break;
        case '3':
          setSimulationSpeed('fast');
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onClose]);

  // Redesenhar quando necessário
  useEffect(() => {
    if (!isPaused && gameStateRef.current) {
      draw();
    }
  }, [isPaused, draw]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  console.log('🎨 Renderizando componente, isLoading:', isLoading, 'statusText:', statusText);
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold">{statusText}</p>
          <p className="text-sm text-gray-500 mt-2">Debug: isLoading={isLoading.toString()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Simulação Visual da Partida</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Canvas do Jogo */}
        <div className="flex justify-center mb-4">
          <canvas
            ref={setCanvasRef}
            id="match-simulation-canvas"
            width={600}
            height={300}
            className="border-2 border-gray-300 bg-green-800"
            onLoad={() => console.log('🎨 Canvas carregado!')}
          />
          <p className="text-xs text-gray-500 mt-1">
            Debug: Canvas ID: {canvasRef.current?.id || 'não definido'} | 
            Canvas Ref: {canvasRef.current ? '✅ Ativo' : '❌ Nulo'} |
            Canvas Width: {canvasRef.current?.width || 'N/A'} |
            Canvas Ready: {canvasReady ? '✅ Sim' : '❌ Não'}
          </p>
        </div>

        {/* Controles */}
        <div className="flex justify-center space-x-4 mb-4">
          <button
            onClick={handleTogglePause}
            className={`px-4 py-2 rounded ${
              isPaused ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
            } text-white`}
          >
            {isPaused ? '▶️ Continuar' : '⏸️ Pausar'}
          </button>
          
          <select
            value={simulationSpeed}
            onChange={(e) => setSimulationSpeed(e.target.value as any)}
            className="px-4 py-2 border rounded"
            title="Velocidade da simulação"
          >
            <option value="slow">🐌 Lenta</option>
            <option value="normal">⚡ Normal</option>
            <option value="fast">🚀 Rápida</option>
          </select>
        </div>

        {/* Status */}
        <div className="text-center">
          <p className="text-gray-600 mb-2">{statusText}</p>
          <p className="font-semibold">🎮 Controles: ESPAÇO para pausar/continuar • 1/2/3 para velocidade • ESC para fechar</p>
        </div>
      </div>
    </div>
  );
}

// Helper para inicializar
function initializeMatch(homeTeam: any, awayTeam: any): VisualMatch {
  console.log('🔧 Inicializando partida com dados:', { homeTeam, awayTeam });
  
  // Campo: 600x300, com margens para as traves
  const fieldWidth = 600;
  const fieldHeight = 300;
  const margin = 30;

  // Criar jogadores do time da casa (formação 4-4-2 realista)
  const homePlayers: VisualPlayer[] = [
    // Goleiro - posicionado no gol esquerdo
    { 
      id: 'h1', name: 'Goleiro', position: 'GK', 
      x: margin + 20, y: fieldHeight / 2, team: 'home', isWithBall: false,
      targetX: margin + 20, targetY: fieldHeight / 2,
      attributes: { PAC: 60, FIN: 30, PAS: 50, DRI: 30, DEF: 70, FIS: 65, GOL: 75 } 
    },
    // Defensores - linha de 4
    { 
      id: 'h2', name: 'Zagueiro 1', position: 'CB', 
      x: margin + 90, y: fieldHeight / 2 - 35, team: 'home', isWithBall: false,
      targetX: margin + 90, targetY: fieldHeight / 2 - 35,
      attributes: { PAC: 65, FIN: 40, PAS: 60, DRI: 45, DEF: 75, FIS: 70 } 
    },
    { 
      id: 'h3', name: 'Zagueiro 2', position: 'CB', 
      x: margin + 90, y: fieldHeight / 2 + 35, team: 'home', isWithBall: false,
      targetX: margin + 90, targetY: fieldHeight / 2 + 35,
      attributes: { PAC: 65, FIN: 40, PAS: 60, DRI: 45, DEF: 75, FIS: 70 } 
    },
    { 
      id: 'h4', name: 'Lateral D', position: 'RB', 
      x: margin + 90, y: fieldHeight / 2 - 60, team: 'home', isWithBall: false,
      targetX: margin + 90, targetY: fieldHeight / 2 - 60,
      attributes: { PAC: 70, FIN: 45, PAS: 65, DRI: 60, DEF: 70, FIS: 75 } 
    },
    { 
      id: 'h5', name: 'Lateral E', position: 'LB', 
      x: margin + 90, y: fieldHeight / 2 + 60, team: 'home', isWithBall: false,
      targetX: margin + 90, targetY: fieldHeight / 2 + 60,
      attributes: { PAC: 70, FIN: 45, PAS: 65, DRI: 60, DEF: 70, FIS: 75 } 
    },
    // Meio-campistas - linha de 4
    { 
      id: 'h6', name: 'Volante', position: 'CDM', 
      x: margin + 180, y: fieldHeight / 2, team: 'home', isWithBall: false,
      targetX: margin + 180, targetY: fieldHeight / 2,
      attributes: { PAC: 70, FIN: 50, PAS: 70, DRI: 55, DEF: 75, FIS: 80 } 
    },
    { 
      id: 'h7', name: 'Meio 1', position: 'CM', 
      x: margin + 180, y: fieldHeight / 2 - 45, team: 'home', isWithBall: false,
      targetX: margin + 180, targetY: fieldHeight / 2 - 45,
      attributes: { PAC: 75, FIN: 60, PAS: 80, DRI: 70, DEF: 60, FIS: 75 } 
    },
    { 
      id: 'h8', name: 'Meio 2', position: 'CM', 
      x: margin + 180, y: fieldHeight / 2 + 45, team: 'home', isWithBall: false,
      targetX: margin + 180, targetY: fieldHeight / 2 + 45,
      attributes: { PAC: 75, FIN: 60, PAS: 80, DRI: 70, DEF: 60, FIS: 75 } 
    },
    { 
      id: 'h9', name: 'Ponta D', position: 'RM', 
      x: margin + 180, y: fieldHeight / 2 - 70, team: 'home', isWithBall: false,
      targetX: margin + 180, targetY: fieldHeight / 2 - 70,
      attributes: { PAC: 80, FIN: 65, PAS: 70, DRI: 75, DEF: 45, FIS: 70 } 
    },
    { 
      id: 'h10', name: 'Ponta E', position: 'LM', 
      x: margin + 180, y: fieldHeight / 2 + 70, team: 'home', isWithBall: false,
      targetX: margin + 180, targetY: fieldHeight / 2 + 70,
      attributes: { PAC: 80, FIN: 65, PAS: 70, DRI: 75, DEF: 45, FIS: 70 } 
    },
    // Atacantes - linha de 2
    { 
      id: 'h11', name: 'Atacante 1', position: 'ST', 
      x: margin + 270, y: fieldHeight / 2 - 30, team: 'home', isWithBall: false,
      targetX: margin + 270, targetY: fieldHeight / 2 - 30,
      attributes: { PAC: 75, FIN: 80, PAS: 60, DRI: 70, DEF: 40, FIS: 75 } 
    },
    { 
      id: 'h12', name: 'Atacante 2', position: 'ST', 
      x: margin + 270, y: fieldHeight / 2 + 30, team: 'home', isWithBall: false,
      targetX: margin + 270, targetY: fieldHeight / 2 + 30,
      attributes: { PAC: 75, FIN: 80, PAS: 60, DRI: 70, DEF: 40, FIS: 75 } 
    },
  ];

  // Criar jogadores do time visitante (formação 4-4-2 espelhada)
  const awayPlayers: VisualPlayer[] = [
    // Goleiro - posicionado no gol direito
    { 
      id: 'a1', name: 'Goleiro', position: 'GK', 
      x: fieldWidth - margin - 20, y: fieldHeight / 2, team: 'away', isWithBall: false,
      targetX: fieldWidth - margin - 20, targetY: fieldHeight / 2,
      attributes: { PAC: 60, FIN: 30, PAS: 50, DRI: 30, DEF: 70, FIS: 65, GOL: 75 } 
    },
    // Defensores - linha de 4
    { 
      id: 'a2', name: 'Zagueiro 1', position: 'CB', 
      x: fieldWidth - margin - 90, y: fieldHeight / 2 - 35, team: 'away', isWithBall: false,
      targetX: fieldWidth - margin - 90, targetY: fieldHeight / 2 - 35,
      attributes: { PAC: 65, FIN: 40, PAS: 60, DRI: 45, DEF: 75, FIS: 70 } 
    },
    { 
      id: 'a3', name: 'Zagueiro 2', position: 'CB', 
      x: fieldWidth - margin - 90, y: fieldHeight / 2 + 35, team: 'away', isWithBall: false,
      targetX: fieldWidth - margin - 90, targetY: fieldHeight / 2 + 35,
      attributes: { PAC: 65, FIN: 40, PAS: 60, DRI: 45, DEF: 75, FIS: 70 } 
    },
    { 
      id: 'a4', name: 'Lateral D', position: 'RB', 
      x: fieldWidth - margin - 90, y: fieldHeight / 2 - 60, team: 'away', isWithBall: false,
      targetX: fieldWidth - margin - 90, targetY: fieldHeight / 2 - 60,
      attributes: { PAC: 70, FIN: 45, PAS: 65, DRI: 60, DEF: 70, FIS: 75 } 
    },
    { 
      id: 'a5', name: 'Lateral E', position: 'LB', 
      x: fieldWidth - margin - 90, y: fieldHeight / 2 + 60, team: 'away', isWithBall: false,
      targetX: fieldWidth - margin - 90, targetY: fieldHeight / 2 + 60,
      attributes: { PAC: 70, FIN: 45, PAS: 65, DRI: 60, DEF: 70, FIS: 75 } 
    },
    // Meio-campistas - linha de 4
    { 
      id: 'a6', name: 'Volante', position: 'CDM', 
      x: fieldWidth - margin - 180, y: fieldHeight / 2, team: 'away', isWithBall: false,
      targetX: fieldWidth - margin - 180, targetY: fieldHeight / 2,
      attributes: { PAC: 70, FIN: 50, PAS: 70, DRI: 55, DEF: 75, FIS: 80 } 
    },
    { 
      id: 'a7', name: 'Meio 1', position: 'CM', 
      x: fieldWidth - margin - 180, y: fieldHeight / 2 - 45, team: 'away', isWithBall: false,
      targetX: fieldWidth - margin - 180, targetY: fieldHeight / 2 - 45,
      attributes: { PAC: 75, FIN: 60, PAS: 80, DRI: 70, DEF: 60, FIS: 75 } 
    },
    { 
      id: 'a8', name: 'Meio 2', position: 'CM', 
      x: fieldWidth - margin - 180, y: fieldHeight / 2 + 45, team: 'away', isWithBall: false,
      targetX: fieldWidth - margin - 180, targetY: fieldHeight / 2 + 45,
      attributes: { PAC: 75, FIN: 60, PAS: 80, DRI: 70, DEF: 60, FIS: 75 } 
    },
    { 
      id: 'a9', name: 'Ponta D', position: 'RM', 
      x: fieldWidth - margin - 180, y: fieldHeight / 2 - 70, team: 'away', isWithBall: false,
      targetX: fieldWidth - margin - 180, targetY: fieldHeight / 2 - 70,
      attributes: { PAC: 80, FIN: 65, PAS: 70, DRI: 75, DEF: 45, FIS: 70 } 
    },
    { 
      id: 'a10', name: 'Ponta E', position: 'LM', 
      x: fieldWidth - margin - 180, y: fieldHeight / 2 + 70, team: 'away', isWithBall: false,
      targetX: fieldWidth - margin - 180, targetY: fieldHeight / 2 + 70,
      attributes: { PAC: 80, FIN: 65, PAS: 70, DRI: 75, DEF: 45, FIS: 70 } 
    },
    // Atacantes - linha de 2
    { 
      id: 'a11', name: 'Atacante 1', position: 'ST', 
      x: fieldWidth - margin - 270, y: fieldHeight / 2 - 30, team: 'away', isWithBall: false,
      targetX: fieldWidth - margin - 270, targetY: fieldHeight / 2 - 30,
      attributes: { PAC: 75, FIN: 80, PAS: 60, DRI: 70, DEF: 40, FIS: 75 } 
    },
    { 
      id: 'a12', name: 'Atacante 2', position: 'ST', 
      x: fieldWidth - margin - 270, y: fieldHeight / 2 + 30, team: 'away', isWithBall: false,
      targetX: fieldWidth - margin - 270, targetY: fieldHeight / 2 + 30,
      attributes: { PAC: 75, FIN: 80, PAS: 60, DRI: 70, DEF: 40, FIS: 75 } 
    },
  ];

  // Bola começa no centro do campo
  const initialMatchState: VisualMatch = {
    homeTeam: {
      name: homeTeam?.name || 'Time Casa',
      colors: homeTeam?.colors || { primary: '#3B82F6', secondary: '#1E40AF' },
      players: homePlayers
    },
    awayTeam: {
      name: awayTeam?.name || 'Time Visitante',
      colors: awayTeam?.colors || { primary: '#EF4444', secondary: '#DC2626' },
      players: awayPlayers
    },
    ballPosition: { x: fieldWidth / 2, y: fieldHeight / 2, targetX: fieldWidth / 2, targetY: fieldHeight / 2 },
    ballVelocity: { x: 0, y: 0 },
    score: { home: 0, away: 0 },
    minute: 0,
    possession: { home: 50, away: 50 },
    status: 'pre_match',
    lastGoal: { team: null, minute: 0 }
  };
  
  // Dar a bola para um jogador inicial (meio-campista da casa)
  homePlayers[6].isWithBall = true; // Meio 1
  initialMatchState.ballPosition.x = homePlayers[6].x;
  initialMatchState.ballPosition.y = homePlayers[6].y;
  
  console.log('✅ Estado inicial da partida criado:', initialMatchState);
  return initialMatchState;
}
