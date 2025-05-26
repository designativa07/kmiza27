'use client'

import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'

// Dados simulados para os gráficos
const userActivityData = [
  { name: 'Jan', usuarios: 400, mensagens: 2400 },
  { name: 'Fev', usuarios: 300, mensagens: 1398 },
  { name: 'Mar', usuarios: 200, mensagens: 9800 },
  { name: 'Abr', usuarios: 278, mensagens: 3908 },
  { name: 'Mai', usuarios: 189, mensagens: 4800 },
  { name: 'Jun', usuarios: 239, mensagens: 3800 },
  { name: 'Jul', usuarios: 349, mensagens: 4300 },
]

const matchesData = [
  { name: 'Brasileirão', jogos: 380, audiencia: 85 },
  { name: 'Copa do Brasil', jogos: 120, audiencia: 65 },
  { name: 'Libertadores', jogos: 80, audiencia: 90 },
  { name: 'Estaduais', jogos: 200, audiencia: 45 },
  { name: 'Copa Sul-Americana', jogos: 60, audiencia: 55 },
]

const teamsPopularityData = [
  { name: 'Flamengo', value: 25, color: '#FF0000' },
  { name: 'Palmeiras', value: 20, color: '#00FF00' },
  { name: 'Corinthians', value: 18, color: '#000000' },
  { name: 'São Paulo', value: 15, color: '#FF0000' },
  { name: 'Santos', value: 12, color: '#FFFFFF' },
  { name: 'Outros', value: 10, color: '#CCCCCC' },
]

const notificationMetrics = [
  { name: 'Seg', enviadas: 120, abertas: 95, cliques: 45 },
  { name: 'Ter', enviadas: 150, abertas: 120, cliques: 60 },
  { name: 'Qua', enviadas: 180, abertas: 140, cliques: 75 },
  { name: 'Qui', enviadas: 200, abertas: 160, cliques: 85 },
  { name: 'Sex', enviadas: 250, abertas: 200, cliques: 110 },
  { name: 'Sab', enviadas: 300, abertas: 240, cliques: 130 },
  { name: 'Dom', enviadas: 280, abertas: 220, cliques: 120 },
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function AdvancedCharts() {
  return (
    <div className="space-y-8">
      {/* Atividade de Usuários */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📈 Atividade de Usuários (Últimos 7 meses)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={userActivityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [
                value, 
                name === 'usuarios' ? 'Usuários Ativos' : 'Mensagens Enviadas'
              ]}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="usuarios" 
              stackId="1" 
              stroke="#8884d8" 
              fill="#8884d8" 
              name="Usuários Ativos"
            />
            <Area 
              type="monotone" 
              dataKey="mensagens" 
              stackId="2" 
              stroke="#82ca9d" 
              fill="#82ca9d" 
              name="Mensagens"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Jogos por Competição */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🏆 Jogos por Competição
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={matchesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="jogos" fill="#8884d8" name="Número de Jogos" />
              <Bar dataKey="audiencia" fill="#82ca9d" name="Audiência %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Times Mais Populares */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ⚽ Times Mais Populares
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={teamsPopularityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {teamsPopularityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Métricas de Notificações */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🔔 Performance de Notificações (Última Semana)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={notificationMetrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="enviadas" 
              stroke="#8884d8" 
              strokeWidth={2}
              name="Enviadas"
            />
            <Line 
              type="monotone" 
              dataKey="abertas" 
              stroke="#82ca9d" 
              strokeWidth={2}
              name="Abertas"
            />
            <Line 
              type="monotone" 
              dataKey="cliques" 
              stroke="#ffc658" 
              strokeWidth={2}
              name="Cliques"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Taxa de Resposta</p>
              <p className="text-3xl font-bold">94.5%</p>
            </div>
            <div className="text-blue-200">
              📊
            </div>
          </div>
          <p className="text-blue-100 text-sm mt-2">+2.1% vs mês anterior</p>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Tempo Médio</p>
              <p className="text-3xl font-bold">1.2s</p>
            </div>
            <div className="text-green-200">
              ⚡
            </div>
          </div>
          <p className="text-green-100 text-sm mt-2">-0.3s vs mês anterior</p>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Satisfação</p>
              <p className="text-3xl font-bold">4.8/5</p>
            </div>
            <div className="text-purple-200">
              ⭐
            </div>
          </div>
          <p className="text-purple-100 text-sm mt-2">+0.2 vs mês anterior</p>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Uptime</p>
              <p className="text-3xl font-bold">99.9%</p>
            </div>
            <div className="text-orange-200">
              🚀
            </div>
          </div>
          <p className="text-orange-100 text-sm mt-2">Últimos 30 dias</p>
        </div>
      </div>

      {/* Insights e Recomendações */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          💡 Insights e Recomendações
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <h4 className="font-semibold text-blue-900">📈 Crescimento</h4>
            <p className="text-blue-700 text-sm mt-1">
              Usuários ativos cresceram 15% este mês. Continue investindo em conteúdo de qualidade.
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
            <h4 className="font-semibold text-green-900">⚽ Times Populares</h4>
            <p className="text-green-700 text-sm mt-1">
              Flamengo e Palmeiras dominam as consultas. Considere conteúdo especial para estes times.
            </p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
            <h4 className="font-semibold text-yellow-900">🔔 Notificações</h4>
            <p className="text-yellow-700 text-sm mt-1">
              Taxa de abertura de 80%. Teste horários diferentes para melhorar o engajamento.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 