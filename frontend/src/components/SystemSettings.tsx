'use client'

import { useState, useEffect } from 'react'
import { 
  Cog6ToothIcon as CogIcon, 
  BellIcon, 
  ShieldCheckIcon, 
  ClockIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { 
  Image as ImageIcon,
  CheckCircle,
  TestTube
} from 'lucide-react'
import { apiUrl } from '@/config/api'

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    // Configurações do Chatbot
    chatbot: {
      autoResponse: true,
      responseDelay: 1000,
      maxMessagesPerMinute: 10,
      enableTypingIndicator: true,
      defaultLanguage: 'pt-BR'
    },
    // Configurações de Notificações
    notifications: {
      enablePushNotifications: true,
      enableEmailNotifications: false,
      notificationSound: true,
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00'
      }
    },
    // Configurações de Segurança
    security: {
      enableTwoFactor: false,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      enableAuditLog: true
    },
    // Configurações de Sistema
    system: {
      enableMaintenance: false,
      enableDebugMode: false,
      logLevel: 'info',
      backupFrequency: 'daily'
    }
  })

  // Estados para Evolution API e imagens
  const [evolutionSettings, setEvolutionSettings] = useState({
    apiUrl: '',
    apiKey: '',
    instanceName: '',
    enabled: true,
  });
  const [futepediaImageSettings, setFutepediaImageSettings] = useState({
    ogImageUrl: null,
    headerLogoUrl: null,
  });

  const [ogImageFile, setOgImageFile] = useState<File | null>(null);
  const [futepediaLogoFile, setFutepediaLogoFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [evolutionLoading, setEvolutionLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [evolutionMessage, setEvolutionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Carregar configurações ao inicializar
  useEffect(() => {
    const loadConfigurations = async () => {
      try {
        // Carregar configurações da Evolution API
        const evolutionResponse = await fetch(apiUrl('system-settings/evolution-api'));
        if (evolutionResponse.ok) {
          const evolutionData = await evolutionResponse.json();
          setEvolutionSettings(evolutionData);
        }

        // Carregar configurações de imagens da Futepédia
        const futepediaResponse = await fetch(apiUrl('system-settings/futepedia-images'));
        if (futepediaResponse.ok) {
          const futepediaData = await futepediaResponse.json();
          console.log('🖼️ Dados carregados da API:', futepediaData);
          console.log('🔍 Estado que será definido:', {
            ogImageUrl: futepediaData.ogImageUrl || null,
            headerLogoUrl: futepediaData.headerLogoUrl || futepediaData.futepediaLogoUrl || null,
          });
          // Garantir que os campos estejam corretos
          setFutepediaImageSettings({
            ogImageUrl: futepediaData.ogImageUrl || null,
            headerLogoUrl: futepediaData.headerLogoUrl || futepediaData.futepediaLogoUrl || null,
          });
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadConfigurations();
  }, []);

  const handleSettingChange = (category: string, setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value
      }
    }))
  }

  const handleNestedSettingChange = (category: string, nested: string, setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [nested]: {
          ...(prev[category as keyof typeof prev] as any)[nested],
          [setting]: value
        }
      }
    }))
  }

  const saveSettings = async () => {
    try {
      console.log('Salvando configurações:', settings)
      alert('Configurações salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      alert('Erro ao salvar configurações')
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setEvolutionSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOgImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setOgImageFile(event.target.files[0]);
    }
  };

  const handleFutepediaLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFutepediaLogoFile(event.target.files[0]);
    }
  };

  // Função para salvar configurações da Evolution API
  const saveEvolutionSettings = async () => {
    setEvolutionLoading(true);
    setEvolutionMessage(null);

    try {
      const response = await fetch(apiUrl('system-settings/evolution-api'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evolutionSettings),
      });

      if (response.ok) {
        setEvolutionMessage({ type: 'success', text: 'Configurações da Evolution API salvas com sucesso!' });
      } else {
        throw new Error('Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro ao salvar configurações da Evolution API:', error);
      setEvolutionMessage({ type: 'error', text: 'Erro ao salvar as configurações da Evolution API' });
    } finally {
      setEvolutionLoading(false);
    }
  };

  // Função para testar conexão com Evolution API
  const testEvolutionConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(apiUrl('system-settings/evolution-api/test'), {
        method: 'POST',
      });

      const result = await response.json();
      setTestResult(result);
      
      if (result.success) {
        setEvolutionMessage({ type: 'success', text: 'Conexão testada com sucesso!' });
      } else {
        setEvolutionMessage({ type: 'error', text: result.message || 'Erro ao testar conexão' });
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      setEvolutionMessage({ type: 'error', text: 'Erro ao testar conexão com a API' });
    } finally {
      setTesting(false);
    }
  };

  const saveFutepediaImages = async () => {
    setLoading(true);
    setMessage(null);

    try {
      let ogImageUrl = futepediaImageSettings.ogImageUrl;
      let futepediaLogoUrl = futepediaImageSettings.headerLogoUrl;

      console.log('🔍 Debug estado inicial:', {
        'estado ogImageUrl': futepediaImageSettings.ogImageUrl,
        'estado headerLogoUrl': futepediaImageSettings.headerLogoUrl,
        'variável ogImageUrl': ogImageUrl,
        'variável futepediaLogoUrl': futepediaLogoUrl
      });

      // Upload da OG Image se houver arquivo selecionado
      if (ogImageFile) {
        const ogFormData = new FormData();
        ogFormData.append('file', ogImageFile);
        ogFormData.append('folder', 'og-images');
        ogFormData.append('fileName', `og-image-${Date.now()}`);

        const ogResponse = await fetch(apiUrl('system-settings/upload-image'), {
          method: 'POST',
          body: ogFormData,
        });

        if (ogResponse.ok) {
          const ogResult = await ogResponse.json();
          ogImageUrl = ogResult.url;
        } else {
          throw new Error('Erro no upload da OG Image');
        }
      }

      // Upload da logo da Futepédia se houver arquivo selecionado
      if (futepediaLogoFile) {
        const logoFormData = new FormData();
        logoFormData.append('file', futepediaLogoFile);
        logoFormData.append('folder', 'futepedia-logos');
        logoFormData.append('fileName', `futepedia-logo-${Date.now()}`);

        const logoResponse = await fetch(apiUrl('system-settings/upload-image'), {
          method: 'POST',
          body: logoFormData,
        });

        if (logoResponse.ok) {
          const logoResult = await logoResponse.json();
          futepediaLogoUrl = logoResult.url;
        } else {
          throw new Error('Erro no upload da logo da Futepédia');
        }
      }

      console.log('🔍 Debug após uploads:', {
        'ogImageUrl final': ogImageUrl,
        'futepediaLogoUrl final': futepediaLogoUrl,
        'teve upload de OG?': !!ogImageFile,
        'teve upload de Logo?': !!futepediaLogoFile
      });

      // Salvar as configurações
      console.log('🔍 Debug antes de enviar:', {
        ogImageUrl,
        futepediaLogoUrl,
        'estado atual headerLogoUrl': futepediaImageSettings.headerLogoUrl,
        'será enviado headerLogoUrl': futepediaLogoUrl
      });

      const saveResponse = await fetch(apiUrl('system-settings/futepedia-images'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ogImageUrl: ogImageUrl || null,
          headerLogoUrl: futepediaLogoUrl || null,
        }),
      });

      if (saveResponse.ok) {
        console.log('✅ Imagens salvas com sucesso:', { ogImageUrl, futepediaLogoUrl });
        
        // Recarregar dados do servidor para garantir sincronização
        try {
          const reloadResponse = await fetch(apiUrl('system-settings/futepedia-images'));
          if (reloadResponse.ok) {
            const reloadedData = await reloadResponse.json();
            console.log('🔄 Dados recarregados do servidor:', reloadedData);
            setFutepediaImageSettings({
              ogImageUrl: reloadedData.ogImageUrl || null,
              headerLogoUrl: reloadedData.headerLogoUrl || null,
            });
          } else {
            // Fallback: usar dados locais se reload falhar
            setFutepediaImageSettings({
              ogImageUrl,
              headerLogoUrl: futepediaLogoUrl,
            });
          }
        } catch (reloadError) {
          console.error('⚠️ Erro ao recarregar dados, usando dados locais:', reloadError);
          setFutepediaImageSettings({
            ogImageUrl,
            headerLogoUrl: futepediaLogoUrl,
          });
        }

        // Limpar arquivos selecionados
        setOgImageFile(null);
        setFutepediaLogoFile(null);

        // Limpar os inputs de arquivo
        const ogInput = document.getElementById('ogImageFile') as HTMLInputElement;
        const logoInput = document.getElementById('futepediaLogoFile') as HTMLInputElement;
        if (ogInput) ogInput.value = '';
        if (logoInput) logoInput.value = '';

        setMessage({ type: 'success', text: 'Configurações de imagens salvas com sucesso!' });
      } else {
        throw new Error('Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro ao salvar imagens da Futepédia:', error);
      setMessage({ type: 'error', text: 'Erro ao salvar as configurações de imagens' });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Mensagem de status */}
      {message && (
        <div className={`rounded-md p-4 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {message.text}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Configurações do Sistema</h1>
          <p className="mt-2 text-sm text-gray-700">
            Configure o comportamento do chatbot, notificações, segurança e sistema.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            onClick={saveSettings}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Salvar Configurações
          </button>
        </div>
      </div>

      {/* Configurações da Evolution API */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <CogIcon className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Configurações da Evolution API</h3>
          </div>
        </div>
        <div className="px-6 py-4 space-y-4">
          {/* Mensagem específica para Evolution API */}
          {evolutionMessage && (
            <div className={`rounded-md p-4 ${
              evolutionMessage.type === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {evolutionMessage.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    evolutionMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {evolutionMessage.text}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="evolutionApiUrl" className="block text-sm font-medium text-gray-900">URL da API</label>
              <input
                id="evolutionApiUrl"
                type="url"
                placeholder="https://evolution.kmiza27.com"
                value={evolutionSettings.apiUrl}
                onChange={(e) => handleInputChange('apiUrl', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="evolutionInstanceName" className="block text-sm font-medium text-gray-900">Nome da Instância</label>
              <input
                id="evolutionInstanceName"
                type="text"
                placeholder="Kmiza27"
                value={evolutionSettings.instanceName}
                onChange={(e) => handleInputChange('instanceName', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="evolutionApiKey" className="block text-sm font-medium text-gray-900">API Key</label>
            <input
              id="evolutionApiKey"
              type="password"
              placeholder="Sua API Key da Evolution API"
              value={evolutionSettings.apiKey}
              onChange={(e) => handleInputChange('apiKey', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
            />
            <p className="text-sm text-gray-500">
              A API Key será mascarada por segurança após salvar
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="whatsappEnabled"
              type="checkbox"
              checked={evolutionSettings.enabled}
              onChange={(e) => handleInputChange('enabled', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="whatsappEnabled" className="text-sm font-medium text-gray-900">WhatsApp habilitado</label>
          </div>

          {/* Botões de ação para Evolution API */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={saveEvolutionSettings}
              disabled={evolutionLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {evolutionLoading ? 'Salvando...' : 'Salvar Configurações'}
            </button>
            
            <button
              onClick={testEvolutionConnection}
              disabled={testing}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <TestTube className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
              {testing ? 'Testando...' : 'Testar Conexão'}
            </button>
          </div>

          {/* Resultado do teste */}
          {testResult && (
            <div className={`mt-4 p-3 rounded-md ${
              testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <h4 className={`text-sm font-medium ${
                testResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                Resultado do Teste:
              </h4>
              <p className={`text-sm mt-1 ${
                testResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {testResult.message}
              </p>
              {testResult.details && (
                <pre className={`text-xs mt-2 p-2 rounded ${
                  testResult.success ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {JSON.stringify(testResult.details, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Configurações de Imagens da Futepédia */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <ImageIcon className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Configurações de Imagens da Futepédia</h3>
          </div>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="ogImageFile" className="block text-sm font-medium text-gray-900">Imagem Open Graph (OG Image)</label>
            <input
              id="ogImageFile"
              type="file"
              accept="image/*"
              onChange={handleOgImageFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {futepediaImageSettings.ogImageUrl && (
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-1">Pré-visualização:</p>
                <img src={futepediaImageSettings.ogImageUrl} alt="OG Image Preview" className="max-w-xs h-auto rounded-md border border-gray-200" />
                <p className="text-xs text-gray-500 mt-1 break-all">URL atual: {futepediaImageSettings.ogImageUrl}</p>
              </div>
            )}
            {ogImageFile && (
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-1">Nova imagem selecionada:</p>
                <img src={URL.createObjectURL(ogImageFile)} alt="Selected OG Image Preview" className="max-w-xs h-auto rounded-md border border-gray-200" />
                <p className="text-xs text-gray-500 mt-1">Nome do arquivo: {ogImageFile.name}</p>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Esta imagem será usada como pré-visualização ao compartilhar links da Futepédia.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="futepediaLogoFile" className="block text-sm font-medium text-gray-900">Logo do Cabeçalho da Futepédia</label>
            <input
              id="futepediaLogoFile"
              type="file"
              accept="image/*"
              onChange={handleFutepediaLogoFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {futepediaImageSettings.headerLogoUrl && (
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-1">Pré-visualização:</p>
                <img src={futepediaImageSettings.headerLogoUrl} alt="Futepedia Logo Preview" className="max-w-xs h-auto rounded-md border border-gray-200 bg-gray-100 p-2" />
                <p className="text-xs text-gray-500 mt-1 break-all">URL atual: {futepediaImageSettings.headerLogoUrl}</p>
              </div>
            )}
            {futepediaLogoFile && (
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-1">Nova logo selecionada:</p>
                <img src={URL.createObjectURL(futepediaLogoFile)} alt="Selected Futepedia Logo Preview" className="max-w-xs h-auto rounded-md border border-gray-200 bg-gray-100 p-2" />
                <p className="text-xs text-gray-500 mt-1">Nome do arquivo: {futepediaLogoFile.name}</p>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Esta imagem será exibida no cabeçalho da Futepédia.
            </p>
          </div>

          {/* Botão para salvar imagens */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={saveFutepediaImages}
              disabled={loading || (!ogImageFile && !futepediaLogoFile)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Imagens'}
            </button>
          </div>
        </div>
      </div>

      {/* Configurações de Notificações */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <BellIcon className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Configurações de Notificações</h3>
          </div>
        </div>
        <div className="px-6 py-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <label htmlFor="enablePushNotifications" className="text-sm font-medium text-gray-900">
                Notificações Push
                <p className="text-sm text-gray-700">Receber notificações no navegador</p>
              </label>
              <input
                id="enablePushNotifications"
                type="checkbox"
                checked={settings.notifications.enablePushNotifications}
                onChange={(e) => handleSettingChange('notifications', 'enablePushNotifications', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="notificationSound" className="text-sm font-medium text-gray-900">
                Som de Notificação
                <p className="text-sm text-gray-700">Reproduzir som ao receber notificações</p>
              </label>
              <input
                id="notificationSound"
                type="checkbox"
                checked={settings.notifications.notificationSound}
                onChange={(e) => handleSettingChange('notifications', 'notificationSound', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="quietHoursEnabled" className="text-sm font-medium text-gray-900">
                Horário Silencioso
                <p className="text-sm text-gray-700">Não enviar notificações em horários específicos</p>
              </label>
              <input
                id="quietHoursEnabled"
                type="checkbox"
                checked={settings.notifications.quietHours.enabled}
                onChange={(e) => handleNestedSettingChange('notifications', 'quietHours', 'enabled', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>
          </div>

          {settings.notifications.quietHours.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="quietHoursStart" className="block text-sm font-medium text-gray-900">Início</label>
                <div className="mt-1 relative">
                  <input
                    id="quietHoursStart"
                    type="time"
                    value={settings.notifications.quietHours.start}
                    onChange={(e) => handleNestedSettingChange('notifications', 'quietHours', 'start', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                  />
                  <ClockIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label htmlFor="quietHoursEnd" className="block text-sm font-medium text-gray-900">Fim</label>
                <div className="mt-1 relative">
                  <input
                    id="quietHoursEnd"
                    type="time"
                    value={settings.notifications.quietHours.end}
                    onChange={(e) => handleNestedSettingChange('notifications', 'quietHours', 'end', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
                  />
                  <ClockIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configurações de Segurança */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Configurações de Segurança</h3>
          </div>
        </div>
        <div className="px-6 py-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <label htmlFor="enableTwoFactor" className="text-sm font-medium text-gray-900">
                Autenticação de Dois Fatores
                <p className="text-sm text-gray-700">Adicionar camada extra de segurança</p>
              </label>
              <input
                id="enableTwoFactor"
                type="checkbox"
                checked={settings.security.enableTwoFactor}
                onChange={(e) => handleSettingChange('security', 'enableTwoFactor', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="enableAuditLog" className="text-sm font-medium text-gray-900">
                Log de Auditoria
                <p className="text-sm text-gray-700">Registrar todas as ações do sistema</p>
              </label>
              <input
                id="enableAuditLog"
                type="checkbox"
                checked={settings.security.enableAuditLog}
                onChange={(e) => handleSettingChange('security', 'enableAuditLog', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>

            <div>
              <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-900">Timeout de Sessão (min)</label>
              <input
                id="sessionTimeout"
                type="number"
                value={settings.security.sessionTimeout}
                onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
              />
            </div>

            <div>
              <label htmlFor="maxLoginAttempts" className="block text-sm font-medium text-gray-900">Máx. Tentativas de Login</label>
              <input
                id="maxLoginAttempts"
                type="number"
                value={settings.security.maxLoginAttempts}
                onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Configurações de Sistema */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <CogIcon className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Configurações de Sistema</h3>
          </div>
        </div>
        <div className="px-6 py-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <label htmlFor="enableMaintenance" className="text-sm font-medium text-gray-900">
                Modo de Manutenção
                <p className="text-sm text-gray-700">Desabilitar temporariamente o sistema</p>
              </label>
              <div className="flex items-center">
                {settings.system.enableMaintenance && (
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-2" />
                )}
                <input
                  id="enableMaintenance"
                  type="checkbox"
                  checked={settings.system.enableMaintenance}
                  onChange={(e) => handleSettingChange('system', 'enableMaintenance', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="enableDebugMode" className="text-sm font-medium text-gray-900">
                Modo Debug
                <p className="text-sm text-gray-700">Ativar logs detalhados para desenvolvimento</p>
              </label>
              <input
                id="enableDebugMode"
                type="checkbox"
                checked={settings.system.enableDebugMode}
                onChange={(e) => handleSettingChange('system', 'enableDebugMode', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>

            <div>
              <label htmlFor="logLevel" className="block text-sm font-medium text-gray-900">Nível de Log</label>
              <select
                id="logLevel"
                value={settings.system.logLevel}
                onChange={(e) => handleSettingChange('system', 'logLevel', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
              >
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div>
              <label htmlFor="backupFrequency" className="block text-sm font-medium text-gray-900">Frequência de Backup</label>
              <select
                id="backupFrequency"
                value={settings.system.backupFrequency}
                onChange={(e) => handleSettingChange('system', 'backupFrequency', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900 placeholder-gray-500"
              >
                <option value="hourly">A cada hora</option>
                <option value="daily">Diário</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 