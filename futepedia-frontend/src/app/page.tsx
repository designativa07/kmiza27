import Link from 'next/link';

// 1. Definir a interface para o tipo Competition
interface Competition {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
}

// 2. Definir a URL da API (idealmente viria de variáveis de ambiente)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function getCompetitions(): Promise<Competition[]> {
  // Usamos a fetch API do Next.js com a opção de não usar cache.
  // Isso força a renderização dinâmica a cada requisição,
  // resolvendo o problema de conexão com a API durante o build.
  const res = await fetch(`${API_URL}/competitions`, { cache: 'no-store' });

  if (!res.ok) {
    // Isso será pego pelo error.tsx do Next.js
    throw new Error('Falha ao buscar competições');
  }
  return res.json();
}

export default async function Home() {
  // 3. Os dados são buscados diretamente no servidor e passados para o JSX
  const competitions = await getCompetitions();

  return (
    <main className="container mx-auto p-4">
      <header className="text-center my-8">
        <h1 className="text-4xl font-bold">Futepédia Kmiza27</h1>
        <p className="text-lg text-gray-600 mt-2">Tabelas e Jogos dos seus campeonatos favoritos</p>
      </header>

      {/* A página agora é pré-renderizada com os dados, eliminando a necessidade de estados de 'loading' ou 'error' no cliente. */}
      {competitions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitions.map((competition) => (
            <div key={competition.id} className="border rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow flex flex-col justify-between">
              <h2 className="text-2xl font-semibold mb-4">{competition.name}</h2>
              <div>
                <Link href={`/${competition.slug}/classificacao`} className="text-indigo-600 hover:underline mt-4 inline-block">
                  Ver Classificação &rarr;
                </Link>
                <br />
                <Link href={`/${competition.slug}/jogos`} className="text-indigo-600 hover:underline">
                  Ver Jogos &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
         <p className="text-center text-gray-500 mt-8">Nenhum campeonato encontrado no momento.</p>
      )}
    </main>
  );
}
