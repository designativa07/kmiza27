'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { GameTeam } from '@/lib/supabase';
import CompetitionsManagerReformed from '@/components/CompetitionsManagerReformed';
import SeasonEndModal from '@/components/SeasonEndModal';
import { gameApiReformed, SeasonMatch } from '@/services/gameApiReformed';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Landmark, Users, Star, Play, Calendar, Swords, Trophy, GraduationCap, ShieldAlert, Settings, Building, Newspaper, Dumbbell, Target, Heart, ShoppingCart } from 'lucide-react';
import TeamPlayers from './TeamPlayers';
import StadiumExpansion from './StadiumExpansion';
import YouthAcademy from './YouthAcademy';
import AcademyPanel from './AcademyPanel';
import TrainingPanel from './TrainingPanel';
import FinanceManager from './FinanceManager';
import Marketplace from './Marketplace';
import MarketNotifications from './MarketNotifications';

import NewsFeed from './NewsFeed';

type ActiveView = 'dashboard' | 'players' | 'stadium' | 'academy' | 'training' | 'finances' | 'market' | 'offers';

export default function TeamPageContent() {
  const params = useParams();
  const router = useRouter();
  const { userTeams, selectedTeam, loadTeams, setSelectedTeam, deleteTeam, isLoading, error } = useGameStore();
  const [team, setTeam] = useState<GameTeam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [seasonEndModal, setSeasonEndModal] = useState<{
    isOpen: boolean;
    seasonResult: any;
  }>({ isOpen: false, seasonResult: null });
  const [upcomingMatches, setUpcomingMatches] = useState<SeasonMatch[]>([]);
  const [simulatingMatch, setSimulatingMatch] = useState<string | null>(null);
  const [recentMatches, setRecentMatches] = useState<SeasonMatch[]>([]);
  const [competitionData, setCompetitionData] = useState<any>(null);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [playersCount, setPlayersCount] = useState<number>(0);
  const [academyPlayersCount, setAcademyPlayersCount] = useState<number>(0);
  const [professionalPlayersCount, setProfessionalPlayersCount] = useState<number>(0);

  const teamId = params.teamId as string;

  const loadData = async () => {
    if (!selectedTeam) return;
    try {
      console.log('📊 Carregando dados do time...', selectedTeam.owner_id);
      
      const [matches, recent, progress] = await Promise.all([
        gameApiReformed.getUserUpcomingMatches(selectedTeam.owner_id, 10),
        gameApiReformed.getUserRecentMatches(selectedTeam.owner_id, 10),
        gameApiReformed.getUserCurrentProgress(selectedTeam.owner_id)
      ]);
      
      console.log('📈 Dados recebidos:', {
        progress: progress ? `${progress.points} pts, ${progress.games_played} jogos, posição ${progress.position}` : 'null',
        upcomingMatches: matches.length,
        recentMatches: recent.length
      });
      
      setUpcomingMatches(matches);
      setRecentMatches(recent);
      setCompetitionData(progress);
      
      await loadPlayersData();
    } catch (error) {
      console.error('Erro ao carregar dados do time:', error);
    }
  };

  // Função separada para carregar dados dos jogadores
  const loadPlayersData = async () => {
    if (!selectedTeam) return;
    
    try {
      // Buscar jogadores profissionais
      const plist = await gameApiReformed.getPlayers(selectedTeam.id);
      const professionalCount = Array.isArray(plist) ? plist.length : 0;
      setPlayersCount(professionalCount);
      setProfessionalPlayersCount(professionalCount);
      console.log('👥 Jogadores Profissionais:', professionalCount);
      
      // Buscar jogadores da academia
      try {
        const academyResponse = await fetch(`http://localhost:3004/api/v2/api/v2/academy/players?teamId=${selectedTeam.id}`);
        if (academyResponse.ok) {
          const academyData = await academyResponse.json();
          if (academyData.success) {
            const academyCount = academyData.data.length;
            setAcademyPlayersCount(academyCount);
            console.log('🎓 Jogadores da Academia:', academyCount);
          }
        }
      } catch (academyError) {
        console.log('⚠️ Erro ao carregar academia:', academyError);
      }
    } catch (error) {
      console.error('Erro ao carregar dados dos jogadores:', error);
    }
  };
  
  const simulateMatch = async (matchId: string) => {
    if (!selectedTeam) return;
    try {
      setSimulatingMatch(matchId);
      console.log('🎮 Iniciando simulação de partida:', matchId);
      
      await gameApiReformed.simulateMatch(matchId, selectedTeam.owner_id);
      console.log('✅ Partida simulada, aguardando processamento...');
      
      // Aguardar mais tempo para garantir que o backend processou completamente
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Múltiplas tentativas de atualização para garantir dados frescos
      for (let i = 0; i < 3; i++) {
        console.log(`🔄 Tentativa ${i + 1} de atualização de dados`);
        await loadData();
        setRefreshKey(prev => prev + 1);
        
        if (i < 2) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      console.log('🎉 Atualização completa!');
      
    } catch (error) {
      console.error('Erro ao simular partida:', error);
      alert('Erro ao simular partida. Tente novamente.');
    } finally {
      setSimulatingMatch(null);
    }
  };

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    if (selectedTeam) {
      loadData();
    }
  }, [selectedTeam, refreshKey]);

  useEffect(() => {
    if (userTeams.length > 0) {
      const foundTeam = userTeams.find(t => t.id === teamId);
      if (foundTeam) {
        setTeam(foundTeam);
        setSelectedTeam(foundTeam);
      } else {
        router.push('/');
      }
    }
  }, [userTeams, teamId, setSelectedTeam, router]);
  
  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
            {/* Coluna Esquerda */}
            <div className="lg:col-span-7 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {upcomingMatches.length > 0 && (
                  <Card className="bg-emerald-600 border-emerald-700 shadow-md text-white">
                    <CardHeader>
                      <CardTitle className="text-xl text-white flex items-center">
                        <Calendar className="h-5 w-5 mr-2" /> Próxima Partida
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col h-full justify-between">
                        <div>
                          <p className="text-lg font-semibold flex items-center">
                            <Swords className="h-5 w-5 mr-2 opacity-80" />
                            {upcomingMatches[0].home_team_id === team!.id ? 'Casa' : 'Fora'} vs {upcomingMatches[0].home_team_id === team!.id ? upcomingMatches[0].away_machine?.name : upcomingMatches[0].home_machine?.name}
                          </p>
                          <p className="text-sm opacity-90 mt-1 ml-7">Rodada {upcomingMatches[0].round_number}</p>
                          <p className="text-sm opacity-80 ml-7">{new Date(upcomingMatches[0].match_date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                        </div>
                        {upcomingMatches[0].status === 'scheduled' && (
                          <Button size="lg" onClick={() => simulateMatch(upcomingMatches[0].id)} disabled={simulatingMatch === upcomingMatches[0].id} className="w-full mt-4 text-md font-bold bg-white text-emerald-700 hover:bg-slate-50">
                            <Play className="h-5 w-5 mr-2" />{simulatingMatch === upcomingMatches[0].id ? 'Jogando...' : 'JOGAR'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
                                       {recentMatches.length > 0 && (
                         <Card className="bg-white border-slate-200 shadow-md">
                           <CardHeader className="pb-3">
                             <CardTitle className="text-lg flex items-center text-slate-700"><Calendar className="h-4 w-4 mr-2" />Última Partida</CardTitle>
                           </CardHeader>
                           <CardContent className="text-center space-y-2">
                             <p className="text-sm text-slate-600 font-medium">{recentMatches[0].home_team_id === team!.id ? 'Casa' : 'Fora'} vs {recentMatches[0].home_team_id === team!.id ? recentMatches[0].away_machine?.name : recentMatches[0].home_machine?.name}</p>
                             <div className="text-3xl font-bold text-slate-800 bg-slate-50 rounded-lg px-3 py-1 border border-slate-200">
                               {recentMatches[0].home_team_id === team!.id ? recentMatches[0].home_score : recentMatches[0].away_score} - {recentMatches[0].home_team_id === team!.id ? recentMatches[0].away_score : recentMatches[0].home_score}
                             </div>
                             <div className={`text-sm font-semibold px-3 py-1 rounded-full ${
                               recentMatches[0].home_team_id === team!.id ?
                                 (recentMatches[0].home_score > recentMatches[0].away_score ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : recentMatches[0].home_score < recentMatches[0].away_score ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-amber-100 text-amber-700 border border-amber-300') :
                                 (recentMatches[0].away_score > recentMatches[0].home_score ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : recentMatches[0].away_score < recentMatches[0].home_score ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-amber-100 text-amber-700 border border-amber-300')
                             }`}>
                               {recentMatches[0].home_team_id === team!.id ? 
                                 (recentMatches[0].home_score > recentMatches[0].away_score ? 'Vitória' : recentMatches[0].home_score < recentMatches[0].away_score ? 'Derrota' : 'Empate') :
                                 (recentMatches[0].away_score > recentMatches[0].home_score ? 'Vitória' : recentMatches[0].away_score < recentMatches[0].home_score ? 'Derrota' : 'Empate')
                               }
                             </div>
                             <p className="text-xs text-slate-500 font-medium">Forma Recente: V-D-E-V-V</p>
                           </CardContent>
                         </Card>
                       )}
              </div>
              <Card className="bg-white border-slate-200 shadow-md">
                <CardContent className="p-0">
                  <CompetitionsManagerReformed 
                    onSeasonEnd={(seasonResult) => setSeasonEndModal({ isOpen: true, seasonResult })}
                    refreshKey={refreshKey}
                  />
                </CardContent>
              </Card>
            </div>
            {/* Coluna Direita */}
            <div className="lg:col-span-3 space-y-6">
              {/* PAINEL UNIFICADO - Visão Geral + Ações + Status */}
              <Card className="bg-white border-slate-200 shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center text-slate-700">
                    <Target className="h-5 w-4 mr-2" />
                    Painel do Clube
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* SEÇÃO 1: ESTATÍSTICAS PRINCIPAIS */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">📊 Estatísticas</h4>
                    
                    {/* Orçamento */}
                    <div 
                      className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-200 cursor-pointer hover:bg-emerald-100 transition-colors"
                      onClick={() => setActiveView('finances')}
                      title="Clique para gerenciar as finanças"
                    >
                      <span className="text-emerald-700 flex items-center">
                        <Landmark className="h-4 w-4 mr-2" /> 
                        Orçamento
                      </span>
                      <span className="font-bold text-emerald-700">
                        R$ {(team!.budget || 0).toLocaleString()}
                      </span>
                    </div>

                    {/* Estádio */}
                    <div 
                      className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => setActiveView('stadium')}
                      title="Clique para gerenciar o estádio"
                    >
                      <span className="text-slate-700 flex items-center">
                        <Building className="h-4 w-4 mr-2" /> 
                        Estádio
                      </span>
                      <span className="font-semibold text-slate-700">
                        {(team!.stadium_capacity || 0).toLocaleString()} lugares
                      </span>
                    </div>

                    {/* Elenco */}
                    <div 
                      className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => setActiveView('players')}
                      title="Clique para ver o elenco completo"
                    >
                      <span className="text-blue-700 flex items-center">
                        <Users className="h-4 w-4 mr-2" /> 
                        Elenco
                      </span>
                      <span className="font-semibold text-blue-700">
                        {playersCount} jogadores
                      </span>
                    </div>

                    {/* Juniores */}
                    <div 
                      className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
                      onClick={() => setActiveView('academy')}
                      title="Clique para ver a academia de juniores"
                    >
                      <span className="text-green-700 flex items-center">
                        <GraduationCap className="h-4 w-4 mr-2" /> 
                        Juniores
                      </span>
                      <span className="font-semibold text-green-700">
                        {academyPlayersCount} jogadores
                      </span>
                    </div>

                    {/* Mercado */}
                    <div 
                      className="flex justify-between items-center p-3 bg-cyan-50 rounded-lg border border-cyan-200 cursor-pointer hover:bg-cyan-100 transition-colors"
                      onClick={() => setActiveView('market')}
                      title="Clique para acessar o mercado de transferências"
                    >
                      <span className="text-cyan-700 flex items-center">
                        <ShoppingCart className="h-4 w-4 mr-2" /> 
                        Mercado
                      </span>
                    </div>

                    {/* Centro de Treinamento */}
                    <div 
                      className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200 cursor-pointer hover:bg-orange-100 transition-colors"
                      onClick={() => setActiveView('training')}
                      title="Clique para acessar o centro de treinamento"
                    >
                      <span className="text-orange-700 flex items-center">
                        <Dumbbell className="h-4 w-4 mr-2" /> 
                        Centro de Treinamento
                      </span>
                    </div>

                    {/* Área Técnica */}
                    <a 
                      href={`/team/${team!.id}/tactics`}
                      className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg border border-indigo-200 cursor-pointer hover:bg-indigo-100 transition-colors no-underline"
                      title="Clique para definir as táticas da equipe"
                    >
                      <span className="text-indigo-700 flex items-center">
                        <Settings className="h-4 w-4 mr-2" /> 
                        Área Técnica
                      </span>
                    </a>

                  </div>

                  {/* SEÇÃO 3: TORCIDA */}
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">🎟️ Torcida</h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-purple-50 rounded-lg border border-purple-200">
                        <span className="text-purple-700 flex items-center text-xs">
                          <Heart className="h-3 w-3 mr-1" /> 
                          Torcedores
                        </span>
                        <span className="font-semibold text-purple-700 text-xs">
                          {(team!.fan_base || 0).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-2 bg-orange-50 rounded-lg border border-orange-200">
                        <span className="text-orange-700 flex items-center text-xs">
                          <Heart className="h-3 w-3 mr-1" /> 
                          Moral
                        </span>
                        <span className="font-semibold text-orange-700 text-xs">Neutra</span>
                      </div>

                      <div className="flex justify-between items-center p-2 bg-amber-50 rounded-lg border border-amber-200">
                        <span className="text-amber-700 flex items-center text-xs">
                          <Star className="h-3 w-3 mr-1" /> 
                          Reputação
                        </span>
                        <span className="font-semibold text-amber-700 text-xs">
                          {team!.reputation || 0}
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-2 bg-rose-50 rounded-lg border border-rose-200">
                        <span className="text-rose-700 flex items-center text-xs">
                          <Star className="h-3 w-3 mr-1" /> 
                          Humor
                        </span>
                        <span className="font-semibold text-rose-700 text-xs">
                          {team!.reputation || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                </CardContent>
              </Card>

              {/* WIDGET COMPLEMENTAR */}
              <NewsFeed />
            </div>
          </div>
        );
      case 'players':
        return <TeamPlayers 
          teamId={team!.id} 
          teamName={team!.name} 
          onPlayerChanges={loadPlayersData}
        />;
      case 'stadium':
        return <StadiumExpansion team={team!} />;
      case 'academy':
                        return <AcademyPanel 
                  teamId={team!.id} 
                  onPlayerPromoted={loadPlayersData}
                />;
              case 'training':
          return <TrainingPanel 
            teamId={team!.id} 
            onPlayerChanges={loadPlayersData}
          />;
      case 'finances':
        return <FinanceManager />;
      case 'market':
        return <Marketplace />;
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
            {/* Coluna Esquerda */}
            <div className="lg:col-span-7 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {upcomingMatches.length > 0 && (
                  <Card className="bg-emerald-600 border-emerald-700 shadow-md text-white">
                    <CardHeader>
                      <CardTitle className="text-xl text-white flex items-center">
                        <Calendar className="h-5 w-5 mr-2" /> Próxima Partida
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col h-full justify-between">
                        <div>
                          <p className="text-lg font-semibold flex items-center">
                            <Swords className="h-5 w-5 mr-2 opacity-80" />
                            {upcomingMatches[0].home_team_id === team!.id ? 'Casa' : 'Fora'} vs {upcomingMatches[0].home_team_id === team!.id ? upcomingMatches[0].away_machine?.name : upcomingMatches[0].home_machine?.name}
                          </p>
                          <p className="text-sm opacity-90 mt-1 ml-7">Rodada {upcomingMatches[0].round_number}</p>
                          <p className="text-sm opacity-80 ml-7">{new Date(upcomingMatches[0].match_date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                        </div>
                        {upcomingMatches[0].status === 'scheduled' && (
                          <Button size="lg" onClick={() => simulateMatch(upcomingMatches[0].id)} disabled={simulatingMatch === upcomingMatches[0].id} className="w-full mt-4 text-md font-bold bg-white text-emerald-700 hover:bg-slate-50">
                            <Play className="h-5 w-5 mr-2" />{simulatingMatch === upcomingMatches[0].id ? 'Jogando...' : 'JOGAR'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
                                       {recentMatches.length > 0 && (
                         <Card className="bg-white border-slate-200 shadow-md">
                           <CardHeader className="pb-3">
                             <CardTitle className="text-lg flex items-center text-slate-700"><Calendar className="h-4 w-4 mr-2" />Última Partida</CardTitle>
                           </CardHeader>
                           <CardContent className="text-center space-y-2">
                             <p className="text-sm text-slate-600 font-medium">{recentMatches[0].home_team_id === team!.id ? 'Casa' : 'Fora'} vs {recentMatches[0].home_team_id === team!.id ? recentMatches[0].away_machine?.name : recentMatches[0].home_machine?.name}</p>
                             <div className="text-3xl font-bold text-slate-800 bg-slate-50 rounded-lg px-3 py-1 border border-slate-200">
                               {recentMatches[0].home_team_id === team!.id ? recentMatches[0].home_score : recentMatches[0].away_score} - {recentMatches[0].home_team_id === team!.id ? recentMatches[0].away_score : recentMatches[0].home_score}
                             </div>
                             <div className={`text-sm font-semibold px-3 py-1 rounded-full ${
                               recentMatches[0].home_team_id === team!.id ?
                                 (recentMatches[0].home_score > recentMatches[0].away_score ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : recentMatches[0].home_score < recentMatches[0].away_score ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-amber-100 text-amber-700 border border-amber-300') :
                                 (recentMatches[0].away_score > recentMatches[0].home_score ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : recentMatches[0].away_score < recentMatches[0].home_score ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-amber-100 text-amber-700 border border-amber-300')
                             }`}>
                               {recentMatches[0].home_team_id === team!.id ? 
                                 (recentMatches[0].home_score > recentMatches[0].away_score ? 'Vitória' : recentMatches[0].home_score < recentMatches[0].away_score ? 'Derrota' : 'Empate') :
                                 (recentMatches[0].away_score > recentMatches[0].home_score ? 'Vitória' : recentMatches[0].away_score < recentMatches[0].home_score ? 'Derrota' : 'Empate')
                               }
                             </div>
                             <p className="text-xs text-slate-500 font-medium">Forma Recente: V-D-E-V-V</p>
                           </CardContent>
                         </Card>
                       )}
              </div>
              <Card className="bg-white border-slate-200 shadow-md">
                <CardContent className="p-0">
                  <CompetitionsManagerReformed 
                    onSeasonEnd={(seasonResult) => setSeasonEndModal({ isOpen: true, seasonResult })}
                    refreshKey={refreshKey}
                  />
                </CardContent>
              </Card>
            </div>
            {/* Coluna Direita */}
            <div className="lg:col-span-3 space-y-6">
              {/* PAINEL UNIFICADO - Visão Geral + Ações + Status */}
              <Card className="bg-white border-slate-200 shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center text-slate-700">
                    <Target className="h-5 w-4 mr-2" />
                    Painel do Clube
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* SEÇÃO 1: ESTATÍSTICAS PRINCIPAIS */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">📊 Estatísticas</h4>
                    
                    {/* Orçamento */}
                    <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="text-emerald-700 flex items-center">
                        <Landmark className="h-4 w-4 mr-2" /> 
                        Orçamento
                      </span>
                      <span className="font-bold text-emerald-700">
                        R$ {(team!.budget || 0).toLocaleString()}
                      </span>
                    </div>

                    {/* Estádio */}
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-700 flex items-center">
                        <Building className="h-4 w-4 mr-2" /> 
                        Estádio
                      </span>
                      <span className="font-semibold text-slate-700">
                        {(team!.stadium_capacity || 0).toLocaleString()} lugares
                      </span>
                    </div>

                    {/* Elenco Profissional */}
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-blue-700 flex items-center">
                        <Users className="h-4 w-4 mr-2" /> 
                        Elenco Profissional
                      </span>
                      <span className="font-semibold text-blue-700">
                        {professionalPlayersCount} jogadores
                      </span>
                    </div>

                    {/* Academia de Base */}
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-green-700 flex items-center">
                        <GraduationCap className="h-4 w-4 mr-2" /> 
                        Academia de Base
                      </span>
                      <span className="font-semibold text-green-700">
                        {academyPlayersCount} jogadores
                      </span>
                    </div>

                    {/* Total de Jogadores */}
                    <div 
                      className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors"
                      onClick={() => setActiveView('players')}
                      title="Clique para ver o elenco completo"
                    >
                      <span className="text-purple-700 flex items-center">
                        <Users className="h-4 w-4 mr-2" /> 
                        Total de Jogadores
                      </span>
                      <span className="font-semibold text-purple-700">
                        {professionalPlayersCount + academyPlayersCount} jogadores
                      </span>
                    </div>

                    {/* Reputação */}
                    <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <span className="text-amber-700 flex items-center">
                        <Star className="h-4 w-4 mr-2" /> 
                        Reputação
                      </span>
                      <span className="font-semibold text-amber-700">
                        {team!.reputation || 0}
                      </span>
                    </div>
                  </div>

                  {/* SEÇÃO 3: TORCIDA */}
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">🎟️ Torcida</h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-purple-50 rounded-lg border border-purple-200">
                        <span className="text-purple-700 flex items-center text-xs">
                          <Heart className="h-3 w-3 mr-1" /> 
                          Torcedores
                        </span>
                        <span className="font-semibold text-purple-700 text-xs">
                          {(team!.fan_base || 0).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-2 bg-orange-50 rounded-lg border border-orange-200">
                        <span className="text-orange-700 flex items-center text-xs">
                          <Heart className="h-3 w-3 mr-1" /> 
                          Moral
                        </span>
                        <span className="font-semibold text-orange-700 text-xs">Neutra</span>
                      </div>

                      <div className="flex justify-between items-center p-2 bg-amber-50 rounded-lg border border-amber-200">
                        <span className="text-amber-700 flex items-center text-xs">
                          <Star className="h-3 w-3 mr-1" /> 
                          Reputação
                        </span>
                        <span className="font-semibold text-amber-700 text-xs">
                          {team!.reputation || 0}
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-2 bg-rose-50 rounded-lg border border-rose-200">
                        <span className="text-rose-700 flex items-center text-xs">
                          <Star className="h-3 w-3 mr-1" /> 
                          Humor
                        </span>
                        <span className="font-semibold text-rose-700 text-xs">
                          {team!.reputation || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                </CardContent>
              </Card>

              {/* WIDGET COMPLEMENTAR */}
              <NewsFeed />
            </div>
          </div>
        );
    }
  };

  if (isLoading) return <div className="text-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div><p className="mt-4 text-lg">Carregando...</p></div>;
  if (error) return <div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>;
  if (!team) return <div className="text-center py-20"><p>Time não encontrado.</p><Button onClick={() => router.push('/')}>Início</Button></div>;

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-4 border border-slate-200">
            <Button variant="outline" onClick={() => activeView !== 'dashboard' ? setActiveView('dashboard') : router.push('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {activeView !== 'dashboard' ? 'Voltar ao Painel' : 'Voltar'}
            </Button>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-800">{team.name}</h1>
              <p className="text-sm text-slate-500 mt-1">Seu Clube de Futebol</p>
            </div>
            <div className="flex items-center gap-4">
              <MarketNotifications />
            </div>
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-md border-4 border-white" style={{ backgroundColor: team.colors?.primary || '#1e88e5', color: team.colors?.secondary || '#ffffff' }} title={team.name}>
              {team.short_name || (team.name ? team.name.charAt(0).toUpperCase() : '?')}
            </div>
          </div>
        </header>

        {renderContent()}

        <SeasonEndModal
          isOpen={seasonEndModal.isOpen}
          seasonResult={seasonEndModal.seasonResult}
          onContinue={async () => {
            setSeasonEndModal({ isOpen: false, seasonResult: null });
            await loadData();
            window.location.reload(); // Para garantir atualização completa
          }}
          onClose={() => setSeasonEndModal({ isOpen: false, seasonResult: null })}
        />
      </div>
    </div>
  );
} 