'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Shield, 
  Users, 
  Calendar, 
  Trophy, 
  Settings, 
  Plus,
  ArrowRight,
  User,
  LogOut
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminAmadoresPage() {
  const router = useRouter();

  const handleLogout = () => {
    // Limpar dados de autenticação
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirecionar para a página inicial
    router.push('/');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Painel do Amador</h1>
            <p className="mt-2 text-gray-600">Bem-vindo, amador! Gerencie suas competições amadoras.</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
        <p className="text-gray-600 mb-4">Crie e gerencie rapidamente</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin-amadores/competicoes"
            className="flex items-center justify-center p-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-6 w-6 mr-2" />
            <span className="font-medium">Nova Competição</span>
          </Link>
          <Link
            href="/admin-amadores/times"
            className="flex items-center justify-center p-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-6 w-6 mr-2" />
            <span className="font-medium">Novo Time</span>
          </Link>
          <Link
            href="/admin-amadores/jogos"
            className="flex items-center justify-center p-6 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="h-6 w-6 mr-2" />
            <span className="font-medium">Novo Jogo</span>
          </Link>
        </div>
      </div>

      {/* Management Sections */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Gerenciamento</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/admin-amadores/competicoes"
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-gray-900">Minhas Competições</h3>
                  <p className="text-sm text-gray-600">Gerencie suas competições amadoras</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
          </Link>

          <Link
            href="/admin-amadores/times"
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-gray-900">Meus Times</h3>
                  <p className="text-sm text-gray-600">Administre seus times amadores</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
          </Link>

          <Link
            href="/admin-amadores/jogadores"
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-gray-900">Meus Jogadores</h3>
                  <p className="text-sm text-gray-600">Gerencie jogadores dos seus times</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
          </Link>

          <Link
            href="/admin-amadores/jogos"
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-gray-900">Meus Jogos</h3>
                  <p className="text-sm text-gray-600">Administre partidas e resultados</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
          </Link>

          <Link
            href="/admin-amadores/estadios"
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Settings className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-gray-900">Meus Estádios</h3>
                  <p className="text-sm text-gray-600">Gerencie locais de jogo</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
          </Link>

          <Link
            href="/admin-amadores/conta"
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <User className="h-8 w-8 text-gray-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-gray-900">Minha Conta</h3>
                  <p className="text-sm text-gray-600">Configurações do perfil</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
} 