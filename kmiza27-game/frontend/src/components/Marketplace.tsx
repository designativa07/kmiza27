import React, { useState, useEffect } from 'react';
import { gameApiReformed } from '@/services/gameApiReformed';
import MarketPlayerCard from '@/components/MarketPlayerCard';
import { useGameStore } from '@/store/gameStore';
import MakeOfferModal from './MakeOfferModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Filter, Search, TrendingUp, DollarSign, Users, CheckCircle, XCircle, Clock, Building2, Zap, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ListedPlayer {
  id: string;
  player_id: string;
  is_youth_player: boolean;
  listing_price: number;
  listed_at: string;
  selling_team: {
    name: string;
  };
  player?: {
    name: string;
    position: string;
    current_ability?: number;
    potential_ability?: number;
    overall?: number;
    potential_overall?: number;
  };
}

interface MyPlayer {
  id: string;
  name: string;
  position: string;
  current_ability: number;
  potential_ability: number;
  market_value: number;
  is_youth_player: boolean;
  market_status: string;
}

interface MarketStats {
  totalListings: number;
  averagePrice: number;
  teamBudget: number;
  youthPlayers: number;
  professionalPlayers: number;
}

// --- Novas Interfaces para Ofertas ---
interface Offer {
  id: string;
  player_id: string;
  is_youth_player: boolean;
  listing_price: number;
  offer_price: number;
  offer_status: string;
  offer_made_at: string;
  buying_team?: { name: string };
  selling_team?: { name: string };
}

interface PendingOffers {
  received: Offer[];
  made: Offer[];
}


