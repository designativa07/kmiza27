'use client';

import { useState, useEffect, useRef } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, TrophyIcon, PhotoIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { getTeamLogoUrl } from '@/lib/cdn';
import { API_ENDPOINTS } from '@/config/api';
import titlesService from '@/services/titlesService';

interface Title {
  id: number;
  name: string;
  competition_name?: string;
  season?: string;
  year?: number;
  description?: string;
  category?: string;
  type?: string;
  display_order?: number;
  is_active: boolean;
  image_url?: string;
  team_id: number;
  team: {
    id: number;
    name: string;
    logo_url?: string;
  };
  created_at: string;
  updated_at: string;
}

interface Team {
  id: number;
  name: string;
  logo_url?: string;
}

export default function TitlesPage() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<number | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [editingTitle, setEditingTitle] = useState<Title | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Estados para autocomplete do time
  const [teamSearchTerm, setTeamSearchTerm] = useState('');
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    competition_name: '',
    season: '',
    year: '',
    description: '',
    category: '',
    type: '',
    team_id: '',
    is_active: true,
    image_url: '',
  });

  useEffect(() => {
    fetchTitles();
    fetchTeams();
  }, [searchTerm, selectedTeamId]);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.team-dropdown-container')) {
        setShowTeamDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchTitles = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedTeamId) params.append('teamId', selectedTeamId.toString());
      
      // Usar titlesService em vez de fetch direto para ter o interceptor automático
      const response = await titlesService.getAllTitles(params.toString());
      
      setTitles(response.data || response);
    } catch (error) {
      console.error('Erro ao buscar títulos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.teams.all());
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      } else {
        console.error('Erro ao buscar times:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Erro ao buscar times:', error);
    }
  };

  const handleImageUpload = async (titleId: number) => {
    if (!selectedImageFile) return;

    setUploadingImage(true);
    try {
      const result = await titlesService.uploadImage(titleId, selectedImageFile);
      alert('Imagem do troféu enviada com sucesso!');
      fetchTitles(); // Recarregar lista para mostrar nova imagem
      setSelectedImageFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      alert('Erro ao enviar imagem');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const titleData = {
        ...formData,
        year: formData.year ? parseInt(formData.year) : null,
        team_id: parseInt(formData.team_id),
      };
      
      let savedTitle;
      if (editingTitle) {
        savedTitle = await titlesService.updateTitle(editingTitle.id, titleData);
      } else {
        savedTitle = await titlesService.createTitle(titleData);
      }

      // Se há uma imagem selecionada, fazer upload
      if (selectedImageFile && savedTitle.id) {
        await handleImageUpload(savedTitle.id);
      } else {
        setShowModal(false);
        setEditingTitle(null);
        resetForm();
        fetchTitles();
      }
    } catch (error) {
      console.error('Erro ao salvar título:', error);
      alert('Erro ao salvar título');
    }
  };

  const handleEdit = (title: Title) => {
    setEditingTitle(title);
    setFormData({
      name: title.name,
      competition_name: title.competition_name || '',
      season: title.season || '',
      year: title.year?.toString() || '',
      description: title.description || '',
      category: title.category || '',
      type: title.type || '',
      team_id: title.team_id.toString(),
      is_active: title.is_active,
      image_url: title.image_url || '',
    });
    setSelectedImageFile(null);
    setImagePreview(null);
    setTeamSearchTerm(title.team.name);
    setSelectedTeam(title.team);
    setShowTeamDropdown(false);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este título?')) return;

    try {
      await titlesService.deleteTitle(id);
      fetchTitles();
    } catch (error) {
      console.error('Erro ao excluir título:', error);
      alert('Erro ao excluir título');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      competition_name: '',
      season: '',
      year: '',
      description: '',
      category: '',
      type: '',
      team_id: '',
      is_active: true,
      image_url: '',
    });
    setSelectedImageFile(null);
    setImagePreview(null);
    setTeamSearchTerm('');
    setSelectedTeam(null);
    setShowTeamDropdown(false);
  };

  const openCreateModal = () => {
    setEditingTitle(null);
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTitle(null);
    resetForm();
    setTeamSearchTerm('');
    setShowTeamDropdown(false);
    setSelectedTeam(null);
  };

  // Funções para autocomplete do time
  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(teamSearchTerm.toLowerCase())
  );

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team);
    setTeamSearchTerm(team.name);
    setFormData({ ...formData, team_id: team.id.toString() });
    setShowTeamDropdown(false);
  };

  const handleTeamInputChange = (value: string) => {
    setTeamSearchTerm(value);
    setShowTeamDropdown(true);
    if (!value) {
      setSelectedTeam(null);
      setFormData({ ...formData, team_id: '' });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Títulos</h1>
        <p className="text-gray-600">
          Gerencie os títulos conquistados pelos times, incluindo campeonatos, copas e outros troféus.
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar títulos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="sm:w-64">
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value ? parseInt(e.target.value) : '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os times</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Novo Título
        </button>
      </div>

      {/* Lista de Títulos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Troféu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Competição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ano
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {titles.map((title) => (
                <tr key={title.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {title.team.logo_url ? (
                        <img
                          src={getTeamLogoUrl(title.team.logo_url)}
                          alt={`${title.team.name} logo`}
                          className="h-8 w-8 object-contain mr-3"
                        />
                      ) : (
                        <div className="h-8 w-8 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                          <TrophyIcon className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        {title.team.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {title.image_url ? (
                        <img
                          src={title.image_url}
                          alt={`Troféu ${title.name}`}
                          className="h-10 w-10 object-contain rounded-lg border border-gray-200 mr-3"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      {!title.image_url && (
                        <div className="h-10 w-10 bg-gray-100 rounded-lg border border-gray-200 mr-3 flex items-center justify-center">
                          <TrophyIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      {title.image_url && (
                        <div className="h-10 w-10 bg-gray-100 rounded-lg border border-gray-200 mr-3 flex items-center justify-center hidden">
                          <TrophyIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div className="text-sm text-gray-500">
                        {title.image_url ? 'Com imagem' : 'Sem imagem'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{title.name}</div>
                    {title.type && (
                      <div className="text-sm text-gray-500">{title.type}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{title.competition_name || '-'}</div>
                    {title.season && (
                      <div className="text-sm text-gray-500">{title.season}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {title.year || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {title.category && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {title.category}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      title.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {title.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(title)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      title="Editar"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(title.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Excluir"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {titles.length === 0 && (
          <div className="text-center py-12">
            <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum título encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedTeamId 
                ? 'Tente ajustar os filtros de busca.' 
                : 'Comece adicionando o primeiro título.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border shadow-lg rounded-lg bg-white w-full max-w-6xl max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingTitle ? 'Editar Título' : 'Novo Título'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
              
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Primeira linha - Time e Nome do Título */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time *
                  </label>
                  <div className="relative team-dropdown-container">
                    <input
                      type="text"
                      required
                      value={teamSearchTerm}
                      onChange={(e) => handleTeamInputChange(e.target.value)}
                      onFocus={() => setShowTeamDropdown(true)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                      placeholder="Digite o nome do time..."
                    />
                    <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    
                    {showTeamDropdown && filteredTeams.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredTeams.map((team) => (
                          <div
                            key={team.id}
                            onClick={() => handleTeamSelect(team)}
                            className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            {team.logo_url ? (
                              <img
                                src={getTeamLogoUrl(team.logo_url)}
                                alt={`${team.name} logo`}
                                className="h-6 w-6 object-contain mr-3"
                              />
                            ) : (
                              <div className="h-6 w-6 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                                <TrophyIcon className="h-3 w-3 text-gray-400" />
                              </div>
                            )}
                            <span className="text-sm">{team.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Título *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Campeonato Brasileiro"
                  />
                </div>
              </div>

              {/* Segunda linha - Competição e Temporada */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Competição
                  </label>
                  <input
                    type="text"
                    value={formData.competition_name}
                    onChange={(e) => setFormData({ ...formData, competition_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Brasileirão Série A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temporada
                  </label>
                  <input
                    type="text"
                    value={formData.season}
                    onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: 2024"
                  />
                </div>
              </div>

              {/* Terceira linha - Ano e Categoria */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ano
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione</option>
                    <option value="Nacional">Nacional</option>
                    <option value="Internacional">Internacional</option>
                    <option value="Estadual">Estadual</option>
                    <option value="Regional">Regional</option>
                  </select>
                </div>
              </div>

              {/* Quarta linha - Tipo e Status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione</option>
                    <option value="Campeonato">Campeonato</option>
                    <option value="Copa">Copa</option>
                    <option value="Supercopa">Supercopa</option>
                    <option value="Torneio">Torneio</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Título ativo
                  </label>
                </div>
              </div>

              {/* Quinta linha - Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descrição detalhada do título..."
                />
              </div>

              {/* Sexta linha - Upload de Imagem e URL */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagem do Troféu
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-20 w-20 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                    {editingTitle?.image_url && !imagePreview && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Imagem atual:</p>
                        <img
                          src={editingTitle.image_url}
                          alt="Troféu atual"
                          className="h-20 w-20 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL da Imagem (alternativa)
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploadingImage ? 'Enviando...' : (editingTitle ? 'Atualizar' : 'Criar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 