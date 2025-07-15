import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsAppMenuConfig } from '../../entities/whatsapp-menu-config.entity';

export interface MenuSection {
  title: string;
  rows: MenuRow[];
}

export interface MenuRow {
  id: string;
  title: string;
  description: string;
}

@Injectable()
export class WhatsAppMenuService {
  private readonly logger = new Logger(WhatsAppMenuService.name);

  constructor(
    @InjectRepository(WhatsAppMenuConfig)
    private menuConfigRepository: Repository<WhatsAppMenuConfig>,
  ) {}

  async getGeneralConfig(): Promise<{ title: string; description: string; footer: string }> {
    try {
      // Buscar configurações gerais (podem estar armazenadas como itens especiais ou usar valores padrão)
      const titleConfig = await this.menuConfigRepository.findOne({
        where: { item_id: 'MENU_GENERAL_TITLE' }
      });
      const descriptionConfig = await this.menuConfigRepository.findOne({
        where: { item_id: 'MENU_GENERAL_DESCRIPTION' }
      });
      const footerConfig = await this.menuConfigRepository.findOne({
        where: { item_id: 'MENU_GENERAL_FOOTER' }
      });

      return {
        title: titleConfig?.item_title || 'Kmiza27 Bot',
        description: descriptionConfig?.item_title || 'Selecione uma das opções abaixo para começar:',
        footer: footerConfig?.item_title || 'Selecione uma das opções'
      };
    } catch (error) {
      this.logger.error('Erro ao buscar configurações gerais do menu:', error);
      return {
        title: 'Kmiza27 Bot',
        description: 'Selecione uma das opções abaixo para começar:',
        footer: 'Selecione uma das opções'
      };
    }
  }

  async updateGeneralConfig(config: { title: string; description: string; footer: string }): Promise<boolean> {
    try {
      // Salvar ou atualizar configurações gerais
      await this.saveOrUpdateGeneralConfig('MENU_GENERAL_TITLE', config.title);
      await this.saveOrUpdateGeneralConfig('MENU_GENERAL_DESCRIPTION', config.description);
      await this.saveOrUpdateGeneralConfig('MENU_GENERAL_FOOTER', config.footer);
      
      return true;
    } catch (error) {
      this.logger.error('Erro ao atualizar configurações gerais do menu:', error);
      return false;
    }
  }

  private async saveOrUpdateGeneralConfig(itemId: string, value: string): Promise<void> {
    let config = await this.menuConfigRepository.findOne({ where: { item_id: itemId } });
    
    if (config) {
      config.item_title = value;
    } else {
      config = this.menuConfigRepository.create({
        section_id: 'general_config',
        section_title: 'Configurações Gerais',
        section_order: 0,
        item_id: itemId,
        item_title: value,
        item_description: `Configuração: ${itemId}`,
        item_order: 1,
        active: true
      });
    }
    
    await this.menuConfigRepository.save(config);
  }

  async getMenuSections(): Promise<MenuSection[]> {
    try {
      const configs = await this.menuConfigRepository
        .createQueryBuilder('config')
        .where('config.active = :active', { active: true })
        .orderBy('config.section_order', 'ASC')
        .addOrderBy('config.item_order', 'ASC')
        .getMany();

      // Agrupar por seção
      const sectionsMap = new Map<string, MenuSection>();

      configs.forEach(config => {
        if (!sectionsMap.has(config.section_id)) {
          sectionsMap.set(config.section_id, {
            title: config.section_title,
            rows: []
          });
        }

        sectionsMap.get(config.section_id)!.rows.push({
          id: config.item_id,
          title: config.item_title,
          description: config.item_description
        });
      });

      return Array.from(sectionsMap.values());
    } catch (error) {
      this.logger.error('Erro ao buscar seções do menu:', error);
      // Retornar menu padrão em caso de erro
      return this.getDefaultMenuSections();
    }
  }

  async getAllMenuConfigs(): Promise<WhatsAppMenuConfig[]> {
    try {
      return await this.menuConfigRepository
        .createQueryBuilder('config')
        .orderBy('config.section_order', 'ASC')
        .addOrderBy('config.item_order', 'ASC')
        .getMany();
    } catch (error) {
      this.logger.error('Erro ao buscar todas as configurações do menu:', error);
      return [];
    }
  }

