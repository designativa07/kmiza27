import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Settings, TestTube } from 'lucide-react';

interface EvolutionApiSettings {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
  enabled: boolean;
}

export default function SystemSettingsManager() {
  const [settings, setSettings] = useState<EvolutionApiSettings>({
    apiUrl: '',
    apiKey: '',
    instanceName: '',
    enabled: true,
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/system-settings/evolution-api');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao carregar configurações' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/system-settings/evolution-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Erro ao salvar configurações' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações' });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      
      const response = await fetch('/api/system-settings/evolution-api/test', {
        method: 'POST',
      });

      const result = await response.json();
      setTestResult(result);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Conexão testada com sucesso!' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Erro na conexão' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao testar conexão' });
      setTestResult({ success: false, message: 'Erro de rede' });
    } finally {
      setTesting(false);
    }
  };

  const handleInputChange = (field: keyof EvolutionApiSettings, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading && !settings.apiUrl) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Configurações do Sistema</h2>
      </div>

      {message && (
        <Alert className={message.type === 'success' ? 'border-green-500' : 'border-red-500'}>
          <AlertDescription className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações da Evolution API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="apiUrl">URL da API</Label>
              <Input
                id="apiUrl"
                type="url"
                placeholder="https://evolution.kmiza27.com"
                value={settings.apiUrl}
                onChange={(e) => handleInputChange('apiUrl', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instanceName">Nome da Instância</Label>
              <Input
                id="instanceName"
                placeholder="Kmiza27"
                value={settings.instanceName}
                onChange={(e) => handleInputChange('instanceName', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Sua API Key da Evolution API"
              value={settings.apiKey}
              onChange={(e) => handleInputChange('apiKey', e.target.value)}
            />
            <p className="text-sm text-gray-500">
              A API Key será mascarada por segurança após salvar
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => handleInputChange('enabled', checked)}
            />
            <Label htmlFor="enabled">WhatsApp habilitado</Label>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={saveSettings} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Salvar Configurações
            </Button>

            <Button 
              onClick={testConnection} 
              disabled={testing}
              variant="outline"
              className="flex items-center gap-2"
            >
              {testing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              Testar Conexão
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Resultado do Teste
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className={`font-medium ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                {testResult.message}
              </p>
              
              {testResult.success && testResult.instance && (
                <div className="bg-green-50 p-3 rounded-md">
                  <p><strong>Instância:</strong> {testResult.instance.name}</p>
                  <p><strong>Status:</strong> {testResult.instance.status}</p>
                  <p><strong>ID:</strong> {testResult.instance.id}</p>
                </div>
              )}
              
              {!testResult.success && testResult.availableInstances && (
                <div className="bg-yellow-50 p-3 rounded-md">
                  <p><strong>Instâncias disponíveis:</strong></p>
                  <ul className="list-disc list-inside">
                    {testResult.availableInstances.map((instance: string, index: number) => (
                      <li key={index}>{instance}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {testResult.error && (
                <div className="bg-red-50 p-3 rounded-md">
                  <p><strong>Erro:</strong> {testResult.error}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 