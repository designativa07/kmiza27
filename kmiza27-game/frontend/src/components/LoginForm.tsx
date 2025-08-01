'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';

export default function LoginForm() {
  const { setUserId } = useGameStore();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    displayName: '',
    password: '',
    confirmPassword: ''
  });

  // Limpar dados antigos e validar usuário atual
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const gameUser = localStorage.getItem('gameUser');
      if (gameUser) {
        try {
          const user = JSON.parse(gameUser);
          // Verificar se o ID é um UUID válido
          if (!user.id || !user.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            console.log('Removendo dados de usuário inválidos');
            localStorage.removeItem('gameUser');
            localStorage.removeItem('gameUsers');
          }
        } catch (error) {
          console.log('Erro ao validar dados do usuário, limpando localStorage');
          localStorage.removeItem('gameUser');
          localStorage.removeItem('gameUsers');
        }
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!isLogin && formData.password !== formData.confirmPassword) {
        alert('As senhas não coincidem!');
        return;
      }

      if (!isLogin && formData.password.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres!');
        return;
      }

      if (isLogin) {
        // Modo LOGIN - verificar se usuário existe
        const existingUsers = JSON.parse(localStorage.getItem('gameUsers') || '[]');
        const user = existingUsers.find((u: any) => 
          u.email === formData.email && u.password === formData.password
        );

        if (!user) {
          alert('Email ou senha incorretos!');
          return;
        }

        // Verificar se o ID do usuário é um UUID válido
        if (!user.id || !user.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          alert('Dados de usuário inválidos. Por favor, registre-se novamente.');
          localStorage.removeItem('gameUser');
          localStorage.removeItem('gameUsers');
          return;
        }

        // Login bem-sucedido
        setUserId(user.id);
        localStorage.setItem('gameUser', JSON.stringify(user));
        
        // Limpar formulário
        setFormData({
          email: '',
          username: '',
          displayName: '',
          password: '',
          confirmPassword: ''
        });
        
      } else {
        // Modo REGISTRO - verificar se email já existe
        const existingUsers = JSON.parse(localStorage.getItem('gameUsers') || '[]');
        const existingUser = existingUsers.find((u: any) => u.email === formData.email);

        if (existingUser) {
          alert('Este email já está cadastrado!');
          return;
        }

        // Criar novo usuário com UUID válido
        const userId = crypto.randomUUID();
        const newUser = {
          id: userId,
          email: formData.email,
          username: formData.username,
          displayName: formData.displayName,
          password: formData.password, // Em produção, isso seria hasheado
          createdAt: new Date().toISOString()
        };

        // Salvar no array de usuários
        existingUsers.push(newUser);
        localStorage.setItem('gameUsers', JSON.stringify(existingUsers));
        
        // Fazer login automaticamente
        setUserId(userId);
        localStorage.setItem('gameUser', JSON.stringify(newUser));
        
        // Limpar formulário
        setFormData({
          email: '',
          username: '',
          displayName: '',
          password: '',
          confirmPassword: ''
        });
      }
      
    } catch (error) {
      console.error('Error in login:', error);
      alert('Erro ao processar login/registro. Tente novamente.');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      username: '',
      displayName: '',
      password: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        🎮 {isLogin ? 'Entrar no Jogo' : 'Criar Conta'}
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome de Exibição *
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
              placeholder="Seu nome no jogo"
              required={!isLogin}
            />
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
            placeholder="seu@email.com"
            required
          />
        </div>
        
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome de Usuário *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
              placeholder="nome_usuario"
              required={!isLogin}
            />
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Senha *
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
            placeholder={isLogin ? "Sua senha" : "Mínimo 6 caracteres"}
            required
          />
        </div>
        
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Senha *
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
              placeholder="Confirme sua senha"
              required={!isLogin}
            />
          </div>
        )}
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          {isLogin ? 'Entrar' : 'Criar Conta'}
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <button
          onClick={toggleMode}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {isLogin ? 'Não tem conta? Criar conta' : 'Já tem conta? Fazer login'}
        </button>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          {isLogin 
            ? 'Entre com seu email e senha para continuar sua jornada!'
            : 'Crie sua conta para começar sua jornada no futebol!'
          }
        </p>
      </div>
    </div>
  );
} 