'use client';

import { useState, useEffect } from 'react';
import { API_ENDPOINTS, apiUrl } from '@/config/api';

interface Team {
  id: number;
  name: string;
  logo_url: string;
  is_international?: boolean;
  international_order?: number;
  // Campos adicionais que vêm da API
  slug?: string;
  full_name?: string;
  short_name?: string;
  short_code?: string;
  city?: string;
  state?: string;
  country?: string;
  category?: string;
  founded_year?: number;
  colors?: string;
  social_media?: {
    tiktok_url?: string;
    youtube_url?: string;
    instagram_url?: string;
    official_site_url?: string;
  };
  history?: string;
  information?: string;
  aliases?: string[];
  created_at?: string;
  updated_at?: string;
  // Campos adicionais
  stadium_id?: number;
  stadium?: {
    id: number;
    name: string;
    city: string;
    state: string;
    country: string;
    capacity: number;
    latitude?: string;
    longitude?: string;
    opened_year?: number;
    history?: string;
    image_url?: string;
    url?: string;
    created_at: string;
    category: string;
  };
}

export default function Homepage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [internationalTeams, setInternationalTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Banner settings
  const [bannerDesktopUrl, setBannerDesktopUrl] = useState<string>('');
  const [bannerMobileUrl, setBannerMobileUrl] = useState<string>('');
  const [bannerLinkUrl, setBannerLinkUrl] = useState<string>('');
  const [bannerDesktopFile, setBannerDesktopFile] = useState<File | null>(null);
  const [bannerMobileFile, setBannerMobileFile] = useState<File | null>(null);
  // Sidebar banner settings
  const [sidebarDesktopUrl, setSidebarDesktopUrl] = useState<string>('');
  const [sidebarMobileUrl, setSidebarMobileUrl] = useState<string>('');
  const [sidebarLinkUrl, setSidebarLinkUrl] = useState<string>('');
  const [sidebarDesktopFile, setSidebarDesktopFile] = useState<File | null>(null);
  const [sidebarMobileFile, setSidebarMobileFile] = useState<File | null>(null);
  
  // Estados para paginação e busca
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);

  useEffect(() => {
    fetchTeams();
    fetchBannerSettings();
    fetchSidebarBannerSettings();
  }, []);

  // Debug: monitorar mudanças no estado teams
  useEffect(() => {
    console.log('Estado teams atualizado:', teams);
    console.log('Estado internationalTeams atualizado:', internationalTeams);
  }, [teams, internationalTeams]);

  // Filtrar times baseado no termo de busca
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTeams(teams);
      setCurrentPage(1);
    } else {
      const filtered = teams.filter(team => 
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.short_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.country?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTeams(filtered);
      setCurrentPage(1);
    }
  }, [teams, searchTerm]);

  const fetchBannerSettings = async () => {
    const normalize = (data: any): string => {
      if (!data) return '';
      if (typeof data === 'string') return data;
      if (typeof data === 'object' && 'value' in data) return data.value || '';
      return '';
    };
    try {
      const [d, m, l] = await Promise.all([
        fetch(apiUrl('system-settings/homepage_banner_desktop_url')),
        fetch(apiUrl('system-settings/homepage_banner_mobile_url')),
        fetch(apiUrl('system-settings/homepage_banner_link_url')),
      ]);
      const dj = d.ok ? await d.json() : null;
      const mj = m.ok ? await m.json() : null;
      const lj = l.ok ? await l.json() : null;
      setBannerDesktopUrl(normalize(dj));
      setBannerMobileUrl(normalize(mj));
      setBannerLinkUrl(normalize(lj));
    } catch (e) {
      // silencioso
    }
  };

  const fetchSidebarBannerSettings = async () => {
    const normalize = (data: any): string => {
      if (!data) return '';
      if (typeof data === 'string') return data;
      if (typeof data === 'object' && 'value' in data) return data.value || '';
      return '';
    };
    try {
      const [d, m, l] = await Promise.all([
        fetch(apiUrl('system-settings/homepage_sidebar_banner_desktop_url')),
        fetch(apiUrl('system-settings/homepage_sidebar_banner_mobile_url')),
        fetch(apiUrl('system-settings/homepage_sidebar_banner_link_url')),
      ]);
      const dj = d.ok ? await d.json() : null;
      const mj = m.ok ? await m.json() : null;
      const lj = l.ok ? await l.json() : null;
      setSidebarDesktopUrl(normalize(dj));
      setSidebarMobileUrl(normalize(mj));
      setSidebarLinkUrl(normalize(lj));
    } catch (_) {}
  };

  const fetchTeams = async () => {
    try {
      setLoading(true);
      
      console.log('Iniciando busca de times...');
      
      const teamsUrl = API_ENDPOINTS.teams.list() + '?limit=1000';
      const internationalUrl = API_ENDPOINTS.teams.international();
      
      console.log('URLs das APIs:');
      console.log('Teams URL:', teamsUrl);
      console.log('International URL:', internationalUrl);
      
      // Buscar todos os times
      const teamsRes = await fetch(teamsUrl);
      const teamsData = await teamsRes.json();
      
      // Buscar times internacionais configurados
      const internationalRes = await fetch(internationalUrl);
      const internationalData = await internationalRes.json();
      
      console.log('Resposta da API teams:', teamsData);
      console.log('Resposta da API international:', internationalData);
      
      // Extrair os dados corretamente da resposta da API
      const allTeams = teamsData.data || teamsData;
      const international = internationalData.data || internationalData;
      
      console.log('Times extraídos:', allTeams);
      console.log('Times internacionais extraídos:', international);
      
      // Garantir que ambos sejam sempre arrays
      const teamsArray = Array.isArray(allTeams) ? allTeams : [];
      const internationalArray = Array.isArray(international) ? international : [];
      
      console.log('Arrays finais:', { teams: teamsArray, international: internationalArray });
      
      setTeams(teamsArray);
      setInternationalTeams(internationalArray);
    } catch (error) {
      console.error('Erro ao buscar times:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSidebarBannerSettings = async () => {
    setSaving(true);
    try {
      let desktopUrl = (sidebarDesktopUrl || '').trim();
      let mobileUrl = (sidebarMobileUrl || '').trim();
      const linkUrl = (sidebarLinkUrl || '').trim();

      if (sidebarDesktopFile) {
        desktopUrl = await handleBannerUpload(sidebarDesktopFile, 'desktop');
      }
      if (sidebarMobileFile) {
        mobileUrl = await handleBannerUpload(sidebarMobileFile, 'mobile');
      }

      const isEmpty = (v: string) => v.length === 0;
      const reqs: Promise<Response>[] = [];
      if (isEmpty(desktopUrl)) reqs.push(fetch(apiUrl('system-settings/homepage_sidebar_banner_desktop_url'), { method: 'DELETE' }));
      else reqs.push(fetch(apiUrl('system-settings/homepage_sidebar_banner_desktop_url'), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: desktopUrl }) }));
      if (isEmpty(mobileUrl)) reqs.push(fetch(apiUrl('system-settings/homepage_sidebar_banner_mobile_url'), { method: 'DELETE' }));
      else reqs.push(fetch(apiUrl('system-settings/homepage_sidebar_banner_mobile_url'), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: mobileUrl }) }));
      if (isEmpty(linkUrl)) reqs.push(fetch(apiUrl('system-settings/homepage_sidebar_banner_link_url'), { method: 'DELETE' }));
      else reqs.push(fetch(apiUrl('system-settings/homepage_sidebar_banner_link_url'), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: linkUrl }) }));

      await Promise.all(reqs);
      setSidebarDesktopUrl(desktopUrl); setSidebarMobileUrl(mobileUrl); setSidebarLinkUrl(linkUrl);
      setSidebarDesktopFile(null); setSidebarMobileFile(null);
      alert('Banner lateral salvo com sucesso');
    } catch (_) {
      alert('Falha ao salvar banner lateral');
    } finally {
      setSaving(false);
    }
  };

  // Funções de paginação
  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTeams = filteredTeams.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  // Função para adicionar time internacional
  const addInternationalTeam = async (team: Team) => {
    try {
      setSaving(true);
      const response = await fetch(API_ENDPOINTS.teams.toggleInternational(team.id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order: internationalTeams.length + 1
        }),
      });

      if (response.ok) {
        // Recarregar times internacionais
        const internationalRes = await fetch(API_ENDPOINTS.teams.international());
        const internationalData = await internationalRes.json();
        setInternationalTeams(internationalData.data || internationalData);
      } else {
        console.error('Erro ao adicionar time internacional');
      }
    } catch (error) {
      console.error('Erro ao adicionar time internacional:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleInternational = async (teamId: number, isInternational: boolean) => {
    try {
      setSaving(true);
      
      if (isInternational) {
        // Remover da lista internacional
        await fetch(API_ENDPOINTS.teams.toggleInternational(teamId), {
          method: 'DELETE'
        });
      } else {
        // Adicionar à lista internacional
        await fetch(API_ENDPOINTS.teams.toggleInternational(teamId), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ order: internationalTeams.length + 1 })
        });
      }
      
      // Recarregar times internacionais
      const internationalRes = await fetch(API_ENDPOINTS.teams.international());
      const internationalData = await internationalRes.json();
      setInternationalTeams(internationalData.data || internationalData);
    } catch (error) {
      console.error('Erro ao atualizar time internacional:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateOrder = async (teamId: number, newOrder: number) => {
    try {
      setSaving(true);
      
      await fetch(API_ENDPOINTS.teams.updateInternationalOrder(teamId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ order: newOrder })
      });
      
      // Recarregar times internacionais
      const internationalRes = await fetch(API_ENDPOINTS.teams.international());
      const internationalData = await internationalRes.json();
      setInternationalTeams(internationalData.data || internationalData);
    } catch (error) {
      console.error('Erro ao atualizar ordem:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleBannerUpload = async (file: File, kind: 'desktop' | 'mobile') => {
    const form = new FormData();
    form.append('file', file);
    form.append('folder', 'homepage-banners');
    form.append('fileName', `homepage-${kind}-${Date.now()}`);
    const res = await fetch(apiUrl('system-settings/upload-image'), { method: 'POST', body: form });
    if (!res.ok) throw new Error('Upload falhou');
    const data = await res.json();
    return data.url as string;
  };

  const saveBannerSettings = async () => {
    setSaving(true);
    try {
      let desktopUrl = (bannerDesktopUrl || '').trim();
      let mobileUrl = (bannerMobileUrl || '').trim();
      const linkUrl = (bannerLinkUrl || '').trim();

      if (bannerDesktopFile) {
        desktopUrl = await handleBannerUpload(bannerDesktopFile, 'desktop');
      }
      if (bannerMobileFile) {
        mobileUrl = await handleBannerUpload(bannerMobileFile, 'mobile');
      }

      const isEmpty = (v: string) => v.length === 0;
      const requests: Promise<Response>[] = [];

      if (isEmpty(desktopUrl)) {
        requests.push(fetch(apiUrl('system-settings/homepage_banner_desktop_url'), { method: 'DELETE' }));
      } else {
        requests.push(fetch(apiUrl('system-settings/homepage_banner_desktop_url'), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: desktopUrl }) }));
      }
      if (isEmpty(mobileUrl)) {
        requests.push(fetch(apiUrl('system-settings/homepage_banner_mobile_url'), { method: 'DELETE' }));
      } else {
        requests.push(fetch(apiUrl('system-settings/homepage_banner_mobile_url'), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: mobileUrl }) }));
      }
      if (isEmpty(linkUrl)) {
        requests.push(fetch(apiUrl('system-settings/homepage_banner_link_url'), { method: 'DELETE' }));
      } else {
        requests.push(fetch(apiUrl('system-settings/homepage_banner_link_url'), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: linkUrl }) }));
      }

      await Promise.all(requests);

      setBannerDesktopUrl(desktopUrl || '');
      setBannerMobileUrl(mobileUrl || '');
      setBannerLinkUrl(linkUrl || '');
      setBannerDesktopFile(null);
      setBannerMobileFile(null);
      alert('Banner salvo com sucesso');
    } catch (e) {
      alert('Falha ao salvar banner');
    } finally {
      setSaving(false);
    }
  };

  const moveUp = (index: number) => {
    if (Array.isArray(internationalTeams) && index > 0) {
      const team = internationalTeams[index];
      const prevTeam = internationalTeams[index - 1];
      updateOrder(team.id, prevTeam.international_order || index);
      updateOrder(prevTeam.id, team.international_order || index + 1);
    }
  };

  const moveDown = (index: number) => {
    if (Array.isArray(internationalTeams) && index < internationalTeams.length - 1) {
      const team = internationalTeams[index];
      const nextTeam = internationalTeams[index + 1];
      updateOrder(team.id, nextTeam.international_order || index + 2);
      updateOrder(nextTeam.id, team.international_order || index);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Título da página */}
      <div className="border-b border-gray-200 dark:border-slate-600 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Homepage</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Configure o banner e gerencie os times internacionais exibidos na Futepédia.</p>
      </div>

      {/* Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Banner da Homepage</h2>
        <p className="text-sm text-gray-500 mb-3">Desktop: 896 px de largura. Mobile: ocupa 100% do container. Recomendo 640 px de largura para boa nitidez.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">URL do Banner (Desktop)</label>
            <input type="url" value={bannerDesktopUrl} onChange={(e)=> setBannerDesktopUrl(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600" placeholder="https://cdn.kmiza27.com/img/banners/home-desktop.jpg" />
            <div className="mt-2">
              <input type="file" accept="image/*" onChange={(e)=> setBannerDesktopFile(e.target.files?.[0] || null)} />
            </div>
            {bannerDesktopUrl && (<img src={bannerDesktopUrl} alt="Banner Desktop" className="mt-2 max-h-40 rounded border" />)}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">URL do Banner (Mobile)</label>
            <input type="url" value={bannerMobileUrl} onChange={(e)=> setBannerMobileUrl(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600" placeholder="https://cdn.kmiza27.com/img/banners/home-mobile.jpg" />
            <div className="mt-2">
              <input type="file" accept="image/*" onChange={(e)=> setBannerMobileFile(e.target.files?.[0] || null)} />
            </div>
            {bannerMobileUrl && (<img src={bannerMobileUrl} alt="Banner Mobile" className="mt-2 max-h-40 rounded border" />)}
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Link do Banner</label>
          <input type="url" value={bannerLinkUrl} onChange={(e)=> setBannerLinkUrl(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600" placeholder="https://kmiza27.com/alguma-pagina" />
        </div>
        <div className="mt-4">
          <button onClick={saveBannerSettings} disabled={saving} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar Banner'}</button>
        </div>
      </div>

      {/* Banner Lateral (barra direita) */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Banner Lateral (Barra Direita)</h2>
        <p className="text-sm text-gray-500 mb-3">Largura recomendada: 352 px no desktop (igual à coluna lateral). No mobile ocupa 100%, 640px de largura sugerida.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">URL do Banner (Desktop)</label>
            <input type="url" value={sidebarDesktopUrl} onChange={(e)=> setSidebarDesktopUrl(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600" placeholder="https://cdn.kmiza27.com/img/banners/sidebar-desktop.jpg" />
            <div className="mt-2">
              <input type="file" accept="image/*" onChange={(e)=> setSidebarDesktopFile(e.target.files?.[0] || null)} />
            </div>
            {sidebarDesktopUrl && (<img src={sidebarDesktopUrl} alt="Banner Lateral Desktop" className="mt-2 max-h-40 rounded border" />)}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">URL do Banner (Mobile)</label>
            <input type="url" value={sidebarMobileUrl} onChange={(e)=> setSidebarMobileUrl(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600" placeholder="https://cdn.kmiza27.com/img/banners/sidebar-mobile.jpg" />
            <div className="mt-2">
              <input type="file" accept="image/*" onChange={(e)=> setSidebarMobileFile(e.target.files?.[0] || null)} />
            </div>
            {sidebarMobileUrl && (<img src={sidebarMobileUrl} alt="Banner Lateral Mobile" className="mt-2 max-h-40 rounded border" />)}
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Link do Banner</label>
          <input type="url" value={sidebarLinkUrl} onChange={(e)=> setSidebarLinkUrl(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600" placeholder="https://kmiza27.com/alguma-pagina" />
        </div>
        <div className="mt-4">
          <button onClick={saveSidebarBannerSettings} disabled={saving} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar Banner Lateral'}</button>
        </div>
      </div>

      {/* Times Internacionais Atuais */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Times Internacionais Selecionados ({Array.isArray(internationalTeams) ? internationalTeams.length : 0}/20)
        </h2>
        
        {!Array.isArray(internationalTeams) || internationalTeams.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            Nenhum time internacional selecionado ainda.
          </p>
        ) : (
          <div className="space-y-3">
            {internationalTeams.map((team, index) => (
              <div key={team.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-8">
                    {index + 1}
                  </span>
                  {team.logo_url && (
                    <img 
                      src={team.logo_url} 
                      alt={team.name}
                      className="w-8 h-8 object-contain"
                    />
                  )}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {team.name}
                  </span>
                  {team.city && team.country && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {team.city}, {team.country}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0 || saving}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={!Array.isArray(internationalTeams) || index === internationalTeams.length - 1 || saving}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => toggleInternational(team.id, true)}
                    disabled={saving}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista de Todos os Times */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Todos os Times Disponíveis ({filteredTeams.length} times)
        </h2>

        {/* Barra de busca */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar times por nome, cidade, país..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
        </div>

        {/* Debug info */}
        <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
          <p>Debug: teams.length = {teams.length}</p>
          <p>Debug: filteredTeams.length = {filteredTeams.length}</p>
          <p>Debug: Array.isArray(teams) = {Array.isArray(teams).toString()}</p>
          <p>Debug: Página atual: {currentPage} de {totalPages}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentTeams.map((team) => {
            const isInternational = internationalTeams.some(it => it.id === team.id);
            return (
              <div
                key={team.id}
                className={`p-4 border rounded-lg ${
                  isInternational
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-slate-600'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <img
                      src={team.logo_url || '/placeholder-team.png'}
                      alt={team.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {team.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {team.city && team.country ? `${team.city}, ${team.country}` : 'Localização não informada'}
                    </p>
                    {isInternational && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Internacional
                      </span>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {!isInternational ? (
                      <button
                        onClick={() => addInternationalTeam(team)}
                        disabled={saving}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {saving ? 'Adicionando...' : 'Adicionar'}
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleInternational(team.id, false)}
                        disabled={saving}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        {saving ? 'Removendo...' : 'Remover'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              >
                Próxima
              </button>
            </div>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Informações */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Como Funciona
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Selecione até 20 times internacionais para exibir na aba "Internacional"</li>
          <li>• Use as setas ↑↓ para reordenar os times selecionados</li>
          <li>• Os times selecionados aparecerão na ordem definida</li>
          <li>• Clique em "Remover" para tirar um time da lista internacional</li>
        </ul>
      </div>
    </div>
  );
}
