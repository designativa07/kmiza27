'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Brain, Zap, Database, Globe, Settings, TestTube, Trash2 } from 'lucide-react';
import aiResearchService, { ResearchConfig, AIResearchStats, AIResearchResult } from '@/services/aiResearchService';

export default function AIResearchPage() {
  const [config, setConfig] = useState<ResearchConfig | null>(null);
  const [stats, setStats] = useState<AIResearchStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState<AIResearchResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configData, statsData] = await Promise.all([
        aiResearchService.getConfig(),
        aiResearchService.getStats()
      ]);
      setConfig(configData);
      setStats(statsData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setMessage({ type: 'error', text: 'Erro ao carregar dados: ' + errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: keyof ResearchConfig, value: any) => {
    if (config) {
      setConfig({ ...config, [key]: value });
    }
  };

  const saveConfig = async () => {
    if (!config) return;
    
    try {
      setSaving(true);
      const result = await aiResearchService.updateConfig(config);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        await loadData(); // Recarregar dados
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setMessage({ type: 'error', text: 'Erro ao salvar: ' + errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const testResearch = async () => {
    if (!testMessage.trim()) return;
    
    try {
      setTesting(true);
      const result = await aiResearchService.testResearch(testMessage);
      if (result.success) {
        setTestResult(result.result);
        setMessage({ type: 'success', text: result.message });
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setMessage({ type: 'error', text: 'Erro no teste: ' + errorMessage });
    } finally {
      setTesting(false);
    }
  };

  const clearCache = async () => {
    try {
      const result = await aiResearchService.clearCache();
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        await loadData(); // Recarregar dados
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setMessage({ type: 'error', text: 'Erro ao limpar cache: ' + errorMessage });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando configurações...</span>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>Erro ao carregar configurações</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuração de IA Research</h1>
          <p className="text-muted-foreground">
            Configure o sistema de pesquisa inteligente para perguntas não reconhecidas
          </p>
        </div>
        <Badge variant={config.enabled ? 'default' : 'secondary'}>
          {config.enabled ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      {message && (
        <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuração Principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuração Principal
            </CardTitle>
            <CardDescription>
              Controle geral do sistema de IA Research
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="enabled">Sistema Ativo</Label>
              <Switch
                id="enabled"
                checked={config.enabled}
                onCheckedChange={(checked) => handleConfigChange('enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="openAI">OpenAI</Label>
              <Switch
                id="openAI"
                checked={config.openAI}
                onCheckedChange={(checked) => handleConfigChange('openAI', checked)}
                disabled={!config.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="knowledgeBase">Base de Conhecimento</Label>
              <Switch
                id="knowledgeBase"
                checked={config.knowledgeBase}
                onCheckedChange={(checked) => handleConfigChange('knowledgeBase', checked)}
                disabled={!config.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="webSearch">Busca Web</Label>
              <Switch
                id="webSearch"
                checked={config.webSearch}
                onCheckedChange={(checked) => handleConfigChange('webSearch', checked)}
                disabled={!config.enabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações Avançadas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Configurações Avançadas
            </CardTitle>
            <CardDescription>
              Parâmetros técnicos do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="maxTokens">Máximo de Tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                value={config.maxTokens}
                onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
                min={50}
                max={500}
                disabled={!config.enabled}
              />
            </div>

            <div>
              <Label htmlFor="temperature">Temperatura (Criatividade)</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                value={config.temperature}
                onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                min={0}
                max={2}
                disabled={!config.enabled}
              />
            </div>

            <div>
              <Label htmlFor="confidenceThreshold">Limite de Confiança</Label>
              <Input
                id="confidenceThreshold"
                type="number"
                step="0.1"
                value={config.confidenceThreshold}
                onChange={(e) => handleConfigChange('confidenceThreshold', parseFloat(e.target.value))}
                min={0}
                max={1}
                disabled={!config.enabled}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Estatísticas do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.cacheSize}</div>
                <div className="text-sm text-muted-foreground">Respostas em Cache</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.config.openAI ? 'Sim' : 'Não'}</div>
                <div className="text-sm text-muted-foreground">OpenAI Ativo</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.config.knowledgeBase ? 'Sim' : 'Não'}</div>
                <div className="text-sm text-muted-foreground">Base de Conhecimento</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teste da Funcionalidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Teste da Funcionalidade
          </CardTitle>
          <CardDescription>
            Teste o sistema com uma pergunta personalizada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="testMessage">Pergunta de Teste</Label>
            <Textarea
              id="testMessage"
              placeholder="Digite uma pergunta para testar o sistema..."
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              disabled={!config.enabled}
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={testResearch}
              disabled={!testMessage.trim() || testing || !config.enabled}
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Testando...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Testar
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={clearCache}
              disabled={!config.enabled}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Cache
            </Button>
          </div>

          {testResult && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Resultado do Teste:</h4>
              <div className="space-y-2">
                <div>
                  <strong>Sucesso:</strong> {testResult.success ? 'Sim' : 'Não'}
                </div>
                {testResult.answer && (
                  <div>
                    <strong>Resposta:</strong> {testResult.answer}
                  </div>
                )}
                <div>
                  <strong>Confiança:</strong> {(testResult.confidence * 100).toFixed(0)}%
                </div>
                <div>
                  <strong>Fonte:</strong> {testResult.source}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button
          onClick={saveConfig}
          disabled={saving}
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            'Salvar Configurações'
          )}
        </Button>
      </div>
    </div>
  );
}
