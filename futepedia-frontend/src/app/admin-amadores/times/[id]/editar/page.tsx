'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { HeaderWithLogo } from '@/components/HeaderWithLogo';
import { useAuth } from '@/hooks/useAuth';
import ImageUpload from '@/components/ImageUpload';

interface Team {
  id: number;
  name: string;
  slug: string;
  full_name: string;
  short_name: string;
  short_code: string;
  logo_url: string | null;
  country: string;
  state: string;
  city: string;
  founded_year: number | null;
  information: string | null;
  colors: any;
  social_media: any;
  history: string | null;
  stadium_id: number | null;
}

const estados = [
  'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal',
  'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul',
  'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí',
  'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
  'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
];

export default function EditarTimePage() {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    full_name: '',
    short_name: '',
    short_code: '',
    logo_url: '',
    country: 'Brasil',
    state: '',
    city: '',
    founded_year: '',
    information: '',
    colors: {},
    social_media: {},
    history: '',
    stadium_id: null as number | null
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { requireAuth } = useAuth();
  const router = useRouter();
  const params = useParams();
  const teamId = params.id;

  // Verificar autenticação
  if (!requireAuth()) return null;

  useEffect(() => {
    if (teamId) {
      fetchTeam();
    }
  }, [teamId]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/amateur/teams/${teamId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const team: Team = await response.json();
        console.log('Team data fetched:', team);
        const newFormData = {
          name: team.name,
          slug: team.slug,
          full_name: team.full_name,
          short_name: team.short_name,
          short_code: team.short_code,
          logo_url: team.logo_url || '',
          country: team.country,
          state: team.state,
          city: team.city,
          founded_year: team.founded_year?.toString() || '',
          information: team.information || '',
          colors: team.colors || {},
          social_media: team.social_media || {},
          history: team.history || '',
          stadium_id: team.stadium_id
        };
        console.log('Setting formData:', newFormData);
        setFormData(newFormData);
      } else {
        setError('Erro ao carregar dados do time');
      }
    } catch (error) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log('handleChange called:', { name, value });
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      console.log('FormData updated:', newData);
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Preparar dados para envio, tratando campos vazios
      const submitData = {
        ...formData,
        founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
        stadium_id: formData.stadium_id || null,
        colors: formData.colors || {},
        social_media: formData.social_media || {},
        information: formData.information || null,
        history: formData.history || null,
        logo_url: formData.logo_url || null
      };

      console.log('Submitting data:', submitData);

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/amateur/teams/${teamId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        setSuccess('Time atualizado com sucesso!');
        setTimeout(() => {
          router.push('/admin-amadores/times');
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erro ao atualizar time');
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
            <span className="ml-2 text-gray-600">Carregando time...</span>
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
              href="/admin-amadores/times"
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span>Voltar</span>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Editar Time</h1>
              <p className="text-gray-600 mt-2">
                Atualize os dados do time amador
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
                Nome do Time *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ex: Time Amador"
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
                placeholder="Ex: time-amador"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL amigável para o time (será usado em links)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: Time Amador da Cidade"
                />
              </div>

              <div>
                <label htmlFor="short_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Curto
                </label>
                <input
                  type="text"
                  id="short_name"
                  name="short_name"
                  value={formData.short_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: Time Amador"
                />
              </div>

              <div>
                <label htmlFor="short_code" className="block text-sm font-medium text-gray-700 mb-2">
                  Código
                </label>
                <input
                  type="text"
                  id="short_code"
                  name="short_code"
                  value={formData.short_code}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: TA"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: São Paulo"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Selecione...</option>
                  {estados.map(estado => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="founded_year" className="block text-sm font-medium text-gray-700 mb-2">
                  Ano de Fundação
                </label>
                <input
                  type="number"
                  id="founded_year"
                  name="founded_year"
                  value={formData.founded_year}
                  onChange={handleChange}
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: 2020"
                />
              </div>
            </div>

            <div>
              <label htmlFor="information" className="block text-sm font-medium text-gray-700 mb-2">
                Informações
              </label>
              <textarea
                id="information"
                name="information"
                value={formData.information}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Descreva o time..."
              />
            </div>

            <div>
              <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700 mb-2">
                URL do Logo/Escudo
              </label>
              <input
                type="url"
                id="logo_url"
                name="logo_url"
                value={formData.logo_url}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="https://exemplo.com/escudo.png"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL do escudo ou logo do time
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
              folder="escudos"
              entityName={formData.name || 'team'}
              label="Escudo do Time"
            />

            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href="/admin-amadores/times"
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