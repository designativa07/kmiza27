'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { API_ENDPOINTS, imageUrl } from '../config/api'

interface Team {
  id: number
  name: string
  slug: string
  short_name: string
  logo_url?: string
  founded_year?: number
  city?: string
  state?: string
  stadium?: string
  created_at: string
}

export default function TeamsManager() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [logoInputType, setLogoInputType] = useState<'upload' | 'url'>('upload')
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    city: '',
    state: '',
    founded_year: '',
    logo_url: ''
  })

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.teams.list())
      const data = await response.json()
      setTeams(data)
    } catch (error) {
      console.error('Erro ao carregar times:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setFormData(prev => ({ ...prev, logo_url: '' }))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (name === 'logo_url' && value) {
      setSelectedFile(null)
      setPreviewUrl(value)
    }
  }

  const uploadEscudo = async (teamId: number): Promise<string | null> => {
    if (!selectedFile) return null

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('escudo', selectedFile)

      const response = await fetch(API_ENDPOINTS.teams.uploadLogo(teamId), {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        return result.filePath
      }
      return null
    } catch (error) {
      console.error('Erro ao fazer upload do escudo:', error)
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingTeam 
        ? API_ENDPOINTS.teams.byId(editingTeam.id)
        : API_ENDPOINTS.teams.list()
      
      const method = editingTeam ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          founded_year: formData.founded_year ? parseInt(formData.founded_year) : null
        }),
      })

      if (response.ok) {
        const savedTeam = await response.json()
        
        if (selectedFile) {
          const uploadedPath = await uploadEscudo(savedTeam.id)
          if (uploadedPath) {
            await fetch(API_ENDPOINTS.teams.byId(savedTeam.id), {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ logo_url: uploadedPath })
            })
          }
        }
        
        fetchTeams()
        resetForm()
      }
    } catch (error) {
      console.error('Erro ao salvar time:', error)
    }
  }

  const resetForm = () => {
    setShowModal(false)
    setEditingTeam(null)
    setSelectedFile(null)
    setPreviewUrl('')
    setLogoInputType('upload')
    setFormData({
      name: '',
      short_name: '',
      city: '',
      state: '',
      founded_year: '',
      logo_url: ''
    })
  }

  const handleEdit = (team: Team) => {
    setEditingTeam(team)
    setFormData({
      name: team.name,
      short_name: team.short_name || '',
      city: team.city || '',
      state: team.state || '',
      founded_year: team.founded_year?.toString() || '',
      logo_url: team.logo_url || ''
    })
    
    if (team.logo_url) {
      if (team.logo_url.startsWith('http') || team.logo_url.startsWith('https')) {
        setLogoInputType('url')
      } else {
        setLogoInputType('upload')
      }
      setPreviewUrl(team.logo_url.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${team.logo_url}` : team.logo_url)
    }
    
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este time?')) {
      try {
        await fetch(API_ENDPOINTS.teams.byId(id), {
          method: 'DELETE',
        })
        fetchTeams()
      } catch (error) {
        console.error('Erro ao excluir time:', error)
      }
    }
  }

  if (loading) {
    return <div className="text-center">Carregando times...</div>
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Times</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie todos os times cadastrados no sistema.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusIcon className="h-4 w-4 inline mr-1" />
            Adicionar Time
          </button>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-white dark:bg-slate-800 border-b-2 border-gray-200 dark:border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome Curto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cidade/Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fundação
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teams.map((team) => (
                    <tr key={team.id}>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          {team.logo_url && (
                            <img 
                              className="h-6 w-6 rounded-md mr-3 object-cover" 
                              src={imageUrl(team.logo_url)} 
                              alt={`Escudo ${team.name}`}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{team.name}</div>
                            <div className="text-sm text-gray-700">{team.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        {team.short_name}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        {team.city && team.state ? `${team.city}, ${team.state}` : team.city || team.state || '-'}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        {team.founded_year || '-'}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(team)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(team.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
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
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingTeam ? 'Editar Time' : 'Adicionar Time'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900">Nome</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900">Nome Curto</label>
                  <input
                    type="text"
                    required
                    value={formData.short_name}
                    onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900">Cidade</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900">Estado</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900">Ano de Fundação</label>
                  <input
                    type="number"
                    value={formData.founded_year}
                    onChange={(e) => setFormData({ ...formData, founded_year: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500 px-4 py-3"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Escudo do Time</label>
                  
                  <div className="mb-3">
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="logoInputType"
                          value="upload"
                          checked={logoInputType === 'upload'}
                          onChange={(e) => {
                            setLogoInputType('upload')
                            setFormData(prev => ({ ...prev, logo_url: '' }))
                            setPreviewUrl('')
                          }}
                          className="mr-2"
                        />
                        Upload de Arquivo
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="logoInputType"
                          value="url"
                          checked={logoInputType === 'url'}
                          onChange={(e) => {
                            setLogoInputType('url')
                            setSelectedFile(null)
                            setPreviewUrl('')
                          }}
                          className="mr-2"
                        />
                        URL Externa
                      </label>
                    </div>
                  </div>
                  
                  {previewUrl && (
                    <div className="mb-3">
                      <img 
                        src={previewUrl} 
                        alt="Preview do escudo" 
                        className="h-20 w-20 object-cover rounded-lg border border-gray-300"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-team.png'
                        }}
                      />
                    </div>
                  )}
                  
                  {logoInputType === 'upload' ? (
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label htmlFor="escudo-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                            <span>Enviar escudo</span>
                            <input
                              id="escudo-upload"
                              name="escudo-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleFileChange}
                            />
                          </label>
                          <p className="pl-1">ou arraste e solte</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF, SVG até 5MB
                        </p>
                        {selectedFile && (
                          <p className="text-xs text-green-600">
                            Arquivo selecionado: {selectedFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="url"
                        name="logo_url"
                        value={formData.logo_url}
                        onChange={handleInputChange}
                        placeholder="https://exemplo.com/escudo.png"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Cole a URL direta de uma imagem hospedada externamente
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-md border border-gray-300 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 dark:hover:bg-slate-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {uploading ? 'Enviando...' : (editingTeam ? 'Atualizar' : 'Criar')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 