  async updateMenuConfig(id: number, updates: Partial<WhatsAppMenuConfig>): Promise<WhatsAppMenuConfig | null> {
    try {
      await this.menuConfigRepository.update(id, updates);
      return await this.menuConfigRepository.findOne({ where: { id } });
    } catch (error) {
      this.logger.error(`Erro ao atualizar configuração do menu ${id}:`, error);
      return null;
    }
  }

  async createMenuConfig(config: Partial<WhatsAppMenuConfig>): Promise<WhatsAppMenuConfig> {
    try {
      const newConfig = this.menuConfigRepository.create(config);
      return await this.menuConfigRepository.save(newConfig);
    } catch (error) {
      this.logger.error('Erro ao criar configuração do menu:', error);
      throw error;
    }
  }

  async deleteMenuConfig(id: number): Promise<boolean> {
    try {
      await this.menuConfigRepository.update(id, { active: false });
      return true;
    } catch (error) {
      this.logger.error(`Erro ao desativar configuração do menu ${id}:`, error);
      return false;
    }
  }

  async reorderMenuItems(updates: { id: number; section_order?: number; item_order?: number }[]): Promise<boolean> {
    try {
      for (const update of updates) {
        await this.menuConfigRepository.update(update.id, {
          section_order: update.section_order,
          item_order: update.item_order
        });
      }
      return true;
    } catch (error) {
      this.logger.error('Erro ao reordenar itens do menu:', error);
      return false;
    }
  }

  async resetToDefault(): Promise<boolean> {
    try {
      // Desativar todas as configurações atuais
      await this.menuConfigRepository.update({}, { active: false });

      // Inserir configurações padrão
      const defaultConfigs = this.getDefaultMenuConfigs();
      await this.menuConfigRepository.save(defaultConfigs);

      return true;
    } catch (error) {
      this.logger.error('Erro ao resetar menu para padrão:', error);
      return false;
    }
  }

  private getDefaultMenuSections(): MenuSection[] {
    return [
      {
        title: '⚡ Ações Rápidas',
        rows: [
          { id: 'MENU_TABELAS_CLASSIFICACAO', title: '📊 Tabelas de Classificação', description: 'Ver classificação das competições' },
          { id: 'CMD_JOGOS_HOJE', title: '📅 Jogos de Hoje', description: 'Todos os jogos de hoje' },
          { id: 'CMD_JOGOS_AMANHA', title: '📆 Jogos de Amanhã', description: 'Todos os jogos de amanhã' },
          { id: 'CMD_JOGOS_SEMANA', title: '🗓️ Jogos da Semana', description: 'Jogos desta semana' }
        ]
      },
      {
        title: '⚽ Informações de Partidas',
        rows: [
          { id: 'CMD_PROXIMOS_JOGOS', title: '⚽ Próximos Jogos', description: 'Próximo jogo de um time' },
          { id: 'CMD_ULTIMO_JOGO', title: '🏁 Últimos Jogos', description: 'Últimos 3 jogos de um time' },
          { id: 'CMD_TRANSMISSAO', title: '📺 Transmissão', description: 'Onde passa o jogo de um time' }
        ]
      },
      {
        title: '👥 Times, Jogadores e Estádios',
        rows: [
          { id: 'CMD_INFO_TIME', title: 'ℹ️ Informações do Time', description: 'Dados gerais de um time' },
          { id: 'CMD_ELENCO_TIME', title: '👥 Elenco do Time', description: 'Ver elenco de um time' },
          { id: 'CMD_INFO_JOGADOR', title: '👤 Informações do Jogador', description: 'Dados de um jogador' },
          { id: 'CMD_POSICAO_TIME', title: '📍 Posição na Tabela', description: 'Posição do time na competição' },
          { id: 'CMD_ESTATISTICAS_TIME', title: '📈 Estatísticas do Time', description: 'Estatísticas detalhadas de um time' },
          { id: 'CMD_ESTADIOS', title: '🏟️ Estádios', description: 'Informações sobre estádios' }
        ]
      },
      {
        title: '🏆 Competições e Outros',
        rows: [
          { id: 'CMD_ARTILHEIROS', title: '🥇 Artilheiros', description: 'Maiores goleadores de uma competição' },
          { id: 'CMD_CANAIS', title: '📡 Canais', description: 'Canais de transmissão' },
          { id: 'CMD_INFO_COMPETICOES', title: '🏆 Informações de Competições', description: 'Dados gerais de uma competição' }
        ]
      }
    ];
  }

