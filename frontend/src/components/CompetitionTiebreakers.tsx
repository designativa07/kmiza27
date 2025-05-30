'use client'

import React, { useState, useEffect } from 'react'
import { API_ENDPOINTS } from '../config/api'

interface Competition {
  id: number
  name: string
  tiebreaker_criteria?: TiebreakerCriteria
}

interface TiebreakerCriteria {
  criteria: TiebreakerCriterion[]
  description?: string
}

interface TiebreakerCriterion {
  order: number
  name: string
  description: string
  type: 'points' | 'wins' | 'goal_difference' | 'goals_for' | 'head_to_head' | 'red_cards' | 'yellow_cards' | 'draw'
}

const DEFAULT_BRASILEIRAO_CRITERIA: TiebreakerCriterion[] = [
  {
    order: 1,
    name: 'Pontos',
    description: 'Maior número de pontos',
    type: 'points'
  },
  {
    order: 2,
    name: 'Vitórias',
    description: 'Maior número de vitórias',
    type: 'wins'
  },
  {
    order: 3,
    name: 'Saldo de Gols',
    description: 'Maior saldo de gols',
    type: 'goal_difference'
  },
  {
    order: 4,
    name: 'Gols Pró',
    description: 'Maior número de gols marcados',
    type: 'goals_for'
  },
  {
    order: 5,
    name: 'Confronto Direto',
    description: 'Melhor resultado no confronto direto (apenas entre 2 times)',
    type: 'head_to_head'
  },
  {
    order: 6,
    name: 'Cartões Vermelhos',
    description: 'Menor número de cartões vermelhos',
    type: 'red_cards'
  },
  {
    order: 7,
    name: 'Cartões Amarelos',
    description: 'Menor número de cartões amarelos',
    type: 'yellow_cards'
  },
  {
    order: 8,
    name: 'Sorteio',
    description: 'Sorteio realizado pela CBF',
    type: 'draw'
  }
]

export default function CompetitionTiebreakers() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null)
  const [criteria, setCriteria] = useState<TiebreakerCriterion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCompetitions()
  }, [])

  const fetchCompetitions = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.competitions.list())
      const data = await response.json()
      setCompetitions(data)
    } catch (error) {
      console.error('Erro ao carregar competições:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCompetitionSelect = (competition: Competition) => {
    setSelectedCompetition(competition)
    if (competition.tiebreaker_criteria?.criteria) {
      setCriteria(competition.tiebreaker_criteria.criteria)
    } else {
      setCriteria([...DEFAULT_BRASILEIRAO_CRITERIA])
    }
  }

  const handleSaveCriteria = async () => {
    if (!selectedCompetition) return

    setSaving(true)
    try {
      const tiebreakerData: TiebreakerCriteria = {
        criteria: criteria,
        description: 'Critérios de desempate e classificação'
      }

      const response = await fetch(`${API_ENDPOINTS.competitions.list()}/${selectedCompetition.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tiebreaker_criteria: tiebreakerData
        }),
      })

      if (response.ok) {
        alert('Critérios salvos com sucesso!')
        fetchCompetitions() // Recarregar para atualizar os dados
      } else {
        alert('Erro ao salvar critérios')
      }
    } catch (error) {
      console.error('Erro ao salvar critérios:', error)
      alert('Erro ao salvar critérios')
    } finally {
      setSaving(false)
    }
  }

  const handleUseBrasileiraoCriteria = () => {
    setCriteria([...DEFAULT_BRASILEIRAO_CRITERIA])
  }

  if (loading) {
    return <div className="text-center">Carregando competições...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Critérios de Desempate</h1>
        <p className="mt-2 text-sm text-gray-700">
          Configure os critérios de desempate e classificação para cada competição.
        </p>
      </div>

      {/* Seleção de Competição */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecione uma Competição
        </label>
        <select
          value={selectedCompetition?.id || ''}
          onChange={(e) => {
            const comp = competitions.find(c => c.id === parseInt(e.target.value))
            if (comp) handleCompetitionSelect(comp)
          }}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="">Selecione uma competição...</option>
          {competitions.map((comp) => (
            <option key={comp.id} value={comp.id}>
              {comp.name}
            </option>
          ))}
        </select>
      </div>

      {selectedCompetition && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Critérios para: {selectedCompetition.name}
            </h2>
            <button
              onClick={handleUseBrasileiraoCriteria}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Usar Critérios do Brasileirão
            </button>
          </div>

          <div className="space-y-4">
            {criteria.map((criterion, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-800 text-sm font-medium">
                      {criterion.order}º
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {criterion.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {criterion.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveCriteria}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar Critérios'}
            </button>
          </div>
        </div>
      )}

      {/* Informações sobre os Critérios do Brasileirão */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">
          Critérios de Desempate do Brasileirão 2025
        </h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>1º:</strong> Maior número de vitórias</p>
          <p><strong>2º:</strong> Maior saldo de gols</p>
          <p><strong>3º:</strong> Maior número de gols pró</p>
          <p><strong>4º:</strong> Confronto direto (apenas entre 2 clubes)</p>
          <p><strong>5º:</strong> Menor número de cartões vermelhos</p>
          <p><strong>6º:</strong> Menor número de cartões amarelos</p>
          <p><strong>7º:</strong> Sorteio</p>
        </div>
      </div>
    </div>
  )
} 