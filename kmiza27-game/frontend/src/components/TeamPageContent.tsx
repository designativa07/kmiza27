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
import { ArrowLeft, Landmark, Users, Star, HeartHandshake, Play, Calendar, Swords, Trophy, GraduationCap, ShieldAlert, Settings, Building } from 'lucide-react';
import TeamPlayers from './TeamPlayers';
import StadiumExpansion from './StadiumExpansion';
import YouthAcademy from './YouthAcademy';
import FinanceManager from './FinanceManager';

type ActiveView = 'dashboard' | 'players' | 'stadium' | 'academy' | 'finances';

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

  const teamId = params.teamId as string;

  const loadData = async () => {
    if (!selectedTeam) return;
    try {
      const [matches, recent, progress] = await Promise.all([
        gameApiReformed.getUserUpcomingMatches(selectedTeam.owner_id, 10),
        gameApiReformed.getUserRecentMatches(selectedTeam.owner_id, 10),
        gameApiReformed.getUserCurrentProgress(selectedTeam.owner_id)
      ]);
      setUpcomingMatches(matches);
      setRecentMatches(recent);
      setCompetitionData(progress);
    } catch (error) {
      console.error('Erro ao carregar dados do time:', error);
    }
  };
  
  const simulateMatch = async (matchId: string) => {
    if (!selectedTeam) return;
    try {
      setSimulatingMatch(matchId);
      await gameApiReformed.simulateMatch(matchId, selectedTeam.owner_id);
      
      // Aguardar um pouco para garantir que o backend processou
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Recarregar todos os dados
      await loadData();
      
      // Forçar atualização do componente
      setRefreshKey(prev => prev + 1);
      
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
      case 'players':
        return <TeamPlayers teamId={team!.id} teamName={team!.name} />;
      case 'stadium':
        return <StadiumExpansion team={team!} />;
      case 'academy':
        return <YouthAcademy />;
      case 'finances':
        return <FinanceManager />;
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
              <Card className="bg-white border-slate-200 shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center text-slate-700"><Landmark className="h-5 w-5 mr-2" />Visão Geral</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {/* Card Orçamento */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="text-emerald-700 flex items-center"><Landmark className="h-4 w-4 mr-2" /> Orçamento</span>
                      <span className="font-bold text-emerald-700">R$ {(team!.budget || 0).toLocaleString()}</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full text-emerald-700 border-emerald-300 hover:bg-emerald-50" onClick={() => setActiveView('finances')}>
                      Gerenciar Finanças
                    </Button>
                  </div>

                  {/* Card Estádio */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-700 flex items-center"><Building className="h-4 w-4 mr-2" /> Estádio</span>
                      <span className="font-semibold text-slate-700">{(team!.stadium_capacity || 0).toLocaleString()} lugares</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full text-slate-700 border-slate-300 hover:bg-slate-50" onClick={() => setActiveView('stadium')}>
                      Gerenciar Estádio
                    </Button>
                  </div>

                  {/* Card Elenco */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-blue-700 flex items-center"><Users className="h-4 w-4 mr-2" /> Elenco</span>
                      <span className="font-semibold text-blue-700">23 jogadores</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full text-blue-700 border-blue-300 hover:bg-blue-50" onClick={() => setActiveView('players')}>
                      Jogadores
                    </Button>
                  </div>

                  {/* Cards sem botões */}
                  <div className="flex justify-between items-center p-2 bg-amber-50 rounded-lg border border-amber-200">
                    <span className="text-amber-700 flex items-center"><Star className="h-4 w-4 mr-2" /> Reputação</span>
                    <span className="font-semibold text-amber-700">{team!.reputation || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-2 bg-rose-50 rounded-lg border border-rose-200">
                    <span className="text-rose-700 flex items-center"><HeartHandshake className="h-4 w-4 mr-2" /> Torcida</span>
                    <span className="font-semibold text-rose-700">{(team!.fan_base || 0).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-slate-200 shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center text-slate-700"><Users className="h-5 w-5 mr-2" />Status da Equipe</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg border border-blue-200"><span className="text-blue-700 flex items-center"><GraduationCap className="h-4 w-4 mr-2" /> Academia</span><span className="font-semibold text-blue-700">Nível 1</span></div>
                  <div className="flex justify-between items-center p-2 bg-orange-50 rounded-lg border border-orange-200"><span className="text-orange-700 flex items-center"><HeartHandshake className="h-4 w-4 mr-2" /> Moral da Equipe</span><span className="font-semibold text-orange-700">Neutra</span></div>
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded-lg border border-red-200"><span className="text-red-700 flex items-center"><ShieldAlert className="h-4 w-4 mr-2" /> Suspensos</span><span className="font-semibold text-red-700">0</span></div>
                  <Button variant="outline" size="sm" className="w-full mt-4 text-blue-700 border-blue-300 hover:bg-blue-50" onClick={() => setActiveView('players')}>Gerenciar Jogadores</Button>
                  <Button variant="outline" size="sm" className="w-full text-orange-700 border-orange-300 hover:bg-orange-50" onClick={() => setActiveView('academy')}>Gerenciar Academia</Button>
                </CardContent>
              </Card>
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