import React, { useState, useEffect } from 'react';
import { gameApiReformed } from '@/services/gameApiReformed';
import MarketPlayerCard from '@/components/MarketPlayerCard';
import { useGameStore } from '@/store/gameStore';
import MakeOfferModal from './MakeOfferModal';
import OffersManager from './OffersManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Filter, Search, TrendingUp, DollarSign, Users, CheckCircle, XCircle, Clock, Building2, Zap, Calendar, Store, ShoppingCart, Target } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface ListedPlayer {
  id: string;
  player_id: string;
  is_youth_player: boolean;
  listing_price: number;
  listed_at: string;
  selling_team: {
    name: string;
  };
  player_details?: {
    name: string;
    position: string;
    current_ability?: number;
    potential_value?: number;
    overall?: number;
    potential_overall?: number;
    pace?: number;
    shooting?: number;
    passing?: number;
    dribbling?: number;
    defending?: number;
    physical?: number;
    attributes?: {
      overall?: number;
      current_ability?: number;
      [key: string]: any;
    };
    potential_data?: {
      overall?: number;
      potential?: number;
      [key: string]: any;
    };
    market_value?: number;
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
  counter_offer_price?: number;
  player_name?: string;
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
  const [existingOffers, setExistingOffers] = useState<{[key: string]: any}>({});
  const [isMakeOfferModalOpen, setIsMakeOfferModalOpen] = useState(false);
  const [playerToOffer, setPlayerToOffer] = useState<{
    id: string;
    name: string;
    position: string;
    current_ability: number;
    potential_ability: number;
    market_value?: number;
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

  // Estados para gerenciamento de ofertas
  const [receivedOffers, setReceivedOffers] = useState<Offer[]>([]);
  const [madeOffers, setMadeOffers] = useState<Offer[]>([]);
  const [isProcessingOffer, setIsProcessingOffer] = useState<string | null>(null);

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
              if (filters.position && player.player_details?.position !== filters.position) return false;

      // Filtro por preço
      if (filters.minPrice && player.listing_price < parseInt(filters.minPrice)) return false;
      if (filters.maxPrice && player.listing_price > parseInt(filters.maxPrice)) return false;

      // Filtro por potencial
      const potential = player.is_youth_player ? player.player_details?.potential_overall : player.player_details?.potential_value;
      if (filters.minPotential && potential && potential < parseInt(filters.minPotential)) return false;
      if (filters.maxPotential && potential && potential > parseInt(filters.maxPotential)) return false;

      // Filtro por termo de busca
              if (filters.searchTerm && !player.player_details?.name?.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false;

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
      console.log('Dados retornados da API:', players);
      setListedPlayers(players || []);
      
      // Buscar ofertas existentes
      await fetchExistingOffers();
    } catch (error) {
      console.error("Erro ao buscar jogadores no mercado:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingOffers = async () => {
    if (!selectedTeam?.id) return;
    
    try {
      const offers = await gameApiReformed.getPendingOffers(selectedTeam.id);
      
      // Criar um mapa de ofertas por player_id
      const offersMap: {[key: string]: any} = {};
      
      // Adicionar ofertas feitas (made offers)
      offers.made?.forEach((offer: Offer) => {
        offersMap[offer.player_id] = {
          hasOffer: true,
          status: offer.offer_status,
          offerPrice: offer.offer_price,
          counterOfferPrice: offer.counter_offer_price
        };
      });
      
      setExistingOffers(offersMap);
    } catch (error) {
      console.error("Erro ao buscar ofertas existentes:", error);
    }
  };

  // Buscar ofertas recebidas e feitas
  const fetchOffers = async () => {
    if (!selectedTeam) return;
    
    try {
      console.log('🔍 Buscando ofertas para o time:', selectedTeam.id);
      
      // Buscar ofertas usando o método existente
      const offers = await gameApiReformed.getPendingOffers(selectedTeam.id);
      
      console.log('📥 Resposta da API getPendingOffers:', offers);
      
      if (offers.success) {
        console.log('✅ Sucesso na busca de ofertas');
        console.log('📥 Ofertas recebidas:', offers.received);
        console.log('📤 Ofertas feitas:', offers.made);
        
        setReceivedOffers(offers.received || []);
        setMadeOffers(offers.made || []);
      } else {
        console.log('❌ Falha na busca de ofertas:', offers);
        setReceivedOffers([]);
        setMadeOffers([]);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar ofertas:', error);
      setReceivedOffers([]);
      setMadeOffers([]);
    }
  };

  // Aceitar oferta
  const handleAcceptOffer = async (offerId: string) => {
    if (!selectedTeam) return;
    
    setIsProcessingOffer(offerId);
    try {
      const response = await gameApiReformed.acceptOffer(offerId);
      if (response.success) {
        // Atualizar lista de ofertas
        await fetchOffers();
        // Atualizar jogadores do mercado
        await fetchMarketPlayers();
        alert('Oferta aceita com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao aceitar oferta:', error);
      alert('Erro ao aceitar oferta');
    } finally {
      setIsProcessingOffer(null);
    }
  };

  // Recusar oferta
  const handleRejectOffer = async (offerId: string) => {
    if (!selectedTeam) return;
    
    setIsProcessingOffer(offerId);
    try {
      const response = await gameApiReformed.rejectOffer(offerId);
      if (response.success) {
        // Atualizar lista de ofertas
        await fetchOffers();
        alert('Oferta recusada');
      }
    } catch (error) {
      console.error('Erro ao recusar oferta:', error);
      alert('Erro ao recusar oferta');
    } finally {
      setIsProcessingOffer(null);
    }
  };

  // Fazer contraproposta
  const handleMakeCounterOffer = async (offerId: string, currentPrice: number) => {
    const counterPrice = prompt(
      `Fazer contraproposta para oferta de R$ ${currentPrice.toLocaleString()}?\n\nDigite o novo valor:`,
      Math.round(currentPrice * 1.1).toString() // Sugerir 10% a mais
    );

    if (!counterPrice || isNaN(parseFloat(counterPrice))) return;

    setIsProcessingOffer(offerId);
    try {
      const response = await gameApiReformed.makeCounterOffer(offerId, parseFloat(counterPrice));
      if (response.success) {
        await fetchOffers();
        alert('Contraproposta enviada!');
      }
    } catch (error) {
      console.error('Erro ao fazer contraproposta:', error);
      alert('Erro ao fazer contraproposta');
    } finally {
      setIsProcessingOffer(null);
    }
  };

  // Aceitar contraproposta
  const handleAcceptCounterOffer = async (offerId: string) => {
    if (!selectedTeam) return;
    
    setIsProcessingOffer(offerId);
    try {
      const response = await gameApiReformed.acceptCounterOffer(offerId);
      if (response.success) {
        await fetchOffers();
        await fetchMarketPlayers();
        alert('Contraproposta aceita!');
      }
    } catch (error) {
      console.error('Erro ao aceitar contraproposta:', error);
      alert('Erro ao aceitar contraproposta');
    } finally {
      setIsProcessingOffer(null);
    }
  };

  // Excluir oferta concluída
  const handleDeleteOffer = async (offerId: string, type: 'received' | 'made') => {
    try {
      // Por enquanto, vamos apenas remover localmente
      // TODO: Implementar API para deletar oferta quando estiver disponível
      if (type === 'received') {
        setReceivedOffers(prev => prev.filter(o => o.id !== offerId));
      } else {
        setMadeOffers(prev => prev.filter(o => o.id !== offerId));
      }
      alert('Oferta removida');
    } catch (error) {
      console.error('Erro ao excluir oferta:', error);
      alert('Erro ao excluir oferta');
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
      name: player.player_details?.name || 'Nome não disponível',
      position: player.player_details?.position || 'N/A',
      current_ability: player.player_details?.current_ability || 50,
      potential_ability: player.player_details?.potential_value || 75,
      market_value: player.player_details?.market_value || player.listing_price,
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
      alert(`Oferta de ${formatCurrency(offerPrice)} enviada com sucesso!`);
      
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

  // Atualizar ofertas quando mudar de aba
  useEffect(() => {
    if (activeTab === 'offers') {
      fetchOffers();
    }
  }, [activeTab, selectedTeam]);

  // Atualizar ofertas periodicamente
  useEffect(() => {
    if (activeTab === 'offers') {
      const interval = setInterval(fetchOffers, 30000); // Atualizar a cada 30 segundos
      return () => clearInterval(interval);
    }
  }, [activeTab, selectedTeam]);

  const positions = ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST'];

  if (!selectedTeam) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">🏪</div>
          <p className="text-lg text-gray-500 font-medium">Selecione um time para acessar o mercado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas - Estilo da Academia */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🏪 Mercado de Jogadores</h2>
            <p className="text-gray-600">Compre, venda e negocie jogadores no mercado de transferências</p>
          </div>
          <button 
            onClick={runMarketAI}
            disabled={aiRunning}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
          >
            <span className="text-lg">🤖</span>
            {aiRunning ? 'Executando IA...' : 'Executar IA do Mercado'}
          </button>
        </div>

        {/* Estatísticas em cards coloridos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white rounded-xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-emerald-600 mb-1">{marketStats.totalListings}</div>
            <div className="text-sm font-medium text-gray-700">Total de Listagens</div>
          </div>
          
          <div className="text-center p-4 bg-white rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-blue-600 mb-1">{formatCurrency(marketStats.teamBudget)}</div>
            <div className="text-sm font-medium text-gray-700">Meu Orçamento</div>
          </div>
          
          <div className="text-center p-4 bg-white rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-orange-600 mb-1">{formatCurrency(marketStats.averagePrice)}</div>
            <div className="text-sm font-medium text-gray-700">Preço Médio</div>
          </div>
          
          <div className="text-center p-4 bg-white rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-purple-600 mb-1">{marketStats.youthPlayers}</div>
            <div className="text-sm font-medium text-gray-700">Jogadores da Base</div>
          </div>
        </div>
      </div>

      {/* Navegação por Abas - Estilo da Academia */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('market')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'market'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <span className="text-lg">🏪</span>
          <span>Mercado de Jogadores</span>
        </button>
        
        <button
          onClick={() => {
            setActiveTab('my-players');
            fetchMyPlayers();
          }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'my-players'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <span className="text-lg">👥</span>
          <span>Meus Jogadores</span>
        </button>
        
        <button
          onClick={() => setActiveTab('offers')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'offers'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <span className="text-lg">🤝</span>
          <span>Minhas Ofertas</span>
        </button>
      </div>

      {/* Conteúdo da Aba Mercado */}
      {activeTab === 'market' && (
        <div className="space-y-6">
          {/* Controles e filtros - Estilo da Academia */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">🔍</span>
                Filtros Avançados
              </h3>
              <button
                onClick={() => setFilters({
                  position: '',
                  minPrice: '',
                  maxPrice: '',
                  minPotential: '',
                  maxPotential: '',
                  playerType: 'all',
                  searchTerm: ''
                })}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
              >
                <span className="text-lg">🔄</span>
                Limpar Filtros
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Filtros principais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tipo de Jogador */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="text-lg">👥</span>
                    Tipo de Jogador
                  </label>
                  <Select value={filters.playerType} onValueChange={(value: string) => setFilters(prev => ({ ...prev, playerType: value }))}>
                    <Select.Item value="all">🏆 Todos os tipos</Select.Item>
                    <Select.Item value="youth">👶 Jogadores da Base</Select.Item>
                    <Select.Item value="professional">👔 Jogadores Profissionais</Select.Item>
                  </Select>
                </div>
                
                {/* Posição */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="text-lg">⚽</span>
                    Posição
                  </label>
                  <Select value={filters.position} onValueChange={(value: string) => setFilters(prev => ({ ...prev, position: value }))}>
                    <Select.Item value="">🎯 Todas as posições</Select.Item>
                    {positions.map(pos => (
                      <Select.Item key={pos} value={pos}>
                        {pos === 'GK' ? '🥅 Goleiro' : 
                         pos === 'CB' ? '🛡️ Zagueiro' :
                         pos === 'LB' ? '⬅️ Lateral Esquerdo' :
                         pos === 'RB' ? '➡️ Lateral Direito' :
                         pos === 'DM' ? '🔄 Volante' :
                         pos === 'CM' ? '⚙️ Meio Campo' :
                         pos === 'AM' ? '🎯 Meia Ofensivo' :
                         pos === 'LW' ? '⬅️ Ponta Esquerda' :
                         pos === 'RW' ? '➡️ Ponta Direita' :
                         pos === 'ST' ? '⚡ Atacante' : pos}
                      </Select.Item>
                    ))}
                  </Select>
                </div>
                
                {/* Busca por nome */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="text-lg">🔎</span>
                    Buscar por nome
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500" />
                    <Input
                      placeholder="Nome do jogador..."
                      value={filters.searchTerm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                      className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Filtros de preço e potencial */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Preço Mínimo */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="text-lg">💰</span>
                    Preço Mínimo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">R$</span>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filters.minPrice}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                      className="pl-12 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                {/* Preço Máximo */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="text-lg">💎</span>
                    Preço Máximo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">R$</span>
                    <Input
                      type="number"
                      placeholder="999999"
                      value={filters.maxPrice}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                      className="pl-12 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                {/* Potencial Mínimo */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="text-lg">📈</span>
                    Potencial Mínimo
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    max="100"
                    value={filters.minPotential}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, minPotential: e.target.value }))}
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                {/* Potencial Máximo */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="text-lg">🚀</span>
                    Potencial Máximo
                  </label>
                  <Input
                    type="number"
                    placeholder="100"
                    min="0"
                    max="100"
                    value={filters.maxPotential}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, maxPotential: e.target.value }))}
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {/* Filtros ativos e botões */}
              <div className="pt-4 border-t border-blue-200">
                {/* Filtros ativos */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {filters.playerType !== 'all' && (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                      {filters.playerType === 'youth' ? '👶 Base' : '👔 Profissional'}
                    </Badge>
                  )}
                  {filters.position && (
                    <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                      ⚽ {filters.position}
                    </Badge>
                  )}
                  {filters.minPrice && (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 px-3 py-1">
                      💰 Min: R$ {filters.minPrice}
                    </Badge>
                  )}
                  {filters.maxPrice && (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 px-3 py-1">
                      💎 Max: R$ {filters.maxPrice}
                    </Badge>
                  )}
                  {filters.minPotential && (
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200 px-3 py-1">
                      📈 Min: {filters.minPotential}
                    </Badge>
                  )}
                  {filters.maxPotential && (
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200 px-3 py-1">
                      🚀 Max: {filters.maxPotential}
                    </Badge>
                  )}
                  {filters.searchTerm && (
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200 px-3 py-1">
                      🔎 "{filters.searchTerm}"
                    </Badge>
                  )}
                </div>
                
                {/* Botão de atualizar */}
                <div className="flex justify-center">
                  <Button 
                    onClick={fetchMarketPlayers} 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                  >
                    <span className="text-lg">🔄</span>
                    Atualizar Mercado
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Resultados */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="text-xl">⚽</span>
                Jogadores Disponíveis ({filteredPlayers.length})
              </h3>
              {filters.playerType !== 'all' && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                  {filters.playerType === 'youth' ? 'Jogadores da Base' : 'Jogadores Profissionais'}
                </Badge>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                  <p className="text-lg text-gray-700 font-medium">Carregando mercado...</p>
                </div>
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <p className="text-lg text-gray-500 font-medium">Nenhum jogador encontrado com os filtros aplicados.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlayers.map((player) => {
                  // Mapear dados baseado no tipo de jogador
                  let mappedPlayer;
                  
                  if (player.is_youth_player) {
                    // Jogadores da base - dados em JSONB
                    const attributes = player.player_details?.attributes || {};
                    const potentialData = player.player_details?.potential_data || {};
                    
                    mappedPlayer = {
                      id: player.player_id,
                      name: player.player_details?.name || 'Nome não disponível',
                      position: player.player_details?.position || 'N/A',
                      current_ability: attributes.overall || attributes.current_ability || 50,
                      potential_ability: potentialData.overall || potentialData.potential || 75,
                      market_value: player.listing_price,
                      team_id: player.selling_team?.name || 'Time não disponível'
                    };
                  } else {
                    // Jogadores profissionais - colunas diretas
                    mappedPlayer = {
                      id: player.player_id,
                      name: player.player_details?.name || 'Nome não disponível',
                      position: player.player_details?.position || 'N/A',
                      current_ability: player.player_details?.current_ability || 50,
                      potential_ability: player.player_details?.potential_value || 75,
                      market_value: player.listing_price,
                      team_id: player.selling_team?.name || 'Time não disponível'
                    };
                  }
                  
                  return (
                    <MarketPlayerCard
                      key={player.id}
                      player={mappedPlayer}
                      playerType={player.is_youth_player ? 'youth' : 'professional'}
                      sellingTeam={player.selling_team?.name || 'Time não disponível'}
                      onMakeOffer={() => handleMakeOffer(player)}
                      existingOffer={existingOffers[player.player_id]}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Conteúdo da Aba Meus Jogadores - Estilo da Academia */}
      {activeTab === 'my-players' && (
        <div className="space-y-6">
          {/* Header da seção */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-2xl">👥</span>
              Gerenciamento de Jogadores ({myPlayers.length})
            </h3>
            <p className="text-gray-600">Gerencie seu elenco, liste jogadores no mercado ou demita-os</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-lg text-gray-700 font-medium">Carregando seus jogadores...</p>
              </div>
            </div>
          ) : myPlayers.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 text-6xl mb-4">👥</div>
              <p className="text-lg text-gray-500 font-medium">Você não possui jogadores no seu time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myPlayers.map(player => (
                <div key={player.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-gray-900">{player.name}</h4>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">{player.position}</Badge>
                        <Badge variant={player.is_youth_player ? "secondary" : "default"} className={player.is_youth_player ? "bg-green-100 text-green-800 border-green-200" : "bg-blue-100 text-blue-800 border-blue-200"}>
                          {player.is_youth_player ? "Júnior" : "Profissional"}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                        <span className="text-sm font-medium text-gray-700">Potencial:</span>
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200">{player.potential_ability}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                        <span className="text-sm font-medium text-gray-700">Valor de Mercado:</span>
                        <Badge className="bg-green-100 text-green-800 border-green-200">{formatCurrency(player.market_value)}</Badge>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => {
                          const price = prompt("Digite o preço para listar o jogador:", player.market_value ? player.market_value.toString() : "1000");
                          if (price && !isNaN(parseInt(price))) {
                            listPlayer(player.id, parseInt(price), player.is_youth_player);
                          }
                        }}
                        disabled={player.market_status === 'listed'}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        {player.market_status === 'listed' ? 'No Mercado' : 'Listar'}
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => firePlayer(player.id, player.is_youth_player)}
                        className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Demitir
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da Aba Ofertas */}
      {activeTab === 'offers' && (
        <OffersManager
          receivedOffers={receivedOffers}
          madeOffers={madeOffers}
          onAcceptOffer={handleAcceptOffer}
          onRejectOffer={handleRejectOffer}
          onMakeCounterOffer={handleMakeCounterOffer}
          onAcceptCounterOffer={handleAcceptCounterOffer}
          onDeleteOffer={handleDeleteOffer}
          isProcessingOffer={isProcessingOffer}
          onRefresh={fetchOffers}
        />
      )}

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
