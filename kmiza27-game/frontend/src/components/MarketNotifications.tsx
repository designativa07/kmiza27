import React, { useState, useEffect } from 'react';
import { FaBell, FaTimes, FaCheck, FaDollarSign, FaUserTie, FaShoppingCart } from 'react-icons/fa';
import { gameApiReformed } from '@/services/gameApiReformed';
import { useGameStore } from '@/store/gameStore';

interface MarketNotification {
  id: string;
  type: 'offer_received' | 'offer_accepted' | 'offer_rejected' | 'player_sold' | 'player_bought';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

const MarketNotifications = () => {
  const [notifications, setNotifications] = useState<MarketNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { selectedTeam } = useGameStore();

  const fetchNotifications = async () => {
    if (!selectedTeam?.id) {
      console.log('❌ MarketNotifications: selectedTeam.id não encontrado');
      return;
    }

    try {
      console.log('🔍 MarketNotifications: Buscando notificações para time:', selectedTeam.id);
      setLoading(true);
      const data = await gameApiReformed.getTeamNotifications(selectedTeam.id);
      console.log('✅ MarketNotifications: Dados recebidos:', data);
      setNotifications(data || []);
    } catch (error) {
      console.error('❌ MarketNotifications: Erro ao buscar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await gameApiReformed.markNotificationAsRead(notificationId);
      // Atualizar estado local
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!selectedTeam?.id) return;

    try {
      await gameApiReformed.markAllNotificationsAsRead(selectedTeam.id);
      // Atualizar estado local
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'offer_received':
        return <FaBell className="text-green-400" />;
      case 'offer_accepted':
        return <FaCheck className="text-blue-400" />;
      case 'offer_rejected':
        return <FaTimes className="text-red-400" />;
      case 'player_sold':
        return <FaDollarSign className="text-green-400" />;
      case 'player_bought':
        return <FaShoppingCart className="text-blue-400" />;
      default:
        return <FaBell className="text-gray-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'offer_received':
        return 'border-l-green-500 bg-green-50';
      case 'offer_accepted':
        return 'border-l-blue-500 bg-blue-50';
      case 'offer_rejected':
        return 'border-l-red-500 bg-red-50';
      case 'player_sold':
        return 'border-l-green-500 bg-green-50';
      case 'player_bought':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, selectedTeam]);

  // Buscar notificações automaticamente quando o componente é montado e quando o time muda
  useEffect(() => {
    console.log('🔄 MarketNotifications: useEffect executado, selectedTeam:', selectedTeam);
    if (selectedTeam?.id) {
      console.log('✅ MarketNotifications: Time válido, buscando notificações...');
      fetchNotifications();
    } else {
      console.log('⚠️ MarketNotifications: Time inválido ou não encontrado');
    }
  }, [selectedTeam?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!selectedTeam) {
    return null;
  }

  return (
    <div className="relative">
      {/* Botão de Notificações */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
        title="Notificações do Mercado"
      >
        <FaBell className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de Notificações */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Notificações do Mercado
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                title="Fechar"
              >
                <FaTimes />
              </button>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="p-2">
            {loading ? (
              <div className="text-center py-4">
                <p className="text-gray-500">Carregando notificações...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <FaBell className="text-4xl text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border-l-4 ${getNotificationColor(notification.type)} ${
                      !notification.read ? 'ring-2 ring-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Marcar como lida
                            </button>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketNotifications;
