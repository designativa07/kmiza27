'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'
import { apiUrl } from '../config/api'

interface Round {
  id: number
  name: string
  round_number?: number
  phase?: string
  display_order: number
  start_date?: string
  end_date?: string
  is_current: boolean
  created_at: string
}

interface RoundFormData {
  name: string
  round_number?: number
  phase?: string
  display_order?: number
  start_date?: string
  end_date?: string
  is_current: boolean
}

interface RoundsManagerProps {
  competitionId: number
  competitionType: string
}

export default function RoundsManager({ competitionId, competitionType }: RoundsManagerProps) {
  const [rounds, setRounds] = useState<Round[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRound, setEditingRound] = useState<Round | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  
  const [formData, setFormData] = useState<RoundFormData>({
    name: '',
    round_number: undefined,
    phase: '',
    display_order: undefined,
    start_date: '',
    end_date: '',
    is_current: false
  })

  useEffect(() => {
    fetchRounds()
    fetchSuggestions()
  }, [competitionId])

  const fetchRounds = async () => {
    try {
      const response = await fetch(apiUrl(`rounds/competition/${competitionId}`))
      if (response.ok) {
        const data = await response.json()
        setRounds(data)
      }
    } catch (error) {
      console.error('Erro ao carregar rodadas:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSuggestions = async () => {
    try {
      const response = await fetch(apiUrl(`rounds/competition/${competitionId}/suggestions`))
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data)
      }
    } catch (error) {
      console.error('Erro ao carregar sugestões:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Para PATCH (edição), não enviar competition_id
      // Para POST (criação), enviar competition_id
      const payload = editingRound 
        ? {
            ...formData,
            round_number: formData.round_number || undefined,
            phase: formData.phase || undefined,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null
          }
        : {
            ...formData,
            competition_id: competitionId,
            round_number: formData.round_number || undefined,
            phase: formData.phase || undefined,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null
          }

      const url = editingRound 
        ? apiUrl(`rounds/${editingRound.id}`)
        : apiUrl('rounds')
      
      const method = editingRound ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Falha ao salvar rodada')
      }

      fetchRounds()
      handleCloseModal()
    } catch (error) {
      console.error('Erro ao salvar rodada:', error)
      alert('Ocorreu um erro ao salvar a rodada. Verifique o console.')
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingRound(null)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      round_number: undefined,
      phase: '',
      display_order: undefined,
      start_date: '',
      end_date: '',
      is_current: false
    })
  }

  const handleEdit = (round: Round) => {
    setEditingRound(round)
    setFormData({
      name: round.name,
      round_number: round.round_number,
      phase: round.phase || '',
      display_order: round.display_order,
      start_date: round.start_date || '',
      end_date: round.end_date || '',
      is_current: round.is_current
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta rodada?')) {
      try {
        await fetch(apiUrl(`rounds/${id}`), {
          method: 'DELETE',
        })
        fetchRounds()
      } catch (error) {
        console.error('Erro ao excluir rodada:', error)
      }
    }
  }

  const handleReorder = async (roundId: number, direction: 'up' | 'down') => {
    const currentIndex = rounds.findIndex(r => r.id === roundId)
    if (currentIndex === -1) return

    const newRounds = [...rounds]
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    if (targetIndex < 0 || targetIndex >= newRounds.length) return

    // Trocar posições
    [newRounds[currentIndex], newRounds[targetIndex]] = [newRounds[targetIndex], newRounds[currentIndex]]
    
    // Atualizar display_order
    const roundIds = newRounds.map(r => r.id)
    
    try {
      await fetch(apiUrl(`rounds/competition/${competitionId}/reorder`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundIds }),
      })
      fetchRounds()
    } catch (error) {
      console.error('Erro ao reordenar rodadas:', error)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setFormData(prev => ({ ...prev, name: suggestion }))
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
    return <div className="text-center">Carregando rodadas...</div>
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-lg font-medium text-gray-900">Rodadas</h2>
          <p className="mt-1 text-sm text-gray-700">
            Gerencie as rodadas desta competição ({getTypeLabel(competitionType)}).
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => { setEditingRound(null); setShowModal(true); }}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Adicionar Rodada
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
                      Ordem
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Nome</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tipo</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Ações</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {rounds.map((round, index) => (
                    <tr key={round.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        <div className="flex items-center space-x-2">
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                            {round.display_order}
                          </span>
                          <div className="flex flex-col">
                            <button
                              onClick={() => handleReorder(round.id, 'up')}
                              disabled={index === 0}
                              className="p-1 text-gray-400 hover:text-gray-500 disabled:opacity-50"
                              title="Mover para cima"
                            >
                              <ArrowUpIcon className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleReorder(round.id, 'down')}
                              disabled={index === rounds.length - 1}
                              className="p-1 text-gray-400 hover:text-gray-500 disabled:opacity-50"
                              title="Mover para baixo"
                            >
                              <ArrowDownIcon className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{round.name}</div>
                          {round.phase && (
                            <div className="text-gray-500 text-xs">{round.phase}</div>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {round.round_number ? `Rodada ${round.round_number}` : 'Mata-mata'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          round.is_current
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {round.is_current ? 'Atual' : 'Inativa'}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => handleEdit(round)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                          title="Editar rodada"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(round.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir rodada"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={handleCloseModal}></div>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {editingRound ? 'Editar Rodada' : 'Nova Rodada'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome da Rodada</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Ex: Final, Rodada 1, Oitavas..."
                    />
                    {/* Sugestões */}
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Sugestões para {getTypeLabel(competitionType)}:</p>
                      <div className="flex flex-wrap gap-1">
                        {suggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Número da Rodada</label>
                      <input
                        type="number"
                        value={formData.round_number || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, round_number: e.target.value ? parseInt(e.target.value) : undefined }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Ex: 1, 2, 3..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fase</label>
                      <input
                        type="text"
                        value={formData.phase}
                        onChange={(e) => setFormData(prev => ({ ...prev, phase: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Ex: Classificatória, Eliminatória..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_current}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_current: e.target.checked }))}
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Rodada atual</span>
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      {editingRound ? 'Salvar' : 'Criar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
