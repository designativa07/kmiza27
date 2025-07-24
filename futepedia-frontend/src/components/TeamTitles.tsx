'use client';

import { useState, useEffect } from 'react';
import { TrophyIcon } from '@heroicons/react/24/outline';
import { getApiUrl } from '@/lib/config';

interface Title {
  id: number;
  name: string;
  competition_name?: string;
  season?: string;
  year?: number;
  description?: string;
  category?: string;
  type?: string;
  image_url?: string;
}

interface TeamTitlesProps {
  teamId: number;
}

export default function TeamTitles({ teamId }: TeamTitlesProps) {
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTitles();
  }, [teamId]);

  const fetchTitles = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/titles/team/${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setTitles(data);
      }
    } catch (error) {
      console.error('Erro ao buscar títulos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (titles.length === 0) {
    return (
      <div className="text-center py-8">
        <TrophyIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum título registrado</h3>
        <p className="text-sm text-gray-500">
          Este time ainda não possui títulos registrados no sistema.
        </p>
      </div>
    );
  }

  // Agrupar títulos por categoria
  const groupedTitles = titles.reduce((acc, title) => {
    const category = title.category || 'Outros';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(title);
    return acc;
  }, {} as Record<string, Title[]>);

  // Ordenar categorias (Nacional primeiro, depois Internacional, etc.)
  const categoryOrder = ['Nacional', 'Internacional', 'Estadual', 'Regional', 'Outros'];
  const sortedCategories = Object.keys(groupedTitles).sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a);
    const bIndex = categoryOrder.indexOf(b);
    return aIndex - bIndex;
  });

  return (
    <div className="space-y-6">
      {sortedCategories.map((category) => (
        <div key={category} className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <TrophyIcon className="h-5 w-5 mr-2 text-yellow-500" />
            {category}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedTitles[category]
              .sort((a, b) => (b.year || 0) - (a.year || 0))
              .map((title) => (
                <div
                  key={title.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-3">
                    {/* Imagem do troféu à esquerda */}
                    {title.image_url && (
                      <div className="flex-shrink-0">
                        <img
                          src={title.image_url}
                          alt={`Troféu ${title.name}`}
                          className="h-25 w-16 object-contain rounded-lg border border-gray-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Conteúdo do título à direita */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm md:text-base">
                            {title.name}
                          </h4>
                          {title.competition_name && (
                            <p className="text-sm text-gray-600 mt-1">
                              {title.competition_name}
                            </p>
                          )}
                        </div>
                        {title.year && (
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full ml-2 flex-shrink-0">
                            {title.year}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        {title.type && (
                          <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded">
                            {title.type}
                          </span>
                        )}
                        {title.season && (
                          <span>{title.season}</span>
                        )}
                      </div>
                      
                      {title.description && (
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                          {title.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
      
      <div className="text-center pt-4">
        <p className="text-sm text-gray-500">
          Total de {titles.length} título{titles.length !== 1 ? 's' : ''} conquistado{titles.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
} 