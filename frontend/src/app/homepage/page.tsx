'use client';

import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/config/api';

interface Team {
  id: number;
  name: string;
  logo_url: string;
  is_international?: boolean;
  international_order?: number;
  // Campos adicionais que vêm da API
  slug?: string;
  full_name?: string;
  short_name?: string;
  short_code?: string;
  city?: string;
  state?: string;
  country?: string;
  category?: string;
  founded_year?: number;
  colors?: string;
  social_media?: {
    tiktok_url?: string;
    youtube_url?: string;
    instagram_url?: string;
    official_site_url?: string;
  };
  history?: string;
  information?: string;
  aliases?: string[];
  created_at?: string;
  updated_at?: string;
  // Campos adicionais
  stadium_id?: number;
  stadium?: {
    id: number;
    name: string;
    city: string;
    state: string;
    country: string;
    capacity: number;
    latitude?: string;
    longitude?: string;
    opened_year?: number;
    history?: string;
    image_url?: string;
    url?: string;
    created_at: string;
    category: string;
  };
}

export default function Homepage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [internationalTeams, setInternationalTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados para paginação e busca
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);

  useEffect(() => {
    fetchTeams();
  }, []);

  // Debug: monitorar mudanças no estado teams
  useEffect(() => {
    console.log('Estado teams atualizado:', teams);
    console.log('Estado internationalTeams atualizado:', internationalTeams);
  }, [teams, internationalTeams]);

  // Filtrar times baseado no termo de busca
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTeams(teams);
      setCurrentPage(1);
    } else {
      const filtered = teams.filter(team => 
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.short_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.country?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTeams(filtered);
      setCurrentPage(1);
    }
  }, [teams, searchTerm]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      
      console.log('Iniciando busca de times...');
      
      const teamsUrl = API_ENDPOINTS.teams.list() + '?limit=1000';
      const internationalUrl = API_ENDPOINTS.teams.international();
      
      console.log('URLs das APIs:');
      console.log('Teams URL:', teamsUrl);
      console.log('International URL:', internationalUrl);
      
      // Buscar todos os times
      const teamsRes = await fetch(teamsUrl);
      const teamsData = await teamsRes.json();
      
      // Buscar times internacionais configurados
      const internationalRes = await fetch(internationalUrl);
      const internationalData = await internationalRes.json();
      
      console.log('Resposta da API teams:', teamsData);
      console.log('Resposta da API international:', internationalData);
      
      // Extrair os dados corretamente da resposta da API
      const allTeams = teamsData.data || teamsData;
      const international = internationalData.data || internationalData;
      
      console.log('Times extraídos:', allTeams);
      console.log('Times internacionais extraídos:', international);
      
      // Garantir que ambos sejam sempre arrays
      const teamsArray = Array.isArray(allTeams) ? allTeams : [];
      const internationalArray = Array.isArray(international) ? international : [];
      
      console.log('Arrays finais:', { teams: teamsArray, international: internationalArray });
      
      setTeams(teamsArray);
      setInternationalTeams(internationalArray);
    } catch (error) {
      console.error('Erro ao buscar times:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funções de paginação
  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTeams = filteredTeams.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  // Função para adicionar time internacional
  const addInternationalTeam = async (team: Team) => {
    try {
      setSaving(true);
      const response = await fetch(API_ENDPOINTS.teams.toggleInternational(team.id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order: internationalTeams.length + 1
        }),
      });

      if (response.ok) {
        // Recarregar times internacionais
        const internationalRes = await fetch(API_ENDPOINTS.teams.international());
        const internationalData = await internationalRes.json();
        setInternationalTeams(internationalData.data || internationalData);
      } else {
        console.error('Erro ao adicionar time internacional');
      }
    } catch (error) {
      console.error('Erro ao adicionar time internacional:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleInternational = async (teamId: number, isInternational: boolean) => {
    try {
      setSaving(true);
      
      if (isInternational) {
        // Remover da lista internacional
        await fetch(API_ENDPOINTS.teams.toggleInternational(teamId), {
          method: 'DELETE'
        });
      } else {
        // Adicionar à lista internacional
        await fetch(API_ENDPOINTS.teams.toggleInternational(teamId), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ order: internationalTeams.length + 1 })
        });
      }
      
      // Recarregar times internacionais
      const internationalRes = await fetch(API_ENDPOINTS.teams.international());
      const internationalData = await internationalRes.json();
      setInternationalTeams(internationalData.data || internationalData);
    } catch (error) {
      console.error('Erro ao atualizar time internacional:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateOrder = async (teamId: number, newOrder: number) => {
    try {
      setSaving(true);
      
      await fetch(API_ENDPOINTS.teams.updateInternationalOrder(teamId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ order: newOrder })
      });
      
      // Recarregar times internacionais
      const internationalRes = await fetch(API_ENDPOINTS.teams.international());
      const internationalData = await internationalRes.json();
      setInternationalTeams(internationalData.data || internationalData);
    } catch (error) {
      console.error('Erro ao atualizar ordem:', error);
    } finally {
      setSaving(false);
    }
  };

  const moveUp = (index: number) => {
    if (Array.isArray(internationalTeams) && index > 0) {
      const team = internationalTeams[index];
      const prevTeam = internationalTeams[index - 1];
      updateOrder(team.id, prevTeam.international_order || index);
      updateOrder(prevTeam.id, team.international_order || index + 1);
    }
  };

  const moveDown = (index: number) => {
    if (Array.isArray(internationalTeams) && index < internationalTeams.length - 1) {
      const team = internationalTeams[index];
      const nextTeam = internationalTeams[index + 1];
      updateOrder(team.id, nextTeam.international_order || index + 2);
      updateOrder(nextTeam.id, team.international_order || index);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Título da página */}
      <div className="border-b border-gray-200 dark:border-slate-600 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Gerenciar Times Internacionais
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Selecione até 20 times internacionais para exibir na aba "Internacional"
        </p>
      </div>

      {/* Times Internacionais Atuais */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Times Internacionais Selecionados ({Array.isArray(internationalTeams) ? internationalTeams.length : 0}/20)
        </h2>
        
        {!Array.isArray(internationalTeams) || internationalTeams.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            Nenhum time internacional selecionado ainda.
          </p>
        ) : (
          <div className="space-y-3">
            {internationalTeams.map((team, index) => (
              <div key={team.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-8">
                    {index + 1}
                  </span>
                  {team.logo_url && (
                    <img 
                      src={team.logo_url} 
                      alt={team.name}
                      className="w-8 h-8 object-contain"
                    />
                  )}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {team.name}
                  </span>
                  {team.city && team.country && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {team.city}, {team.country}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0 || saving}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={!Array.isArray(internationalTeams) || index === internationalTeams.length - 1 || saving}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => toggleInternational(team.id, true)}
                    disabled={saving}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista de Todos os Times */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Todos os Times Disponíveis ({filteredTeams.length} times)
        </h2>

        {/* Barra de busca */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar times por nome, cidade, país..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
        </div>

        {/* Debug info */}
        <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
          <p>Debug: teams.length = {teams.length}</p>
          <p>Debug: filteredTeams.length = {filteredTeams.length}</p>
          <p>Debug: Array.isArray(teams) = {Array.isArray(teams).toString()}</p>
          <p>Debug: Página atual: {currentPage} de {totalPages}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentTeams.map((team) => {
            const isInternational = internationalTeams.some(it => it.id === team.id);
            return (
              <div
                key={team.id}
                className={`p-4 border rounded-lg ${
                  isInternational
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-slate-600'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <img
                      src={team.logo_url || '/placeholder-team.png'}
                      alt={team.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {team.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {team.city && team.country ? `${team.city}, ${team.country}` : 'Localização não informada'}
                    </p>
                    {isInternational && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Internacional
                      </span>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {!isInternational ? (
                      <button
                        onClick={() => addInternationalTeam(team)}
                        disabled={saving}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {saving ? 'Adicionando...' : 'Adicionar'}
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleInternational(team.id, false)}
                        disabled={saving}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        {saving ? 'Removendo...' : 'Remover'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              >
                Próxima
              </button>
            </div>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Informações */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Como Funciona
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Selecione até 20 times internacionais para exibir na aba "Internacional"</li>
          <li>• Use as setas ↑↓ para reordenar os times selecionados</li>
          <li>• Os times selecionados aparecerão na ordem definida</li>
          <li>• Clique em "Remover" para tirar um time da lista internacional</li>
        </ul>
      </div>
    </div>
  );
}
