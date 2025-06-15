'use client';

import * as React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, ChevronsUpDown } from 'lucide-react';
import Link from 'next/link';

interface Competition {
  id: number;
  name: string;
  slug: string;
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
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/competitions`);
        if (res.ok) {
          const data = await res.json();
          setCompetitions(data);
        }
      } catch (error) {
        console.error('Failed to fetch competitions for switcher:', error);
      }
    }
    fetchCompetitions();
  }, []);

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md px-2 py-1">
          <ChevronsUpDown className="w-4 h-4 mr-1" />
          <span>Todos os Campeonatos</span>
          <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={5}
          className="bg-white rounded-lg shadow-lg p-2 w-64 z-50 border border-gray-100"
        >
          <DropdownMenu.Label className="px-2 py-1.5 text-xs font-semibold text-gray-500">
            Selecione um campeonato
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />
          <DropdownMenu.Group>
            {competitions.map((competition) => (
              <DropdownMenu.Item key={competition.id} asChild>
                <Link
                  href={`/${competition.slug}/classificacao`}
                  className="block px-2 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
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