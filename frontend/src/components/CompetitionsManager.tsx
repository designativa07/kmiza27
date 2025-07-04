'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, UsersIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { API_ENDPOINTS } from '../config/api'
import { getCompetitionLogoUrl, handleImageError } from '../lib/cdn'
import CompetitionTeamsManager from './CompetitionTeamsManager'
import RoundsManager from './RoundsManager'

interface Competition {
  id: number
  name: string
  slug: string
  type: string
  season: string
  country?: string
  logo_url?: string
  is_active: boolean
  regulamento?: string
  created_at: string
  updated_at: string
}

// Definir o tipo para o estado do formulário
interface CompetitionFormData {
  name: string;
  slug: string;
  type: string;
  season: string;
  country: string;
  is_active: boolean;
  logo_url?: string;
  regulamento?: string;
}

export default function CompetitionsManager() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null)
  const [showTeamsManager, setShowTeamsManager] = useState<number | null>(null)
  const [showRoundsManager, setShowRoundsManager] = useState<{ competitionId: number; competitionName: string; competitionType: string } | null>(null)
  
  // Usar a nova interface para o formData
  const [formData, setFormData] = useState<CompetitionFormData>({
    name: '',
    slug: '',
    type: 'pontos_corridos',
    season: new Date().getFullYear().toString(),
    country: 'Brasil',
    is_active: true,
    logo_url: '' // Inicializar com string vazia
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.competitions.list())
      if (response.ok) {
        const data = await response.json()
        setCompetitions(data)
      }
    } catch (error) {
      console.error('Erro ao carregar competições:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingCompetition 
        ? `${API_ENDPOINTS.competitions.list()}/${editingCompetition.id}`
        : API_ENDPOINTS.competitions.list()
      
      const method = editingCompetition ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Falha ao salvar dados da competição')
      }

      fetchData()
      handleCloseModal()
    } catch (error) {
      console.error('Erro ao salvar competição:', error)
      alert('Ocorreu um erro. Verifique o console.')
    }
  }
  
  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCompetition(null)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      type: 'pontos_corridos',
      season: new Date().getFullYear().toString(),
      country: 'Brasil',
      is_active: true,
      logo_url: '',
      regulamento: ''
    })
  }

  const handleEdit = (competition: Competition) => {
    setEditingCompetition(competition)
    setFormData({
      name: competition.name,
      slug: competition.slug,
      type: competition.type,
      season: competition.season,
      country: competition.country || 'Brasil',
      is_active: competition.is_active,
      logo_url: competition.logo_url || '',
      regulamento: competition.regulamento || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta competição?')) {
      try {
        await fetch(`${API_ENDPOINTS.competitions.list()}/${id}`, {
          method: 'DELETE',
        })
        fetchData()
      } catch (error) {
        console.error('Erro ao excluir competição:', error)
      }
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const getTypeLabel = (type: string) => {
    const types = {
      pontos_corridos: 'Campeonato',
      grupos_e_mata_mata: 'Copa',
      copa: 'Copa',
      mata_mata: 'Torneio',
      serie: 'Série C'
    }
    return types[type as keyof typeof types] || type
  }

  if (loading) {
    return <div className="text-center">Carregando competições...</div>
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Competições</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie todas as competições e campeonatos do sistema.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => { setEditingCompetition(null); setShowModal(true); }}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Adicionar Competição
          </button>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Competição
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tipo</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Temporada</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Ações</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {competitions.map((competition) => (
                    <tr key={competition.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img
                              className="h-10 w-10 rounded-md object-contain"
                              src={competition.logo_url ? getCompetitionLogoUrl(competition.logo_url) : `https://ui-avatars.com/api/?name=${competition.name.replace(/\s/g, "+")}&background=random`}
                              alt={competition.name}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">{competition.name}</div>
                            <div className="text-gray-500">{competition.country}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{getTypeLabel(competition.type)}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{competition.season}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          competition.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {competition.is_active ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => setShowTeamsManager(competition.id)}
                          className="text-blue-600 hover:text-blue-900 mr-3" title="Gerenciar Times"
                        ><UsersIcon className="h-4 w-4" /></button>
                        <button
                          onClick={() => setShowRoundsManager({ 
                            competitionId: competition.id, 
                            competitionName: competition.name,
                            competitionType: competition.type 
                          })}
                          className="text-green-600 hover:text-green-900 mr-3" title="Gerenciar Rodadas"
                        ><PhotoIcon className="h-4 w-4" /></button>
                        <button onClick={() => handleEdit(competition)} className="text-indigo-600 hover:text-indigo-900 mr-3" title="Editar"><PencilIcon className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(competition.id)} className="text-red-600 hover:text-red-900" title="Excluir"><TrashIcon className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              {editingCompetition ? 'Editar Competição' : 'Adicionar Competição'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })}
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">Slug</label>
                <input
                  type="text"
                  name="slug"
                  id="slug"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-100"
                  value={formData.slug}
                  readOnly
                />
              </div>
              <div className="mb-4">
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipo</label>
                <select
                  name="type"
                  id="type"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="pontos_corridos">Campeonato (Pontos Corridos)</option>
                  <option value="grupos_e_mata_mata">Copa (Grupos + Mata-mata)</option>
                  <option value="mata_mata">Torneio (Mata-mata)</option>
                  <option value="serie">Série C (1ª Fase + Quadrangular)</option>
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="season" className="block text-sm font-medium text-gray-700">Temporada</label>
                <input
                  type="text"
                  name="season"
                  id="season"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.season}
                  onChange={e => setFormData({ ...formData, season: e.target.value })}
                  required
                />
              </div>

              {/* Novo campo para URL da Logo */}
              <div className="mb-4">
                <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700">URL da Logo</label>
                <input
                  type="url"
                  name="logo_url"
                  id="logo_url"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.logo_url || ''}
                  onChange={e => setFormData({ ...formData, logo_url: e.target.value })}
                />
                {/* Exibição da pré-visualização da logo (se houver) */}
                {formData.logo_url && (
                  <div className="mt-2">
                    <img src={formData.logo_url} alt="Pré-visualização da Logo" className="h-20 w-20 object-contain rounded-md" />
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">País</label>
                <input
                  type="text"
                  name="country"
                  id="country"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.country}
                  onChange={e => setFormData({ ...formData, country: e.target.value })}
                  required
                />
              </div>

              {/* Campo Regulamento */}
              <div className="mb-4">
                <label htmlFor="regulamento" className="block text-sm font-medium text-gray-700">Regulamento</label>
                <textarea
                  name="regulamento"
                  id="regulamento"
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.regulamento || ''}
                  onChange={e => setFormData({ ...formData, regulamento: e.target.value })}
                  placeholder="Ex: Os 20 participantes se enfrentam em turno único na primeira fase, totalizando 19 rodadas..."
                />
              </div>

              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">Competição ativa</label>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="mr-2 rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTeamsManager && (
        <CompetitionTeamsManager
          competitionId={showTeamsManager}
          onClose={() => setShowTeamsManager(null)}
        />
      )}

      {showRoundsManager && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border max-w-6xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Gerenciar Rodadas - {showRoundsManager.competitionName}
              </h3>
              <button
                onClick={() => setShowRoundsManager(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <RoundsManager 
              competitionId={showRoundsManager.competitionId} 
              competitionType={showRoundsManager.competitionType}
            />
          </div>
        </div>
      )}
    </div>
  )
} 