  private getDefaultMenuConfigs(): Partial<WhatsAppMenuConfig>[] {
    return [
      // Seção 1: Ações Rápidas
      { section_id: 'acoes_rapidas', section_title: '⚡ Ações Rápidas', section_order: 1, item_id: 'MENU_TABELAS_CLASSIFICACAO', item_title: '📊 Tabelas de Classificação', item_description: 'Ver classificação das competições', item_order: 1 },
      { section_id: 'acoes_rapidas', section_title: '⚡ Ações Rápidas', section_order: 1, item_id: 'CMD_JOGOS_HOJE', item_title: '📅 Jogos de Hoje', item_description: 'Todos os jogos de hoje', item_order: 2 },
      { section_id: 'acoes_rapidas', section_title: '⚡ Ações Rápidas', section_order: 1, item_id: 'CMD_JOGOS_AMANHA', item_title: '📆 Jogos de Amanhã', item_description: 'Todos os jogos de amanhã', item_order: 3 },
      { section_id: 'acoes_rapidas', section_title: '⚡ Ações Rápidas', section_order: 1, item_id: 'CMD_JOGOS_SEMANA', item_title: '🗓️ Jogos da Semana', item_description: 'Jogos desta semana', item_order: 4 },
      
      // Seção 2: Informações de Partidas
      { section_id: 'informacoes_partidas', section_title: '⚽ Informações de Partidas', section_order: 2, item_id: 'CMD_PROXIMOS_JOGOS', item_title: '⚽ Próximos Jogos', item_description: 'Próximo jogo de um time', item_order: 1 },
      { section_id: 'informacoes_partidas', section_title: '⚽ Informações de Partidas', section_order: 2, item_id: 'CMD_ULTIMO_JOGO', item_title: '🏁 Últimos Jogos', item_description: 'Últimos 3 jogos de um time', item_order: 2 },
      { section_id: 'informacoes_partidas', section_title: '⚽ Informações de Partidas', section_order: 2, item_id: 'CMD_TRANSMISSAO', item_title: '📺 Transmissão', item_description: 'Onde passa o jogo de um time', item_order: 3 },
      
      // Seção 3: Times, Jogadores e Estádios
      { section_id: 'times_jogadores_estadios', section_title: '👥 Times, Jogadores e Estádios', section_order: 3, item_id: 'CMD_INFO_TIME', item_title: 'ℹ️ Informações do Time', item_description: 'Dados gerais de um time', item_order: 1 },
      { section_id: 'times_jogadores_estadios', section_title: '👥 Times, Jogadores e Estádios', section_order: 3, item_id: 'CMD_ELENCO_TIME', item_title: '👥 Elenco do Time', item_description: 'Ver elenco de um time', item_order: 2 },
      { section_id: 'times_jogadores_estadios', section_title: '👥 Times, Jogadores e Estádios', section_order: 3, item_id: 'CMD_INFO_JOGADOR', item_title: '👤 Informações do Jogador', item_description: 'Dados de um jogador', item_order: 3 },
      { section_id: 'times_jogadores_estadios', section_title: '👥 Times, Jogadores e Estádios', section_order: 3, item_id: 'CMD_POSICAO_TIME', item_title: '📍 Posição na Tabela', item_description: 'Posição do time na competição', item_order: 4 },
      { section_id: 'times_jogadores_estadios', section_title: '👥 Times, Jogadores e Estádios', section_order: 3, item_id: 'CMD_ESTATISTICAS_TIME', item_title: '📈 Estatísticas do Time', item_description: 'Estatísticas detalhadas de um time', item_order: 5 },
      { section_id: 'times_jogadores_estadios', section_title: '👥 Times, Jogadores e Estádios', section_order: 3, item_id: 'CMD_ESTADIOS', item_title: '🏟️ Estádios', item_description: 'Informações sobre estádios', item_order: 6 },
      
      // Seção 4: Competições e Outros
      { section_id: 'competicoes_outros', section_title: '🏆 Competições e Outros', section_order: 4, item_id: 'CMD_ARTILHEIROS', item_title: '🥇 Artilheiros', item_description: 'Maiores goleadores de uma competição', item_order: 1 },
      { section_id: 'competicoes_outros', section_title: '🏆 Competições e Outros', section_order: 4, item_id: 'CMD_CANAIS', item_title: '📡 Canais', item_description: 'Canais de transmissão', item_order: 2 },
      { section_id: 'competicoes_outros', section_title: '🏆 Competições e Outros', section_order: 4, item_id: 'CMD_INFO_COMPETICOES', item_title: '🏆 Informações de Competições', item_description: 'Dados gerais de uma competição', item_order: 3 }
    ];
  }
} 