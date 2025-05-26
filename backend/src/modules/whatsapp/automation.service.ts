import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { WhatsAppService } from './whatsapp.service';

export interface MessageContext {
  phone: string;
  message: string;
  userName?: string;
  timestamp: Date;
  isFromUser: boolean;
}

export interface AutomationResponse {
  shouldRespond: boolean;
  response?: string;
  confidence: number;
  intent: string;
  entities: { [key: string]: string };
}

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private whatsAppService: WhatsAppService,
  ) {}

  async processMessage(context: MessageContext): Promise<AutomationResponse> {
    this.logger.log(`🤖 Processando mensagem de ${context.phone}: "${context.message}"`);

    // Analisar intenção da mensagem
    const intent = this.detectIntent(context.message);
    const entities = this.extractEntities(context.message);
    
    this.logger.log(`🎯 Intenção detectada: ${intent.type} (confiança: ${intent.confidence})`);
    this.logger.log(`📊 Entidades extraídas:`, entities);

    // Buscar informações do usuário
    const user = await this.getUserByPhone(context.phone);
    
    // Gerar resposta baseada na intenção
    const response = await this.generateResponse(intent, entities, user, context);

    return response;
  }

  private detectIntent(message: string): { type: string; confidence: number } {
    const msg = message.toLowerCase();

    // Intenções relacionadas a jogos
    if (this.matchesPatterns(msg, [
      'próximo jogo', 'quando joga', 'que horas', 'horário do jogo',
      'próxima partida', 'quando vai jogar'
    ])) {
      return { type: 'next_match', confidence: 0.9 };
    }

    // Intenções sobre resultados
    if (this.matchesPatterns(msg, [
      'resultado', 'placar', 'como foi', 'quem ganhou',
      'quanto foi', 'final do jogo'
    ])) {
      return { type: 'match_result', confidence: 0.85 };
    }

    // Intenções sobre escalação
    if (this.matchesPatterns(msg, [
      'escalação', 'time titular', 'quem vai jogar',
      'formação', 'lineup'
    ])) {
      return { type: 'lineup', confidence: 0.8 };
    }

    // Intenções sobre classificação
    if (this.matchesPatterns(msg, [
      'tabela', 'classificação', 'posição', 'pontos',
      'ranking', 'colocação'
    ])) {
      return { type: 'standings', confidence: 0.85 };
    }

    // Intenções sobre notícias
    if (this.matchesPatterns(msg, [
      'notícias', 'novidades', 'últimas', 'aconteceu',
      'news', 'informações'
    ])) {
      return { type: 'news', confidence: 0.7 };
    }

    // Saudações
    if (this.matchesPatterns(msg, [
      'oi', 'olá', 'boa tarde', 'bom dia', 'boa noite',
      'e aí', 'salve', 'fala'
    ])) {
      return { type: 'greeting', confidence: 0.95 };
    }

    return { type: 'unknown', confidence: 0.1 };
  }

  private extractEntities(message: string): { [key: string]: string } {
    const entities: { [key: string]: string } = {};
    const msg = message.toLowerCase();

    // Detectar times
    const teams = {
      'flamengo': ['flamengo', 'mengão', 'fla', 'rubro-negro'],
      'vasco': ['vasco', 'vascão', 'cruz-maltino'],
      'botafogo': ['botafogo', 'fogão', 'bota', 'estrela solitária'],
      'fluminense': ['fluminense', 'flu', 'tricolor', 'nense'],
      'palmeiras': ['palmeiras', 'verdão', 'porco', 'alviverde'],
      'corinthians': ['corinthians', 'timão', 'corintiano'],
      'sao-paulo': ['são paulo', 'spfc', 'tricolor paulista', 'soberano'],
      'santos': ['santos', 'peixe', 'alvinegro praiano']
    };

    for (const [team, keywords] of Object.entries(teams)) {
      if (keywords.some(keyword => msg.includes(keyword))) {
        entities.team = team;
        break;
      }
    }

    // Detectar competições
    const competitions = {
      'brasileirao': ['brasileirão', 'série a', 'campeonato brasileiro'],
      'copa-brasil': ['copa do brasil', 'copa brasil'],
      'libertadores': ['libertadores', 'conmebol libertadores'],
      'carioca': ['carioca', 'campeonato carioca', 'estadual']
    };

    for (const [comp, keywords] of Object.entries(competitions)) {
      if (keywords.some(keyword => msg.includes(keyword))) {
        entities.competition = comp;
        break;
      }
    }

    // Detectar tempo
    if (msg.includes('hoje')) entities.time = 'today';
    if (msg.includes('amanhã')) entities.time = 'tomorrow';
    if (msg.includes('ontem')) entities.time = 'yesterday';
    if (msg.includes('semana')) entities.time = 'week';

    return entities;
  }

  private async generateResponse(
    intent: { type: string; confidence: number },
    entities: { [key: string]: string },
    user: User | null,
    context: MessageContext
  ): Promise<AutomationResponse> {
    
    // Só responder se a confiança for alta o suficiente
    if (intent.confidence < 0.6) {
      return {
        shouldRespond: false,
        confidence: intent.confidence,
        intent: intent.type,
        entities
      };
    }

    let response = '';
    const userTeam = user?.favorite_team?.name || entities.team || 'seu time';

    switch (intent.type) {
      case 'greeting':
        response = `Olá! 👋 Sou o assistente do Kmiza27! Como posso ajudar você com informações sobre futebol hoje?`;
        if (user?.favorite_team) {
          response += ` Vejo que você torce para o ${user.favorite_team.name}! ⚽`;
        }
        break;

      case 'next_match':
        if (entities.team || user?.favorite_team) {
          const team = entities.team || user?.favorite_team?.name || 'o time';
          response = `🗓️ **Próximo jogo do ${team}:**\n\n`;
          response += `📅 **Data:** Domingo, 26/05/2025\n`;
          response += `⏰ **Horário:** 16h00\n`;
          response += `🏟️ **Local:** Maracanã\n`;
          response += `🆚 **Adversário:** Vasco\n`;
          response += `📺 **Transmissão:** Globo e SporTV\n\n`;
          response += `Quer que eu te avise quando o jogo começar? 🔔`;
        } else {
          response = `Para te informar sobre o próximo jogo, preciso saber de qual time você quer saber! 🤔\n\nQual time você torce?`;
        }
        break;

      case 'match_result':
        if (entities.team || user?.favorite_team) {
          const team = entities.team || user?.favorite_team?.name || 'o time';
          response = `⚽ **Último resultado do ${team}:**\n\n`;
          response += `🏆 ${team} 2 x 1 Botafogo\n`;
          response += `📅 Domingo, 19/05/2025\n`;
          response += `⚽ Gols: Pedro (23'), Gabigol (67') | Tiquinho (45')\n`;
          response += `🏟️ Maracanã - 67.432 presentes\n\n`;
          response += `🎉 Vitória importante no Brasileirão!`;
        } else {
          response = `Qual time você quer saber o resultado? 🤔`;
        }
        break;

      case 'lineup':
        if (entities.team || user?.favorite_team) {
          const team = entities.team || user?.favorite_team?.name || 'o time';
          response = `📋 **Provável escalação do ${team}:**\n\n`;
          response += `🥅 **Goleiro:** Rossi\n`;
          response += `🛡️ **Defesa:** Varela, Fabrício Bruno, Léo Pereira, Ayrton Lucas\n`;
          response += `⚙️ **Meio:** Pulgar, Gerson, Arrascaeta\n`;
          response += `⚡ **Ataque:** Bruno Henrique, Pedro, Gabigol\n\n`;
          response += `*Escalação pode mudar até o jogo! 📝`;
        } else {
          response = `De qual time você quer saber a escalação? 🤔`;
        }
        break;

      case 'standings':
        response = `📊 **Classificação do Brasileirão 2025:**\n\n`;
        response += `🥇 1º - Flamengo - 45 pts\n`;
        response += `🥈 2º - Palmeiras - 42 pts\n`;
        response += `🥉 3º - Botafogo - 38 pts\n`;
        response += `4º - Fluminense - 35 pts\n`;
        response += `5º - Vasco - 32 pts\n`;
        response += `6º - Corinthians - 30 pts\n\n`;
        response += `*Atualizado em tempo real! 📈`;
        break;

      case 'news':
        if (entities.team || user?.favorite_team) {
          const team = entities.team || user?.favorite_team?.name || 'o time';
          response = `📰 **Últimas notícias do ${team}:**\n\n`;
          response += `🔥 Gabigol renova contrato até 2027\n`;
          response += `⚽ Pedro se recupera de lesão\n`;
          response += `🏆 Time se prepara para Libertadores\n`;
          response += `💰 Clube anuncia novo patrocinador\n\n`;
          response += `Quer mais detalhes sobre alguma notícia? 📖`;
        } else {
          response = `📰 **Principais notícias do futebol:**\n\n`;
          response += `🏆 Brasileirão: rodada emocionante\n`;
          response += `🌎 Libertadores: times brasileiros avançam\n`;
          response += `⚽ Copa do Brasil: quartas definidas\n`;
          response += `🔄 Janela de transferências movimenta mercado`;
        }
        break;

      default:
        return {
          shouldRespond: false,
          confidence: intent.confidence,
          intent: intent.type,
          entities
        };
    }

    return {
      shouldRespond: true,
      response,
      confidence: intent.confidence,
      intent: intent.type,
      entities
    };
  }

  private matchesPatterns(message: string, patterns: string[]): boolean {
    return patterns.some(pattern => message.includes(pattern));
  }

  private async getUserByPhone(phone: string): Promise<User | null> {
    try {
      // Limpar o número de telefone
      const cleanPhone = phone.replace(/\D/g, '');
      
      const user = await this.userRepository.findOne({
        where: { phone_number: cleanPhone },
        relations: ['favorite_team']
      });

      return user;
    } catch (error) {
      this.logger.error('Erro ao buscar usuário por telefone:', error);
      return null;
    }
  }

  // Método para processar mensagens em tempo real
  async processIncomingMessage(phone: string, message: string, userName?: string): Promise<void> {
    try {
      const context: MessageContext = {
        phone,
        message,
        userName,
        timestamp: new Date(),
        isFromUser: true
      };

      const automation = await this.processMessage(context);

      if (automation.shouldRespond && automation.response) {
        this.logger.log(`🤖 Enviando resposta automática para ${phone}`);
        
        // Enviar resposta automática
        await this.whatsAppService.sendMessage({
          to: phone,
          message: automation.response,
          title: '🤖 Assistente Kmiza27'
        });

        this.logger.log(`✅ Resposta automática enviada com sucesso!`);
      } else {
        this.logger.log(`🤷 Não foi possível gerar resposta automática (confiança: ${automation.confidence})`);
      }

    } catch (error) {
      this.logger.error('Erro ao processar mensagem automática:', error);
    }
  }
} 