export default function Marketplace() {
  const { selectedTeam } = useGameStore();
  const [listedPlayers, setListedPlayers] = useState<ListedPlayer[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<ListedPlayer[]>([]);
  const [myPlayers, setMyPlayers] = useState<MyPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiRunning, setAiRunning] = useState(false);
  const [isMakeOfferModalOpen, setIsMakeOfferModalOpen] = useState(false);
  const [playerToOffer, setPlayerToOffer] = useState<{
    id: string;
    name: string;
    position: string;
    listing_price: number;
    selling_team: { name: string };
    is_youth_player: boolean;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'market' | 'my-players' | 'offers'>('market');
  const [marketStats, setMarketStats] = useState<MarketStats>({
    totalListings: 0,
    averagePrice: 0,
    teamBudget: selectedTeam?.budget || 0,
    youthPlayers: 0,
    professionalPlayers: 0
  });

  // Filtros
  const [filters, setFilters] = useState({
    position: '',
    minPrice: '',
    maxPrice: '',
    minPotential: '',
    maxPotential: '',
    playerType: 'all', // 'all', 'youth', 'professional'
    searchTerm: ''
  });

  // Estatísticas do mercado
  const calculateMarketStats = (players: ListedPlayer[]) => {
    const totalListings = players.length;
    const totalValue = players.reduce((sum, player) => sum + player.listing_price, 0);
    const averagePrice = totalListings > 0 ? Math.round(totalValue / totalListings) : 0;
    const youthPlayers = players.filter(p => p.is_youth_player).length;
    const professionalPlayers = players.filter(p => !p.is_youth_player).length;

    return {
      totalListings,
      averagePrice,
      teamBudget: selectedTeam?.budget || 0,
      youthPlayers,
      professionalPlayers
    };
  };

  // Aplicar filtros
  const applyFilters = (players: ListedPlayer[]) => {
    return players.filter(player => {
      // Filtro por tipo de jogador
      if (filters.playerType === 'youth' && !player.is_youth_player) return false;
      if (filters.playerType === 'professional' && player.is_youth_player) return false;

      // Filtro por posição
      if (filters.position && player.player?.position !== filters.position) return false;

      // Filtro por preço
      if (filters.minPrice && player.listing_price < parseInt(filters.minPrice)) return false;
      if (filters.maxPrice && player.listing_price > parseInt(filters.maxPrice)) return false;

      // Filtro por potencial
      const potential = player.is_youth_player ? player.player?.potential_overall : player.player?.potential_ability;
      if (filters.minPotential && potential && potential < parseInt(filters.minPotential)) return false;
      if (filters.maxPotential && potential && potential > parseInt(filters.maxPotential)) return false;

      // Filtro por termo de busca
      if (filters.searchTerm && !player.player?.name?.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false;

      return true;
    });
  };

  // Atualizar jogadores filtrados quando filtros ou jogadores mudarem
  useEffect(() => {
    const filtered = applyFilters(listedPlayers);
    setFilteredPlayers(filtered);
    
    // Atualizar estatísticas
    const stats = calculateMarketStats(filtered);
    setMarketStats(stats);
  }, [filters, listedPlayers]);

  const fetchMarketPlayers = async () => {
    if (!selectedTeam?.id) return;
    
    try {
      setLoading(true);
      const players = await gameApiReformed.getListedPlayers(selectedTeam.id);
      setListedPlayers(players || []);
    } catch (error) {
      console.error("Erro ao buscar jogadores no mercado:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPlayers = async () => {
    if (!selectedTeam?.id) return;
    
    try {
      setLoading(true);
      // Buscar jogadores da base
      const youthPlayers = await gameApiReformed.getAcademyPlayers(selectedTeam.id);
      // Buscar jogadores profissionais
      const proPlayers = await gameApiReformed.getPlayers(selectedTeam.id);
      
      const allPlayers = [
        ...(youthPlayers || []).map((p: any) => ({
          ...p,
          is_youth_player: true,
          potential_ability: p.potential_overall || p.potential_ability || 0
        })),
        ...(proPlayers || []).map((p: any) => ({
          ...p,
          is_youth_player: false,
          potential_ability: p.potential_ability || 0
        }))
      ];
      
      setMyPlayers(allPlayers);
    } catch (error) {
      console.error("Erro ao buscar meus jogadores:", error);
    } finally {
      setLoading(false);
    }
  };

  const listPlayer = async (playerId: string, price: number, isYouth: boolean) => {
    if (!selectedTeam?.id) return;
    
    try {
      await gameApiReformed.listPlayer(playerId, selectedTeam.id, price, isYouth);
      alert('Jogador listado no mercado com sucesso!');
      await fetchMyPlayers(); // Recarregar lista
    } catch (error) {
      console.error("Erro ao listar jogador:", error);
      alert('Erro ao listar jogador. Tente novamente.');
    }
  };

  const firePlayer = async (playerId: string, isYouth: boolean) => {
    if (!confirm('Tem certeza que deseja demitir este jogador? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      // Por enquanto, vamos apenas remover da lista local
      // TODO: Implementar API para deletar jogador
      setMyPlayers(prev => prev.filter(p => p.id !== playerId));
      alert('Jogador demitido com sucesso!');
    } catch (error) {
      console.error("Erro ao demitir jogador:", error);
      alert('Erro ao demitir jogador. Tente novamente.');
    }
  };

  const runMarketAI = async () => {
    if (!selectedTeam?.id) return;
    
    try {
      setAiRunning(true);
      await gameApiReformed.runMarketAI();
      await fetchMarketPlayers(); // Recarregar após IA executar
    } catch (error) {
      console.error("Erro ao executar IA do mercado:", error);
    } finally {
      setAiRunning(false);
    }
  };

  const handleMakeOffer = (player: ListedPlayer) => {
    setPlayerToOffer({
      id: player.player_id,
      name: player.player?.name || 'Nome não disponível',
      position: player.player?.position || 'N/A',
      listing_price: player.listing_price,
      selling_team: { name: player.selling_team?.name || 'Time não disponível' },
      is_youth_player: player.is_youth_player
    });
    setIsMakeOfferModalOpen(true);
  };

  const confirmMakeOffer = async (offerPrice: number) => {
    if (!playerToOffer || !selectedTeam?.id) return;

    try {
      await gameApiReformed.makeOffer(
        playerToOffer.id,
        selectedTeam.id,
        offerPrice,
        playerToOffer.is_youth_player
      );
      
      setIsMakeOfferModalOpen(false);
      setPlayerToOffer(null);
      
      // Mostrar mensagem de sucesso
      alert(`Oferta de R$ ${offerPrice.toLocaleString()} enviada com sucesso!`);
      
      // Recarregar jogadores para atualizar status
      await fetchMarketPlayers();
    } catch (error) {
      console.error("Erro ao fazer oferta:", error);
      alert("Erro ao fazer oferta. Tente novamente.");
    }
  };

  useEffect(() => {
    if (selectedTeam?.id) {
      fetchMarketPlayers();
      // Atualizar orçamento quando o time mudar
      setMarketStats(prev => ({
        ...prev,
        teamBudget: selectedTeam.budget || 0
      }));
    }
  }, [selectedTeam]);

  const positions = ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST'];

  if (!selectedTeam) {
    return <div className="text-center p-8">Selecione um time para ver o mercado</div>;
  }

  return (
    <div className="space-y-6">
      {/* Navegação por Abas */}
      <div className="flex border-b">
        <Button
          variant={activeTab === 'market' ? 'secondary' : 'ghost'}
          onClick={() => setActiveTab('market')}
          className="rounded-b-none rounded-t-md border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-secondary"
          data-state={activeTab === 'market' ? 'active' : ''}
        >
          Mercado de Jogadores
        </Button>
        <Button
          variant={activeTab === 'my-players' ? 'secondary' : 'ghost'}
          onClick={() => {
            setActiveTab('my-players');
            fetchMyPlayers();
          }}
          className="rounded-b-none rounded-t-md border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-secondary"
          data-state={activeTab === 'my-players' ? 'active' : ''}
        >
          Meus Jogadores
        </Button>
        <Button
          variant={activeTab === 'offers' ? 'secondary' : 'ghost'}
          onClick={() => setActiveTab('offers')}
          className="rounded-b-none rounded-t-md border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-secondary"
          data-state={activeTab === 'offers' ? 'active' : ''}
        >
          Minhas Ofertas
        </Button>
      </div>

      {/* Conteúdo da Aba Mercado */}
      {activeTab === 'market' && (
        <div className="space-y-6">
          {/* Cabeçalho com estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Listagens</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{marketStats.totalListings}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Meu Orçamento</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {marketStats.teamBudget.toLocaleString()}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {marketStats.averagePrice.toLocaleString()}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Jogadores da Base</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{marketStats.youthPlayers}</div>
              </CardContent>
            </Card>
          </div>

          {/* Controles e filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros Avançados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primeira linha de filtros */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Jogador</label>
                  <Select value={filters.playerType} onValueChange={(value: string) => setFilters(prev => ({ ...prev, playerType: value }))}>
                    <Select.Item value="all">Todos os tipos</Select.Item>
                    <Select.Item value="youth">Jogadores da Base</Select.Item>
                    <Select.Item value="professional">Jogadores Profissionais</Select.Item>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Posição</label>
                  <Select value={filters.position} onValueChange={(value: string) => setFilters(prev => ({ ...prev, position: value }))}>
                    <Select.Item value="">Todas as posições</Select.Item>
                    {positions.map(pos => (
                      <Select.Item key={pos} value={pos}>{pos}</Select.Item>
                    ))}
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Buscar por nome</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nome do jogador..."
                      value={filters.searchTerm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              
              {/* Segunda linha de filtros */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preço Mínimo (R$)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.minPrice}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preço Máximo (R$)</label>
                  <Input
                    type="number"
                    placeholder="999999"
                    value={filters.maxPrice}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Potencial Mínimo</label>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    max="100"
                    value={filters.minPotential}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, minPotential: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Potencial Máximo</label>
                  <Input
                    type="number"
                    placeholder="100"
                    min="0"
                    max="100"
                    value={filters.maxPotential}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, maxPotential: e.target.value }))}
                  />
                </div>
              </div>
              
              {/* Botões de ação */}
              <div className="flex flex-wrap gap-2">
                <Button onClick={fetchMarketPlayers} variant="outline">
                  Atualizar
                </Button>
                <Button onClick={runMarketAI} disabled={aiRunning}>
                  {aiRunning ? 'Executando IA...' : 'Executar IA do Mercado'}
                </Button>
                <Button 
                  onClick={() => setFilters({
                    position: '',
                    minPrice: '',
                    maxPrice: '',
                    minPotential: '',
                    maxPotential: '',
                    playerType: 'all',
                    searchTerm: ''
                  })} 
                  variant="outline"
                >
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resultados */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Jogadores Disponíveis ({filteredPlayers.length})
              </h3>
              {filters.playerType !== 'all' && (
                <Badge variant="secondary">
                  {filters.playerType === 'youth' ? 'Jogadores da Base' : 'Jogadores Profissionais'}
                </Badge>
              )}
            </div>

            {loading ? (
              <div className="text-center p-8">Carregando mercado...</div>
            ) : filteredPlayers.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                Nenhum jogador encontrado com os filtros aplicados.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlayers.map((player) => (
                  <MarketPlayerCard
                    key={player.id}
                    player={{
                      id: player.player_id,
                      name: player.player?.name || 'Nome não disponível',
                      position: player.player?.position || 'N/A',
                      current_ability: player.player?.current_ability || player.player?.overall || 0,
                      potential_ability: player.player?.potential_ability || player.player?.potential_overall || 0,
                      market_value: player.listing_price,
                      team_id: player.selling_team?.name || 'Time não disponível'
                    }}
                    playerType={player.is_youth_player ? 'youth' : 'professional'}
                    listingPrice={player.listing_price}
                    sellingTeam={player.selling_team?.name || 'Time não disponível'}
                    onMakeOffer={() => handleMakeOffer(player)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Conteúdo da Aba Meus Jogadores */}
      {activeTab === 'my-players' && (
         <div className="space-y-4">
            <h3 className="text-lg font-semibold">Gerenciamento de Jogadores ({myPlayers.length})</h3>
            {loading ? <div className="text-center p-8">Carregando seus jogadores...</div> :
              myPlayers.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">Você não possui jogadores no seu time.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myPlayers.map(player => (
                    <Card key={player.id}>
                      <CardHeader>
                        <CardTitle className="text-base">{player.name}</CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="outline">{player.position}</Badge>
                          <Badge variant={player.is_youth_player ? "secondary" : "default"}>
                            {player.is_youth_player ? "Júnior" : "Profissional"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm">Potencial: <Badge>{player.potential_ability}</Badge></p>
                        <p className="text-sm">Valor de Mercado: <Badge>R$ {player.market_value.toLocaleString()}</Badge></p>
                        <div className="flex gap-2 pt-4">
                          <Button 
                            onClick={() => {
                              const price = prompt("Digite o preço para listar o jogador:", player.market_value.toString());
                              if (price && !isNaN(parseInt(price))) {
                                listPlayer(player.id, parseInt(price), player.is_youth_player);
                              }
                            }}
                            disabled={player.market_status === 'listed'}
                          >
                            {player.market_status === 'listed' ? 'No Mercado' : 'Listar'}
                          </Button>
                          <Button variant="destructive" onClick={() => firePlayer(player.id, player.is_youth_player)}>Demitir</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            }
         </div>
      )}

      {/* Conteúdo da Aba Ofertas */}
      {activeTab === 'offers' && <OffersTab />}


      {/* Modal de fazer oferta */}
      {isMakeOfferModalOpen && playerToOffer && (
        <MakeOfferModal
          isOpen={isMakeOfferModalOpen}
          onClose={() => {
            setIsMakeOfferModalOpen(false);
            setPlayerToOffer(null);
          }}
          player={playerToOffer}
          onConfirm={confirmMakeOffer}
        />
      )}
    </div>
  );
}


// --- Componente para a Aba de Ofertas (antigo PendingOffersManager) ---
function OffersTab() {
  const [loading, setLoading] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const { selectedTeam } = useGameStore();
  const [pendingOffers, setPendingOffers] = useState<PendingOffers>({ received: [], made: [] });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPendingOffers = async () => {
    if (!selectedTeam) return;

    try {
      setLoading(true);
      const offers = await gameApiReformed.getPendingOffers(selectedTeam.id);
      setPendingOffers(offers);
    } catch (error) {
      console.error('Erro ao buscar ofertas pendentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    try {
      setActionLoading(offerId);
      await gameApiReformed.acceptOffer(offerId);
      await fetchPendingOffers();
      alert('Oferta aceita com sucesso! O jogador foi transferido para o seu time.');
    } catch (error) {
      console.error('Erro ao aceitar oferta:', error);
      alert('Erro ao aceitar oferta. Tente novamente.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    try {
      setActionLoading(offerId);
      await gameApiReformed.rejectOffer(offerId);
      await fetchPendingOffers();
    } catch (error) {
      console.error('Erro ao rejeitar oferta:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleProcessAIOffers = async () => {
    try {
      setAiProcessing(true);
      const result = await gameApiReformed.processAIOffers();
      console.log('Resultado do processamento da IA:', result);
      await fetchPendingOffers();
      alert(`IA processou ${result.processed} ofertas:\n` +
            `✅ Aceitas: ${result.accepted}\n` +
            `❌ Rejeitadas: ${result.rejected}\n` +
            `🤝 Contrapropostas: ${result.counterOffers}`);
    } catch (error) {
      console.error('Erro ao processar ofertas da IA:', error);
      alert('Erro ao processar ofertas da IA');
    } finally {
      setAiProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pendente</Badge>;
      case 'accepted': return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Aceita</Badge>;
      case 'rejected': return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Rejeitada</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  useEffect(() => {
    if (selectedTeam) {
      fetchPendingOffers();
    }
  }, [selectedTeam]);

  if (loading) {
    return <div className="text-center p-8">Carregando ofertas...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciamento de Ofertas</h2>
        <div className="flex gap-2">
          <Button onClick={fetchPendingOffers} disabled={loading}><Clock className="h-4 w-4 mr-2" />Atualizar</Button>
          <Button onClick={handleProcessAIOffers} disabled={aiProcessing || loading} variant="outline"><Zap className="h-4 w-4 mr-2" />{aiProcessing ? 'Processando IA...' : 'Processar IA'}</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-green-600"><Users className="h-5 w-5" />Ofertas Recebidas ({pendingOffers.received.length})</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {pendingOffers.received.length === 0 ? <Alert><AlertDescription className="text-center">Nenhuma oferta recebida.</AlertDescription></Alert> : (
              pendingOffers.received.map((offer) => (
                <div key={offer.id} className="border rounded-lg p-4 space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{offer.is_youth_player ? 'Júnior' : 'Profissional'}</Badge>
                      {getStatusBadge(offer.offer_status)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2"><Building2 className="h-4 w-4" />Time: {offer.buying_team?.name || 'Desconhecido'}</div>
                      <div className="flex items-center gap-2"><DollarSign className="h-4 w-4" />Oferta: R$ {offer.offer_price.toLocaleString()}</div>
                      <div className="flex items-center gap-2"><Calendar className="h-4 w-4" />{formatDate(offer.offer_made_at)}</div>
                    </div>
                  </div>
                  {offer.offer_status === 'pending' && (
                    <div className="flex gap-2">
                      <Button onClick={() => handleAcceptOffer(offer.id)} disabled={actionLoading === offer.id} className="flex-1 bg-green-600 hover:bg-green-700">{actionLoading === offer.id ? '...' : 'Aceitar'}</Button>
                      <Button onClick={() => handleRejectOffer(offer.id)} disabled={actionLoading === offer.id} variant="destructive" className="flex-1">{actionLoading === offer.id ? '...' : 'Rejeitar'}</Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-blue-600"><Building2 className="h-5 w-5" />Ofertas Feitas ({pendingOffers.made.length})</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {pendingOffers.made.length === 0 ? <Alert><AlertDescription className="text-center">Nenhuma oferta feita.</AlertDescription></Alert> : (
              pendingOffers.made.map((offer) => (
                <div key={offer.id} className="border rounded-lg p-4 space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{offer.is_youth_player ? 'Júnior' : 'Profissional'}</Badge>
                      {getStatusBadge(offer.offer_status)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2"><Users className="h-4 w-4" />Time: {offer.selling_team?.name || 'Desconhecido'}</div>
                      <div className="flex items-center gap-2"><DollarSign className="h-4 w-4" />Sua Oferta: R$ {offer.offer_price.toLocaleString()}</div>
                      <div className="flex items-center gap-2"><Calendar className="h-4 w-4" />{formatDate(offer.offer_made_at)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
