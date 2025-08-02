'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { X, Plus, Save, Loader2 } from 'lucide-react';
// import { toast } from 'react-hot-toast';

interface Team {
  id: number;
  name: string;
  short_name?: string;
  aliases?: string[];
  // Propriedades opcionais para compatibilidade
  slug?: string;
  created_at?: string;
  [key: string]: any; // Permite outras propriedades
}

interface TeamAliasesManagerProps {
  team: Team;
  onUpdate?: (team: Team) => void;
}

export default function TeamAliasesManager({ team, onUpdate }: TeamAliasesManagerProps) {
  const [aliases, setAliases] = useState<string[]>(team.aliases || []);
  const [newAlias, setNewAlias] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setAliases(team.aliases || []);
  }, [team]);

  const addAlias = () => {
    const trimmedAlias = newAlias.trim().toLowerCase();
    if (!trimmedAlias) {
      console.error('Alias não pode estar vazio');
      return;
    }
    if (aliases.includes(trimmedAlias)) {
      console.error('Alias já existe');
      return;
    }
    setAliases([...aliases, trimmedAlias]);
    setNewAlias('');
  };

  const removeAlias = (aliasToRemove: string) => {
    setAliases(aliases.filter(alias => alias !== aliasToRemove));
  };

  const saveAliases = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/teams/${team.id}/aliases`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ aliases }),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar aliases');
      }

      const updatedTeam = await response.json();
      console.log('Aliases salvos com sucesso!');
      onUpdate?.(updatedTeam);
    } catch (error) {
      console.error('Erro ao salvar aliases:', error);
      console.error('Erro ao salvar aliases');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addAlias();
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Aliases do Time</span>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
        <p className="text-sm text-gray-600">
          Gerencie os aliases para o time <strong>{team.name}</strong>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de aliases existentes */}
        <div>
          <h4 className="text-sm font-medium mb-2">Aliases atuais:</h4>
          <div className="flex flex-wrap gap-2">
            {aliases.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum alias configurado</p>
            ) : (
              aliases.map((alias, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {alias}
                  <button
                    onClick={() => removeAlias(alias)}
                    className="ml-1 hover:text-red-500"
                    title="Remover alias"
                    aria-label={`Remover alias ${alias}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
        </div>

        {/* Adicionar novo alias */}
        <div className="flex gap-2">
          <Input
            placeholder="Digite um novo alias..."
            value={newAlias}
            onChange={(e) => setNewAlias(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={addAlias} size="sm" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Botão salvar */}
        <div className="flex justify-end">
          <Button
            onClick={saveAliases}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar Aliases
          </Button>
        </div>

        {/* Informações */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <p><strong>Dica:</strong> Aliases são palavras-chave que os usuários podem usar para identificar o time no WhatsApp.</p>
          <p>Exemplos: "fogão" para Botafogo, "mengão" para Flamengo, etc.</p>
        </div>
      </CardContent>
    </Card>
  );
} 