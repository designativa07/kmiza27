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
  
  // Refs para o jogo
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<VisualMatch | null>(null);
  const timelineRef = useRef<TimelineEvent[] | null>(null);
  const currentEventIndexRef = useRef(0);
  const lastTimestampRef = useRef(0);
  const timeSinceLastEventRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  
  // Função para inicializar o jogo quando o canvas estiver pronto
  const initializeGame = useCallback(async () => {
    if (!canvasRef.current) {
      console.log('⏳ Canvas ainda não disponível');
      return;
    }
    
    try {
      console.log('🚀 Iniciando simulação visual...');
      
      // 1. Criar estado inicial do jogo
      const initialMatchState = initializeMatch(homeTeam, awayTeam);
      gameStateRef.current = initialMatchState;
      
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
      setIsLoading(false);
      setStatusText('Jogando');
      
      // 4. Iniciar loop do jogo
      startGameLoop();
      
    } catch (error) {
      console.error('❌ Erro ao carregar simulação:', error);
      setStatusText(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsLoading(false);
    }
  }, [matchId, homeTeam, awayTeam]);
  
  // useEffect com MutationObserver para detectar quando o canvas é adicionado ao DOM
  useEffect(() => {
    console.log('🎨 useEffect com MutationObserver iniciado');
    
    // Função para verificar se o canvas está disponível
    const checkCanvas = () => {
      if (canvasRef.current) {
        console.log('✅ Canvas disponível via MutationObserver, inicializando jogo...');
        initializeGame();
        return true;
      }
      return false;
    };
    
    // Verificar imediatamente
    if (checkCanvas()) {
      return;
    }
    
    // Se não estiver disponível, configurar MutationObserver
    console.log('⏳ Canvas não disponível, configurando MutationObserver...');
    
    // Configurar MutationObserver para detectar mudanças no DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Verificar se o canvas foi adicionado
          if (checkCanvas()) {
            console.log('🎯 Canvas detectado via MutationObserver!');
            observer.disconnect();
          }
        }
      });
    });
    
    // Observar mudanças no body (onde o modal é renderizado)
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Fallback: verificar periodicamente também
    const interval = setInterval(() => {
      if (checkCanvas()) {
        console.log('🎯 Canvas detectado via fallback interval!');
        clearInterval(interval);
        observer.disconnect();
      }
    }, 100);
    
    return () => {
      console.log('🧹 Cleanup do useEffect com MutationObserver');
      observer.disconnect();
      clearInterval(interval);
    };
  }, [initializeGame]);
  
  // Função para iniciar o loop do jogo
  const startGameLoop = () => {
    console.log('🎮 Iniciando loop do jogo...');
    
    const gameLoop = (timestamp: number) => {
      if (isPaused || !gameStateRef.current || !timelineRef.current) {
        lastTimestampRef.current = timestamp;
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }
      
      const state = gameStateRef.current;
      
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
        
        // Redesenhar
        draw();
      }
      
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };
    
    // Definir status inicial como 'playing'
    if (gameStateRef.current) {
      gameStateRef.current.status = 'playing';
    }
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  };

  const processEvent = (event: TimelineEvent, state: VisualMatch) => {
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
  };

  const findPlayer = (id: string, state: VisualMatch): VisualPlayer | undefined => {
    return [...state.homeTeam.players, ...state.awayTeam.players].find(p => p.id === id);
  };

  const updatePlayerPositions = (state: VisualMatch) => {
    const speed = 0.05;
    
    // Atualizar posições dos jogadores da casa
    state.homeTeam.players.forEach(player => {
      const dx = player.targetX - player.x;
      const dy = player.targetY - player.y;
      player.x += dx * speed;
      player.y += dy * speed;
    });
    
    // Atualizar posições dos jogadores visitantes
    state.awayTeam.players.forEach(player => {
      const dx = player.targetX - player.x;
      const dy = player.targetY - player.y;
      player.x += dx * speed;
      player.y += dy * speed;
    });
    
    // Atualizar posição da bola
    const ballDx = state.ballPosition.targetX - state.ballPosition.x;
    const ballDy = state.ballPosition.targetY - state.ballPosition.y;
    state.ballPosition.x += ballDx * speed;
    state.ballPosition.y += ballDy * speed;
  };

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
  };

  // Função de Desenho
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
  }, []);

  const drawField = (ctx: CanvasRenderingContext2D) => {
    // Campo verde
    ctx.fillStyle = '#2D5A27';
    ctx.fillRect(0, 0, 400, 200);
    
    // Linhas brancas
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    
    // Linha central
    ctx.beginPath();
    ctx.moveTo(200, 0);
    ctx.lineTo(200, 200);
    ctx.stroke();
    
    // Círculo central
    ctx.beginPath();
    ctx.arc(200, 100, 30, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Áreas do gol
    ctx.strokeRect(0, 60, 40, 80); // Gol esquerdo
    ctx.strokeRect(360, 60, 40, 80); // Gol direito
  };

  const drawGoals = (ctx: CanvasRenderingContext2D) => {
    // Traves
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    
    // Gol esquerdo
    ctx.beginPath();
    ctx.moveTo(0, 60);
    ctx.lineTo(0, 140);
    ctx.stroke();
    
    // Gol direito
    ctx.beginPath();
    ctx.moveTo(400, 60);
    ctx.lineTo(400, 140);
    ctx.stroke();
  };

  const drawPlayers = (ctx: CanvasRenderingContext2D, state: VisualMatch) => {
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
  };

  const drawBall = (ctx: CanvasRenderingContext2D, state: VisualMatch) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(state.ballPosition.x, state.ballPosition.y, 4, 0, 2 * Math.PI);
    ctx.fill();
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

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold">{statusText}</p>
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
            ref={canvasRef}
            width={400}
            height={200}
            className="border-2 border-gray-300 bg-green-800"
          />
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
  
  // Campo: 400x200, com margens para as traves
  const fieldWidth = 400;
  const fieldHeight = 200;
  const margin = 20;

  // Criar jogadores do time da casa (formação 4-4-2 realista)
  const homePlayers: VisualPlayer[] = [
    // Goleiro - posicionado no gol esquerdo
    { 
      id: 'h1', name: 'Goleiro', position: 'GK', 
      x: margin + 15, y: fieldHeight / 2, team: 'home', isWithBall: false,
      targetX: margin + 15, targetY: fieldHeight / 2,
      attributes: { PAC: 60, FIN: 30, PAS: 50, DRI: 30, DEF: 70, FIS: 65, GOL: 75 } 
    },
    // Defensores - linha de 4
    { 
      id: 'h2', name: 'Zagueiro 1', position: 'CB', 
      x: margin + 60, y: fieldHeight / 2 - 25, team: 'home', isWithBall: false,
      targetX: margin + 60, targetY: fieldHeight / 2 - 25,
      attributes: { PAC: 65, FIN: 40, PAS: 60, DRI: 45, DEF: 75, FIS: 70 } 
    },
    { 
      id: 'h3', name: 'Zagueiro 2', position: 'CB', 
      x: margin + 60, y: fieldHeight / 2 + 25, team: 'home', isWithBall: false,
      targetX: margin + 60, targetY: fieldHeight / 2 + 25,
      attributes: { PAC: 65, FIN: 40, PAS: 60, DRI: 45, DEF: 75, FIS: 70 } 
    },
    { 
      id: 'h4', name: 'Lateral D', position: 'RB', 
      x: margin + 60, y: fieldHeight / 2 - 40, team: 'home', isWithBall: false,
      targetX: margin + 60, targetY: fieldHeight / 2 - 40,
      attributes: { PAC: 70, FIN: 45, PAS: 65, DRI: 60, DEF: 70, FIS: 75 } 
    },
    { 
      id: 'h5', name: 'Lateral E', position: 'LB', 
      x: margin + 60, y: fieldHeight / 2 + 40, team: 'home', isWithBall: false,
      targetX: margin + 60, targetY: fieldHeight / 2 + 40,
      attributes: { PAC: 70, FIN: 45, PAS: 65, DRI: 60, DEF: 70, FIS: 75 } 
    },
    // Meio-campistas - linha de 4
    { 
      id: 'h6', name: 'Volante', position: 'CDM', 
      x: margin + 120, y: fieldHeight / 2, team: 'home', isWithBall: false,
      targetX: margin + 120, targetY: fieldHeight / 2,
      attributes: { PAC: 70, FIN: 50, PAS: 70, DRI: 55, DEF: 75, FIS: 80 } 
    },
    { 
      id: 'h7', name: 'Meio 1', position: 'CM', 
      x: margin + 120, y: fieldHeight / 2 - 30, team: 'home', isWithBall: false,
      targetX: margin + 120, targetY: fieldHeight / 2 - 30,
      attributes: { PAC: 75, FIN: 60, PAS: 80, DRI: 70, DEF: 60, FIS: 75 } 
    },
    { 
      id: 'h8', name: 'Meio 2', position: 'CM', 
      x: margin + 120, y: fieldHeight / 2 + 30, team: 'home', isWithBall: false,
      targetX: margin + 120, targetY: fieldHeight / 2 + 30,
      attributes: { PAC: 75, FIN: 60, PAS: 80, DRI: 70, DEF: 60, FIS: 75 } 
    },
    { 
      id: 'h9', name: 'Ponta D', position: 'RM', 
      x: margin + 120, y: fieldHeight / 2 - 45, team: 'home', isWithBall: false,
      targetX: margin + 120, targetY: fieldHeight / 2 - 45,
      attributes: { PAC: 80, FIN: 65, PAS: 70, DRI: 75, DEF: 45, FIS: 70 } 
    },
    { 
      id: 'h10', name: 'Ponta E', position: 'LM', 
      x: margin + 120, y: fieldHeight / 2 + 45, team: 'home', isWithBall: false,
      targetX: margin + 120, targetY: fieldHeight / 2 + 45,
      attributes: { PAC: 80, FIN: 65, PAS: 70, DRI: 75, DEF: 45, FIS: 70 } 
    },
    // Atacantes - linha de 2
    { 
      id: 'h11', name: 'Atacante 1', position: 'ST', 
      x: margin + 180, y: fieldHeight / 2 - 20, team: 'home', isWithBall: false,
      targetX: margin + 180, targetY: fieldHeight / 2 - 20,
      attributes: { PAC: 75, FIN: 80, PAS: 60, DRI: 70, DEF: 40, FIS: 75 } 
    },
    { 
      id: 'h12', name: 'Atacante 2', position: 'ST', 
      x: margin + 180, y: fieldHeight / 2 + 20, team: 'home', isWithBall: false,
      targetX: margin + 180, targetY: fieldHeight / 2 + 20,
      attributes: { PAC: 75, FIN: 80, PAS: 60, DRI: 70, DEF: 40, FIS: 75 } 
    },
  ];

  // Criar jogadores do time visitante (formação 4-4-2 espelhada)
  const awayPlayers: VisualPlayer[] = [
    // Goleiro - posicionado no gol direito
    { 
      id: 'a1', name: 'Goleiro', position: 'GK', 
      x: fieldWidth - margin - 15, y: fieldHeight / 2, team: 'away', isWithBall: false,
      targetX: fieldWidth - margin - 15, targetY: fieldHeight / 2,
      attributes: { PAC: 60, FIN: 30, PAS: 50, DRI: 30, DEF: 70, FIS: 65, GOL: 75 } 
    },
    // Defensores - linha de 4
    { 
      id: 'a2', name: 'Zagueiro 1', position: 'CB', 
      x: fieldWidth - margin - 60, y: fieldHeight / 2 - 25, team: 'away', isWithBall: false,
      targetX: fieldWidth - margin - 60, targetY: fieldHeight / 2 - 25,
      attributes: { PAC: 65, FIN: 40, PAS: 60, DRI: 45, DEF: 75, FIS: 70 } 
    },
    { 
      id: 'a3', name: 'Zagueiro 2', position: 'CB', 
      x: fieldWidth - margin - 60, y: fieldHeight / 2 + 25, team: 'away', isWithBall: false,
      targetX: fieldWidth - margin - 60, targetY: fieldHeight / 2 + 25,
      attributes: { PAC: 65, FIN: 40, PAS: 60, DRI: 45, DEF: 75, FIS: 70 } 
    },
    { 
      id: 'a4', name: 'Lateral D', position: 'RB', 
      x: fieldWidth - margin - 60, y: fieldHeight / 2 - 40, team: 'away', isWithBall: false,
      targetX: fieldWidth - margin - 60, targetY: fieldHeight / 2 - 40,
      attributes: { PAC: 70, FIN: 45, PAS: 65, DRI: 60, DEF: 70, FIS: 75 } 
    },
    { 
      id: 'a5', name: 'Lateral E', position: 'LB', 
      x: fieldWidth - margin - 60, y: fieldHeight / 2 + 40, team: 'away', isWithBall: false,
      targetX: fieldWidth - margin - 60, targetY: fieldHeight / 2 + 40,
      attributes: { PAC: 70, FIN: 45, PAS: 65, DRI: 60, DEF: 70, FIS: 75 } 
    },
    // Meio-campistas - linha de 4
    { 
      id: 'a6', name: 'Volante', position: 'CDM', 
      x: fieldWidth - margin - 120, y: fieldHeight / 2, team: 'away', isWithBall: false,
      targetX: fieldWidth - margin - 120, targetY: fieldHeight / 2,
      attributes: { PAC: 70, FIN: 50, PAS: 70, DRI: 55, DEF: 75, FIS: 80 } 
    },
    { 
      id: 'a7', name: 'Meio 1', position: 'CM', 
      x: fieldWidth - margin - 120, y: fieldHeight / 2 - 30, team: 'away', isWithBall: false,
      targetX: fieldWidth - margin - 120, targetY: fieldHeight / 2 - 30,
      attributes: { PAC: 75, FIN: 60, PAS: 80, DRI: 70, DEF: 60, FIS: 75 } 
    },
    { 
      id: 'a8', name: 'Meio 2', position: 'CM', 
      x: fieldWidth - margin - 120, y: fieldHeight / 2 + 30, team: 'away', isWithBall: false,
      targetX: fieldWidth - margin - 120, targetY: fieldHeight / 2 + 30,
      attributes: { PAC: 75, FIN: 60, PAS: 80, DRI: 70, DEF: 60, FIS: 75 } 
    },
    { 
      id: 'a9', name: 'Ponta D', position: 'RM', 
      x: fieldWidth - margin - 120, y: fieldHeight / 2 - 45, team: 'away', isWithBall: false,
      targetX: fieldWidth - margin - 120, targetY: fieldHeight / 2 - 45,
      attributes: { PAC: 80, FIN: 65, PAS: 70, DRI: 75, DEF: 45, FIS: 70 } 
    },
    { 
      id: 'a10', name: 'Ponta E', position: 'LM', 
      x: fieldWidth - margin - 120, y: fieldHeight / 2 + 45, team: 'away', isWithBall: false,
      targetX: fieldWidth - margin - 120, targetY: fieldHeight / 2 + 45,
      attributes: { PAC: 80, FIN: 65, PAS: 70, DRI: 75, DEF: 45, FIS: 70 } 
    },
    // Atacantes - linha de 2
    { 
      id: 'a11', name: 'Atacante 1', position: 'ST', 
      x: fieldWidth - margin - 180, y: fieldHeight / 2 - 20, team: 'away', isWithBall: false,
      targetX: fieldWidth - margin - 180, targetY: fieldHeight / 2 - 20,
      attributes: { PAC: 75, FIN: 80, PAS: 60, DRI: 70, DEF: 40, FIS: 75 } 
    },
    { 
      id: 'a12', name: 'Atacante 2', position: 'ST', 
      x: fieldWidth - margin - 180, y: fieldHeight / 2 + 20, team: 'away', isWithBall: false,
      targetX: fieldWidth - margin - 180, targetY: fieldHeight / 2 + 20,
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
  
  console.log('✅ Estado inicial da partida criado:', initialMatchState);
  return initialMatchState;
}
