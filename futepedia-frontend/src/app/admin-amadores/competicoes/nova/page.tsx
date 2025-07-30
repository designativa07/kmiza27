'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ImageUpload from '@/components/ImageUpload';

export default function NovaCompeticaoPage() {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    country: 'Brasil',
    type: 'pontos_corridos',
    season: '2024',
    is_active: true,
    logo_url: '',
    regulamento: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { requireAuth } = useAuth();
  const router = useRouter();

  // Verificar autenticação
  if (!requireAuth()) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Auto-gerar slug baseado no nome
    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Token de autenticação não encontrado. Faça login novamente.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/amateur/competitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          country: formData.country,
          type: formData.type,
          season: formData.season,
          is_active: formData.is_active,
          logo_url: formData.logo_url || null,
          regulamento: formData.regulamento || null
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuccess('Competição criada com sucesso!');
        setTimeout(() => {
          router.push('/admin-amadores/competicoes');
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erro ao criar competição');
      }
    } catch (error) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <h1 className="text-3xl font-bold text-gray-900">Nova Competição</h1>
            <p className="text-gray-600 mt-2">
              Crie uma nova competição amadora
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
              placeholder="campeonato-amador-cidade"
            />
            <p className="text-xs text-gray-500 mt-1">
              URL amigável para a competição (será usado em links)
            </p>
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              placeholder="Regulamento da competição..."
            />
          </div>

          <ImageUpload
            currentImageUrl={formData.logo_url}
            onImageUpload={(imageUrl) => setFormData(prev => ({ ...prev, logo_url: imageUrl }))}
            onImageRemove={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
            folder="logo-competition"
            entityName={formData.name || 'competition'}
            label="Logo da Competição"
          />

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
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Criando...' : 'Criar Competição'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 