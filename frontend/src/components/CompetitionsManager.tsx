'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, UsersIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { API_ENDPOINTS, imageUrl } from '../config/api'
import CompetitionTeamsManager from './CompetitionTeamsManager'

interface Competition {
  id: number
  name: string
  slug: string
  type: string
  season: string
  country?: string
  logo_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function CompetitionsManager() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null)
  const [showTeamsManager, setShowTeamsManager] = useState<number | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'pontos_corridos',
    season: new Date().getFullYear().toString(),
    country: 'Brasil',
    is_active: true
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

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
      const savedCompetition = await response.json()

      if (logoFile) {
        const logoFormData = new FormData()
        logoFormData.append('logo', logoFile)
        const uploadResponse = await fetch(
          API_ENDPOINTS.competitions.uploadLogo(savedCompetition.id),
          { method: 'POST', body: logoFormData }
        )
        if (!uploadResponse.ok) {
          throw new Error('Falha ao fazer upload da logo')
        }
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
    setLogoFile(null)
    setLogoPreview(null)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      type: 'pontos_corridos',
      season: new Date().getFullYear().toString(),
      country: 'Brasil',
      is_active: true
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
      is_active: competition.is_active
    })
    setLogoPreview(competition.logo_url ? imageUrl(competition.logo_url) : null)
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
      pontos_corridos: 'Pontos Corridos',
      grupos_e_mata_mata: 'Copa com Grupos',
      copa: 'Copa'
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
                              src={competition.logo_url ? imageUrl(competition.logo_url) : `https://ui-avatars.com/api/?name=${competition.name.replace(/\s/g, "+")}&background=random`}
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
          <div className="relative top-10 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {editingCompetition ? 'Editar Competição' : 'Adicionar Nova Competição'}
            </h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">Logo</label>
                <div className="mt-1 flex items-center">
                  <span className="inline-block h-12 w-12 overflow-hidden rounded-md bg-gray-100">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Preview" className="h-full w-full object-contain" />
                    ) : (
                      <PhotoIcon className="h-full w-full text-gray-300" />
                    )}
                  </span>
                  <label htmlFor="logo-upload" className="ml-5 cursor-pointer rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50">
                    <span>Alterar</span>
                    <input id="logo-upload" name="logo" type="file" className="sr-only" 
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          const file = e.target.files[0]
                          setLogoFile(file)
                          setLogoPreview(URL.createObjectURL(file))
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Nome</label>
                <input
                  type="text" required value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setFormData({ ...formData, name, slug: generateSlug(name) })
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Slug</label>
                <input type="text" required value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50" readOnly />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Tipo</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                    <option value="pontos_corridos">Pontos Corridos</option>
                    <option value="grupos_e_mata_mata">Copa com Grupos</option>
                    <option value="copa">Copa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Temporada</label>
                  <input type="text" required value={formData.season} onChange={(e) => setFormData({ ...formData, season: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">País</label>
                <input type="text" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
              </div>
              <div className="flex items-center">
                <input id="is_active" type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="h-4 w-4 text-indigo-600 rounded border-gray-300" />
                <label htmlFor="is_active" className="ml-2 block text-sm">Competição ativa</label>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={handleCloseModal} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500">{editingCompetition ? 'Atualizar' : 'Criar'}</button>
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
    </div>
  )
} 