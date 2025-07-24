'use client'

import React from 'react'
import { TrophyIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { API_ENDPOINTS } from '../config/api'
import { getPlayerImageUrl, handleImageError } from '../lib/cdn'

interface Player {
  id: number
  name: string
  position?: string
  image_url?: string
  jersey_number?: number
}

interface Team {
  id: number
  name: string
  short_name: string
  logo_url?: string
}

interface Competition {
  id: number
  name: string
  season?: string
}

interface PlayerStats {
  player: Player
  team: Team
  goals: number
  matches_played: number
  assists?: number
  yellow_cards?: number
  red_cards?: number
  goals_per_match: number
  competition?: Competition
}

interface TopScorersChartProps {
  playerStats: PlayerStats[]
  maxPlayers?: number
}

export default function TopScorersChart({ playerStats, maxPlayers = 10 }: TopScorersChartProps) {
  const topPlayers = playerStats.slice(0, maxPlayers)
  const maxGoals = topPlayers.length > 0 ? topPlayers[0].goals : 0

  if (topPlayers.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrophyIcon className="h-5 w-5 mr-2 text-yellow-500" />
          Top {maxPlayers} Artilheiros
        </h3>
        <div className="text-center text-gray-500 py-8">
          Nenhum artilheiro encontrado
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <TrophyIcon className="h-5 w-5 mr-2 text-yellow-500" />
        Top {maxPlayers} Artilheiros
      </h3>
      
      <div className="space-y-4">
        {topPlayers.map((stat, index) => {
          const percentage = maxGoals > 0 ? (stat.goals / maxGoals) * 100 : 0
          
          return (
            <div key={`${stat.player.id}-${stat.competition?.id || 'all'}`} className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index + 1}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    {stat.player.image_url ? (
                      <img 
                        className="h-8 w-8 rounded-full object-cover" 
                        src={getPlayerImageUrl(stat.player.image_url)}
                        alt={stat.player.name}
                        onError={handleImageError}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-600">
                          {stat.player.name ? stat.player.name.charAt(0).toUpperCase() : '?'}
                        </span>
                      </div>
                    )}
                    
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {stat.player.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {stat.team.short_name || stat.team.name}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">
                    {stat.goals} gols
                  </div>
                  <div className="text-xs text-gray-500">
                    {stat.goals_per_match.toFixed(2)} por jogo
                  </div>
                </div>
              </div>
              
              {/* Barra de progresso */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-500' :
                    'bg-blue-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Estatísticas resumidas */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-gray-900">
              {topPlayers.reduce((sum, stat) => sum + stat.goals, 0)}
            </div>
            <div className="text-xs text-gray-500">Total de Gols</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">
              {(topPlayers.reduce((sum, stat) => sum + stat.goals_per_match, 0) / topPlayers.length).toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">Média por Jogo</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">
              {topPlayers.reduce((sum, stat) => sum + stat.matches_played, 0)}
            </div>
            <div className="text-xs text-gray-500">Total de Jogos</div>
          </div>
        </div>
      </div>
    </div>
  )
} 