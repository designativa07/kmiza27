'use client';

import * as React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, ChevronsUpDown, Trophy } from 'lucide-react';
import Link from 'next/link';
import { apiRequest } from '@/lib/config';
import { getCompetitionLogoUrl } from '@/lib/cdn-simple';

interface Competition {
  id: number;
  name: string;
  slug: string;
  logo_url?: string;
}

export function CompetitionSwitcher({
  currentCompetitionName,
}: {
  currentCompetitionName: string;
}) {
  const [competitions, setCompetitions] = React.useState<Competition[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    async function fetchCompetitions() {
      try {
        const res = await apiRequest('/competitions?active=true');
        const data = await res.json();
        setCompetitions(data);
      } catch (error) {
        console.error('Failed to fetch competitions for switcher:', error);
        // Em caso de erro, definir array vazio para evitar erros de renderização
        setCompetitions([]);
      }
    }
    fetchCompetitions();
  }, []);

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center text-sm font-medium bg-orange-400 text-white hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 rounded-md px-3 py-2 shadow-sm">
          <Trophy className="w-4 h-4 mr-1" />
          <span className="font-bold uppercase">CAMPEONATOS</span>
          <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={5}
          className="bg-white rounded-lg shadow-lg p-2 w-64 z-50 border border-gray-100"
        >
          <DropdownMenu.Group>
            {competitions.map((competition) => (
              <DropdownMenu.Item key={competition.id} asChild>
                <Link
                  href={`/${competition.slug}/jogos`}
                  className="flex items-center px-2 py-1.5 text-base text-gray-700 rounded-md hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  {competition.logo_url && (
                    <img
                      src={getCompetitionLogoUrl(competition.logo_url)}
                      alt={`${competition.name} logo`}
                      className="h-5 w-5 object-contain mr-2"
                    />
                  )}
                  {competition.name}
                </Link>
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Group>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
} 