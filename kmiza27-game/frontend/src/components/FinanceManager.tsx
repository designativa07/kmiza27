'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';

interface FinancialReport {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  details: {
    ticket_sales: number;
    merchandise: number;
    sponsorships: number;
    player_salaries: number;
    staff_salaries: number;
    maintenance: number;
    youth_academy: number;
    other_expenses: number;
  };
}

interface Sponsorship {
  id: string;
  name: string;
  amount: number;
  duration: number;
  type: 'shirt' | 'stadium' | 'training' | 'general';
  status: 'active' | 'expired' | 'negotiating';
}

export default function FinanceManager() {
  const { selectedTeam } = useGameStore();
  const [financialReports, setFinancialReports] = useState<FinancialReport[]>([]);
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'sponsorships' | 'investments'>('overview');

  useEffect(() => {
    if (selectedTeam) {
      loadFinancialData();
    }
  }, [selectedTeam]);

  const loadFinancialData = async () => {
    if (!selectedTeam) return;
    
    setLoading(true);
    try {
      // TODO: Implementar chamadas para API
      // Dados mockados por enquanto
      const mockReports: FinancialReport[] = [
        {
          month: 'Janeiro 2025',
          revenue: 250000,
          expenses: 180000,
          profit: 70000,
          details: {
            ticket_sales: 120000,
            merchandise: 30000,
            sponsorships: 100000,
            player_salaries: 80000,
            staff_salaries: 40000,
            maintenance: 30000,
            youth_academy: 50000,
            other_expenses: 20000
          }
        },
        {
          month: 'Fevereiro 2025',
          revenue: 280000,
          expenses: 175000,
          profit: 105000,
          details: {
            ticket_sales: 140000,
            merchandise: 35000,
            sponsorships: 105000,
            player_salaries: 80000,
            staff_salaries: 40000,
            maintenance: 25000,
            youth_academy: 50000,
            other_expenses: 20000
          }
        }
      ];

      const mockSponsorships: Sponsorship[] = [
        {
          id: '1',
          name: 'TechCorp',
          amount: 50000,
          duration: 12,
          type: 'shirt',
          status: 'active'
        },
        {
          id: '2',
          name: 'EnergyDrink',
          amount: 30000,
          duration: 6,
          type: 'stadium',
          status: 'active'
        }
      ];

      setFinancialReports(mockReports);
      setSponsorships(mockSponsorships);
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  const negotiateSponsorship = async () => {
    // TODO: Implementar negociação de patrocínio
    alert('Funcionalidade de negociação de patrocínio em desenvolvimento...');
  };

  const makeInvestment = async (type: string) => {
    // TODO: Implementar investimento
    alert(`Investimento em ${type} em desenvolvimento...`);
  };

  if (!selectedTeam) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4 text-gray-900">💰 Gestão Financeira</h2>
        <p className="text-gray-700">Selecione um time para gerenciar as finanças.</p>
      </div>
    );
  }

  const currentReport = financialReports[0];
  const totalRevenue = financialReports.reduce((sum, report) => sum + report.revenue, 0);
  const totalExpenses = financialReports.reduce((sum, report) => sum + report.expenses, 0);
  const totalProfit = totalRevenue - totalExpenses;

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">💰 Finanças - {selectedTeam.name}</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
              activeTab === 'overview' 
                ? 'tab-active' 
                : 'tab-inactive'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
              activeTab === 'reports' 
                ? 'tab-active' 
                : 'tab-inactive'
            }`}
          >
            Relatórios
          </button>
          <button
            onClick={() => setActiveTab('sponsorships')}
            className={`px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
              activeTab === 'sponsorships' 
                ? 'tab-active' 
                : 'tab-inactive'
            }`}
          >
            Patrocínios
          </button>
          <button
            onClick={() => setActiveTab('investments')}
            className={`px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
              activeTab === 'investments' 
                ? 'tab-active' 
                : 'tab-inactive'
            }`}
          >
            Investimentos
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-2 text-gray-700">Carregando dados financeiros...</p>
        </div>
      ) : (
        <div>
          {activeTab === 'overview' && currentReport && (
            <div className="space-y-6">
              {/* Resumo Financeiro */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800">Receitas</h3>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {currentReport.revenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-green-600">Este mês</p>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800">Despesas</h3>
                  <p className="text-2xl font-bold text-red-600">
                    R$ {currentReport.expenses.toLocaleString()}
                  </p>
                  <p className="text-sm text-red-600">Este mês</p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800">Lucro</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    R$ {currentReport.profit.toLocaleString()}
                  </p>
                  <p className="text-sm text-blue-600">Este mês</p>
                </div>
              </div>

              {/* Detalhes de Receitas */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-gray-900">📈 Receitas Detalhadas</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-700">Vendas de Ingressos:</span>
                    <span className="float-right font-semibold">R$ {currentReport.details.ticket_sales.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-700">Merchandising:</span>
                    <span className="float-right font-semibold">R$ {currentReport.details.merchandise.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-700">Patrocínios:</span>
                    <span className="float-right font-semibold">R$ {currentReport.details.sponsorships.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Detalhes de Despesas */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-gray-900">📉 Despesas Detalhadas</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-700">Salários Jogadores:</span>
                    <span className="float-right font-semibold">R$ {currentReport.details.player_salaries.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-700">Salários Staff:</span>
                    <span className="float-right font-semibold">R$ {currentReport.details.staff_salaries.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-700">Manutenção:</span>
                    <span className="float-right font-semibold">R$ {currentReport.details.maintenance.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-700">Academia de Base:</span>
                    <span className="float-right font-semibold">R$ {currentReport.details.youth_academy.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">📊 Relatórios Mensais</h3>
              
              <div className="space-y-3">
                {financialReports.map((report, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">{report.month}</h4>
                      <span className={`px-2 py-1 rounded text-sm ${
                        report.profit >= 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {report.profit >= 0 ? '+' : ''}R$ {report.profit.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-700">Receitas:</span>
                        <span className="float-right font-semibold text-green-600">
                          R$ {report.revenue.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-700">Despesas:</span>
                        <span className="float-right font-semibold text-red-600">
                          R$ {report.expenses.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sponsorships' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">🤝 Patrocínios</h3>
                <button
                  onClick={negotiateSponsorship}
                  className="btn-primary"
                >
                  Negociar Patrocínio
                </button>
              </div>
              
              <div className="space-y-3">
                {sponsorships.map((sponsorship) => (
                  <div key={sponsorship.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-gray-900">{sponsorship.name}</h4>
                        <p className="text-sm text-gray-700">
                          {sponsorship.type === 'shirt' ? '🏟️ Camisa' : 
                           sponsorship.type === 'stadium' ? '🏟️ Estádio' : 
                           sponsorship.type === 'training' ? '⚽ Treino' : '📢 Geral'}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          R$ {sponsorship.amount.toLocaleString()}/mês
                        </div>
                        <div className="text-sm text-gray-600">
                          {sponsorship.duration} meses • {sponsorship.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'investments' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">💼 Investimentos</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-gray-900">🏟️ Expansão do Estádio</h4>
                  <p className="text-sm text-gray-700 mb-3">
                    Aumente a capacidade do estádio para gerar mais receitas
                  </p>
                  <button
                    onClick={() => makeInvestment('stadium_expansion')}
                    className="w-full btn-primary"
                  >
                    Investir R$ 500.000
                  </button>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-gray-900">🏫 Academia de Base</h4>
                  <p className="text-sm text-gray-700 mb-3">
                    Melhore as instalações da academia para desenvolver talentos
                  </p>
                  <button
                    onClick={() => makeInvestment('youth_academy')}
                    className="w-full btn-primary"
                  >
                    Investir R$ 200.000
                  </button>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-gray-900">🏥 Centro Médico</h4>
                  <p className="text-sm text-gray-700 mb-3">
                    Reduza lesões e melhore a recuperação dos jogadores
                  </p>
                  <button
                    onClick={() => makeInvestment('medical_center')}
                    className="w-full btn-primary"
                  >
                    Investir R$ 300.000
                  </button>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-gray-900">🎯 Centro de Treinamento</h4>
                  <p className="text-sm text-gray-700 mb-3">
                    Melhore as instalações de treinamento para desenvolvimento
                  </p>
                  <button
                    onClick={() => makeInvestment('training_center')}
                    className="w-full btn-primary"
                  >
                    Investir R$ 400.000
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 