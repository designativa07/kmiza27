'use client';

import { useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import { User } from '@/types/auth';
import AdminLayout from '@/components/layout/AdminLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  TrashIcon,
  StarIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterAdmin, setFilterAdmin] = useState<'all' | 'admin' | 'user'>('all');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterActive, filterAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const usersData = await authService.getAllUsers();
      setUsers(usersData);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      setError('Erro ao carregar usuários. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone_number?.includes(searchTerm)
      );
    }

    // Filtro por status ativo
    if (filterActive !== 'all') {
      filtered = filtered.filter(user => 
        filterActive === 'active' ? user.is_active : !user.is_active
      );
    }

    // Filtro por admin
    if (filterAdmin !== 'all') {
      filtered = filtered.filter(user => 
        filterAdmin === 'admin' ? user.is_admin : !user.is_admin
      );
    }

    setFilteredUsers(filtered);
  };

  const handlePromoteUser = async (userId: number) => {
    if (!confirm('Tem certeza que deseja promover este usuário a administrador?')) return;

    try {
      const result = await authService.promoteToAdmin(userId);
      if (result.success) {
        await loadUsers();
        alert('Usuário promovido a administrador com sucesso!');
      } else {
        alert(result.message || 'Erro ao promover usuário');
      }
    } catch (error) {
      console.error('Erro ao promover usuário:', error);
      alert('Erro ao promover usuário. Tente novamente.');
    }
  };

  const handleDemoteUser = async (userId: number) => {
    if (!confirm('Tem certeza que deseja remover privilégios de administrador deste usuário?')) return;

    try {
      const result = await authService.demoteFromAdmin(userId);
      if (result.success) {
        await loadUsers();
        alert('Privilégios de administrador removidos com sucesso!');
      } else {
        alert(result.message || 'Erro ao remover privilégios');
      }
    } catch (error) {
      console.error('Erro ao rebaixar usuário:', error);
      alert('Erro ao rebaixar usuário. Tente novamente.');
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${userName}"? Esta ação não pode ser desfeita.`)) return;

    try {
      const result = await authService.deleteUser(userId);
      if (result.success) {
        await loadUsers();
        alert('Usuário excluído com sucesso!');
      } else {
        alert(result.message || 'Erro ao excluir usuário');
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      alert('Erro ao excluir usuário. Tente novamente.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
            <p className="text-gray-600 mt-1">Visualizar e gerenciar todos os usuários do sistema</p>
          </div>
          <LoadingSpinner text="Carregando usuários..." />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
            <p className="text-gray-600 mt-1">Visualizar e gerenciar todos os usuários do sistema</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
            <button 
              onClick={loadUsers}
              className="mt-2 text-red-600 hover:text-red-800 font-medium"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
          <p className="text-gray-600 mt-1">
            Total: {users.length} usuários | Exibindo: {filteredUsers.length}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, usuário, email..."
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Active */}
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os status</option>
              <option value="active">Apenas ativos</option>
              <option value="inactive">Apenas inativos</option>
            </select>

            {/* Filter Admin */}
            <select
              value={filterAdmin}
              onChange={(e) => setFilterAdmin(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os tipos</option>
              <option value="admin">Apenas admins</option>
              <option value="user">Apenas usuários</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Favorito
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criado em
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {(user.name || user.username).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || user.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {user.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <EnvelopeIcon className="h-4 w-4 mr-1" />
                            {user.email}
                          </div>
                        )}
                        {user.phone_number && (
                          <div className="flex items-center text-sm text-gray-600">
                            <PhoneIcon className="h-4 w-4 mr-1" />
                            {user.phone_number}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.favorite_team ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {user.favorite_team.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Nenhum</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                        {user.is_admin && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {!user.is_admin ? (
                          <button
                            onClick={() => handlePromoteUser(user.id)}
                            className="text-orange-600 hover:text-orange-800 flex items-center"
                            title="Promover a Admin"
                          >
                            <StarIcon className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDemoteUser(user.id)}
                            className="text-gray-600 hover:text-gray-800 flex items-center"
                            title="Remover Admin"
                          >
                            <UserIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name || user.username)}
                          className="text-red-600 hover:text-red-800 flex items-center"
                          title="Excluir Usuário"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum usuário encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                Tente ajustar os filtros de busca.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
} 