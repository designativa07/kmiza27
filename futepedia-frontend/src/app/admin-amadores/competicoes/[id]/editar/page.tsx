'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { HeaderWithLogo } from '@/components/HeaderWithLogo';
import { useAuth } from '@/hooks/useAuth';
import ImageUpload from '@/components/ImageUpload';

interface Competition {
  id: number;
  name: string;
  slug: string;
  country: string;
  season: string;
  type: string;
  is_active: boolean;
  rules: any;
  regulamento: string | null;
  logo_url: string | null;
}

export default function EditarCompeticaoPage() {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    country: 'Brasil',
    season: '',
    type: 'pontos_corridos',
    is_active: true,
    rules: {},
    regulamento: '',
    logo_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { requireAuth } = useAuth();
  const router = useRouter();
  const params = useParams();
  const competitionId = params.id;

  // Verificar autenticação
  if (!requireAuth()) return null;

  useEffect(() => {
    if (competitionId) {
      fetchCompetition();
    }
  }, [competitionId]);

  const fetchCompetition = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/amateur/competitions/${competitionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const competition: Competition = await response.json();
        setFormData({
          name: competition.name,
          slug: competition.slug,
          country: competition.country,
          season: competition.season,
          type: competition.type,
          is_active: competition.is_active,
          rules: competition.rules || {},
          regulamento: competition.regulamento || '',
          logo_url: competition.logo_url || ''
        });
      } else {
        setError('Erro ao carregar competição');
      }
    } catch (error) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/amateur/competitions/${competitionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess('Competição atualizada com sucesso!');
        setTimeout(() => {
          router.push('/admin-amadores/competicoes');
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erro ao atualizar competição');
      }
    } catch (error) {
      setError('Erro de conexão');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <HeaderWithLogo />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Carregando competição...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <HeaderWithLogo />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Link 
              href="/admin-amadores/competicoes"
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span>Voltar</span>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Editar Competição</h1>
              <p className="text-gray-600 mt-2">
                Atualize os dados da competição amadora
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Competição *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ex: Campeonato Municipal"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                Slug (URL) *
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ex: campeonato-municipal"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL amigável para a competição (será usado em links)
              </p>
            </div>

            <div>
              <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700 mb-2">
                URL da Imagem/Logo
              </label>
              <input
                type="url"
                id="logo_url"
                name="logo_url"
                value={formData.logo_url || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="https://exemplo.com/logo.png"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL da imagem ou logo da competição
              </p>
            </div>

            <ImageUpload
              currentImageUrl={formData.logo_url}
              onImageUpload={(imageUrl) => {
                console.log('ImageUpload callback called with URL:', imageUrl);
                setFormData(prev => {
                  console.log('Previous formData:', prev);
                  const newFormData = { ...prev, logo_url: imageUrl };
                  console.log('New formData:', newFormData);
                  return newFormData;
                });
              }}
              onImageRemove={() => {
                console.log('ImageUpload remove callback called');
                setFormData(prev => ({ ...prev, logo_url: '' }));
              }}
              folder="logo-competition"
              entityName={formData.name || 'competition'}
              label="Logo da Competição"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                  País
                </label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Brasil">Brasil</option>
                  <option value="Argentina">Argentina</option>
                  <option value="Uruguai">Uruguai</option>
                  <option value="Paraguai">Paraguai</option>
                  <option value="Chile">Chile</option>
                  <option value="Colômbia">Colômbia</option>
                  <option value="Peru">Peru</option>
                  <option value="Equador">Equador</option>
                  <option value="Bolívia">Bolívia</option>
                  <option value="Venezuela">Venezuela</option>
                </select>
              </div>

              <div>
                <label htmlFor="season" className="block text-sm font-medium text-gray-700 mb-2">
                  Temporada
                </label>
                <input
                  type="text"
                  id="season"
                  name="season"
                  value={formData.season}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: 2024"
                />
              </div>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Competição
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="pontos_corridos">Pontos Corridos</option>
                <option value="mata_mata">Mata Mata</option>
                <option value="grupos_e_mata_mata">Grupos e Mata Mata</option>
                <option value="copa">Copa</option>
                <option value="serie">Série</option>
              </select>
            </div>

            <div>
              <label htmlFor="regulamento" className="block text-sm font-medium text-gray-700 mb-2">
                Regulamento
              </label>
              <textarea
                id="regulamento"
                name="regulamento"
                value={formData.regulamento}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Descreva o regulamento da competição..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Competição ativa
              </label>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href="/admin-amadores/competicoes"
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 