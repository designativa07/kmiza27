'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Phone, Calendar, Heart, Edit, Save, X, Shield } from 'lucide-react';

interface Team {
  id: number;
  name: string;
  slug: string;
  logo_url?: string;
}

interface UserProfile {
  id: number;
  name: string;
  email?: string;
  phone_number?: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  favorite_team?: Team;
}

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  useEffect(() => {
    if (user) {
      loadProfile();
      loadTeams();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // Usar dados do contexto de autenticação
      if (user) {
        setProfile({
          id: user.id,
          name: user.name,
          email: user.email,
          phone_number: user.phone_number,
          is_admin: user.is_admin,
          is_active: user.is_active,
          created_at: user.created_at,
          favorite_team: user.favorite_team
        });
        setFormData({
          name: user.name,
          email: user.email || ''
        });
      }
    } catch (error) {
      setError('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      const response = await fetch('/api/teams', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      console.error('Erro ao carregar times:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setError('');
      setSuccess('');
      
      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess('Perfil atualizado com sucesso!');
        setIsEditing(false);
        loadProfile();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erro ao atualizar perfil');
      }
    } catch (error) {
      setError('Erro de conexão');
    }
  };

  const handleSaveFavoriteTeam = async () => {
    try {
      setError('');
      setSuccess('');
      
      const response = await fetch(`/api/users/phone/${user?.phone_number}/favorite-team`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ teamSlug: selectedTeam })
      });

      if (response.ok) {
        setSuccess('Time favorito atualizado com sucesso!');
        setIsEditingTeam(false);
        loadProfile();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erro ao atualizar time favorito');
      }
    } catch (error) {
      setError('Erro de conexão');
    }
  };

  const handleRemoveFavoriteTeam = async () => {
    try {
      setError('');
      setSuccess('');
      
      const response = await fetch(`/api/users/phone/${user?.phone_number}/favorite-team`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess('Time favorito removido com sucesso!');
        loadProfile();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erro ao remover time favorito');
      }
    } catch (error) {
      setError('Erro de conexão');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="mt-2 text-gray-600">Gerencie suas informações pessoais e preferências</p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {profile && (
        <div className="space-y-6">
          {/* Profile Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Informações do Perfil</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                  {isEditing ? <X className="h-4 w-4 mr-1" /> : <Edit className="h-4 w-4 mr-1" />}
                  {isEditing ? 'Cancelar' : 'Editar'}
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Profile Header */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{profile.name}</h3>
                  <p className="text-gray-600">{profile.email}</p>
                  {profile.is_admin && (
                    <div className="flex items-center mt-1">
                      <Shield className="h-4 w-4 text-yellow-600 mr-1" />
                      <span className="text-sm text-yellow-600 font-medium">Administrador</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Digite seu nome"
                      aria-label="Nome do usuário"
                    />
                  ) : (
                    <div className="flex items-center text-gray-900">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      {profile.name}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Digite seu email"
                      aria-label="Email do usuário"
                    />
                  ) : (
                    <div className="flex items-center text-gray-900">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {profile.email || 'Não informado'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                  <div className="flex items-center text-gray-900">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    {profile.phone_number || 'Não informado'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Membro desde</label>
                  <div className="flex items-center text-gray-900">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              {isEditing && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Favorite Team */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Time Favorito</h2>
                <button
                  onClick={() => setIsEditingTeam(!isEditingTeam)}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                  {isEditingTeam ? <X className="h-4 w-4 mr-1" /> : <Edit className="h-4 w-4 mr-1" />}
                  {isEditingTeam ? 'Cancelar' : 'Alterar'}
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {profile.favorite_team ? (
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    {profile.favorite_team.logo_url ? (
                      <img 
                        src={profile.favorite_team.logo_url} 
                        alt={profile.favorite_team.name}
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <Heart className="h-6 w-6 text-red-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{profile.favorite_team.name}</h3>
                    <p className="text-gray-600">Seu time do coração</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum time favorito definido</p>
                </div>
              )}

              {isEditingTeam && (
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selecione seu time favorito
                    </label>
                    <select
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Selecione seu time favorito"
                    >
                      <option value="">Escolha um time...</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.slug}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleSaveFavoriteTeam}
                      disabled={!selectedTeam}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Time
                    </button>
                    
                    {profile.favorite_team && (
                      <button
                        onClick={handleRemoveFavoriteTeam}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remover Time
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* WhatsApp Integration Info */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Integração com WhatsApp</h3>
            <p className="text-blue-700 mb-4">
              Use o WhatsApp para definir seu time favorito e receber resumos personalizados automaticamente!
            </p>
            <div className="space-y-2 text-sm text-blue-600">
              <p>• Digite "menu" no WhatsApp para ver as opções</p>
              <p>• Selecione "❤️ Definir Time Favorito"</p>
              <p>• Escolha seu time e receba resumos personalizados</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 