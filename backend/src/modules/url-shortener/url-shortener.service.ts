import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { shlinkConfig } from '../../config/shlink.config';

export interface CreateShortUrlDto {
  longUrl: string;
  customSlug?: string;
  title?: string;
  tags?: string[];
  findIfExists?: boolean;
  validateUrl?: boolean;
  forwardQuery?: boolean;
}

export interface ShortUrlResponse {
  shortCode: string;
  shortUrl: string;
  longUrl: string;
  title?: string;
  tags?: string[];
  meta?: {
    validSince?: string;
    validUntil?: string;
    maxVisits?: number;
  };
  domain?: string;
  dateCreated: string;
  visitsCount: number;
}

export interface ShlinkApiResponse {
  shortUrl: ShortUrlResponse;
}

@Injectable()
export class UrlShortenerService {
  private readonly logger = new Logger(UrlShortenerService.name);

  constructor() {
    if (!shlinkConfig.isValid()) {
      this.logger.error('❌ Configurações do Shlink inválidas - serviço desabilitado');
    } else {
      this.logger.log('✅ Serviço URL Shortener inicializado');
    }
  }

  /**
   * Cria uma URL curta no Shlink
   */
  async createShortUrl(dto: CreateShortUrlDto): Promise<ShortUrlResponse> {
    if (!shlinkConfig.isValid()) {
      throw new HttpException('Shlink não configurado', HttpStatus.SERVICE_UNAVAILABLE);
    }

    try {
      this.logger.log(`🔗 Criando URL curta para: ${dto.longUrl}`);

      const requestBody = {
        longUrl: dto.longUrl,
        customSlug: dto.customSlug,
        title: dto.title,
        tags: dto.tags || shlinkConfig.defaults.tags,
        findIfExists: dto.findIfExists ?? shlinkConfig.defaults.findIfExists,
        validateUrl: dto.validateUrl ?? shlinkConfig.defaults.validateUrl,
        forwardQuery: dto.forwardQuery ?? shlinkConfig.defaults.forwardQuery,
      };

      const response = await fetch(shlinkConfig.getEndpointUrl(shlinkConfig.endpoints.createShortUrl), {
        method: 'POST',
        headers: shlinkConfig.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.text();
        this.logger.error(`❌ Erro ao criar URL curta: ${response.status} - ${errorData}`);
        throw new HttpException('Erro ao criar URL curta', HttpStatus.BAD_REQUEST);
      }

      const data: ShortUrlResponse = await response.json();
      this.logger.log(`🔍 DEBUG (UrlShortenerService): Resposta completa da API Shlink: ${JSON.stringify(data)}`);
      this.logger.log(`✅ URL curta criada: ${data.shortUrl}`);
      
      return data;
    } catch (error) {
      this.logger.error(`❌ Erro ao criar URL curta: ${error.message}`);
      throw new HttpException('Erro interno ao criar URL curta', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Cria URL curta para jogos de hoje
   */
  async createTodayMatchesShortUrl(): Promise<string> {
    const longUrl = 'https://futepedia.kmiza27.com/jogos-hoje';
    const customSlug = shlinkConfig.slugPatterns.today;
    const title = '📅 Jogos de Hoje - Futepédia';

    const shortUrlResponse = await this.createShortUrl({
      longUrl,
      customSlug,
      title,
      tags: ['jogos-hoje', 'futepedia', 'kmiza27-bot'],
    });

    return shortUrlResponse.shortUrl;
  }

  /**
   * Cria URL curta para jogos da semana
   */
  async createWeekMatchesShortUrl(): Promise<string> {
    const longUrl = 'https://futepedia.kmiza27.com/jogos-semana';
    const customSlug = shlinkConfig.slugPatterns.week;
    const title = '📅 Jogos da Semana - Futepédia';

    const shortUrlResponse = await this.createShortUrl({
      longUrl,
      customSlug,
      title,
      tags: ['jogos-semana', 'futepedia', 'kmiza27-bot'],
    });

    return shortUrlResponse.shortUrl;
  }

  /**
   * Cria URL curta para jogos com padrão específico
   */
  async createMatchShortUrl(matchId: number, homeTeam: string, awayTeam: string): Promise<string> {
    const baseUrl = process.env.FUTEPEDIA_URL || 'https://futepedia.kmiza27.com';
    const longUrl = `${baseUrl}/jogos/${matchId}`;
    
    // Criar slug personalizado para o jogo
    const customSlug = `${shlinkConfig.slugPatterns.match}-${matchId}`;
    const title = `${homeTeam} vs ${awayTeam}`;

    const shortUrlResponse = await this.createShortUrl({
      longUrl,
      customSlug,
      title,
      tags: ['jogo', 'partida', 'kmiza27-bot'],
    });

    return shortUrlResponse.shortUrl;
  }

  /**
   * Cria URL curta para transmissões ao vivo
   */
  async createStreamShortUrl(streamUrl: string, matchTitle: string): Promise<string> {
    const customSlug = `${shlinkConfig.slugPatterns.stream}-${Date.now()}`;
    const title = `🔴 AO VIVO: ${matchTitle}`;

    const shortUrlResponse = await this.createShortUrl({
      longUrl: streamUrl,
      customSlug,
      title,
      tags: ['transmissao', 'ao-vivo', 'kmiza27-bot'],
    });

    return shortUrlResponse.shortUrl;
  }

  /**
   * Cria URL curta para times
   */
  async createTeamShortUrl(teamId: number, teamName: string): Promise<string> {
    const baseUrl = process.env.FUTEPEDIA_URL || 'https://futepedia.kmiza27.com';
    const longUrl = `${baseUrl}/times/${teamId}`;
    
    const customSlug = `${shlinkConfig.slugPatterns.team}-${teamId}`;
    const title = `⚽ ${teamName}`;

    const shortUrlResponse = await this.createShortUrl({
      longUrl,
      customSlug,
      title,
      tags: ['time', 'equipe', 'kmiza27-bot'],
    });

    return shortUrlResponse.shortUrl;
  }

  /**
   * Cria URL curta para competições
   */
  async createCompetitionShortUrl(competitionSlug: string, competitionName: string): Promise<string> {
    const baseUrl = process.env.FUTEPEDIA_URL || 'https://futepedia.kmiza27.com';
    const longUrl = `${baseUrl}/${competitionSlug}`;
    
    const customSlug = `${shlinkConfig.slugPatterns.competition}-${competitionSlug}`;
    const title = `🏆 ${competitionName}`;

    const shortUrlResponse = await this.createShortUrl({
      longUrl,
      customSlug,
      title,
      tags: ['competicao', 'campeonato', 'kmiza27-bot'],
    });

    return shortUrlResponse.shortUrl;
  }

  /**
   * Lista todas as URLs curtas
   */
  async getShortUrls(page: number = 1, itemsPerPage: number = 10): Promise<ShortUrlResponse[]> {
    if (!shlinkConfig.isValid()) {
      throw new HttpException('Shlink não configurado', HttpStatus.SERVICE_UNAVAILABLE);
    }

    try {
      const url = `${shlinkConfig.getEndpointUrl(shlinkConfig.endpoints.shortUrls)}?page=${page}&itemsPerPage=${itemsPerPage}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: shlinkConfig.getHeaders(),
      });

      if (!response.ok) {
        throw new HttpException('Erro ao buscar URLs curtas', HttpStatus.BAD_REQUEST);
      }

      const data = await response.json();
      return data.shortUrls?.data || [];
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar URLs curtas: ${error.message}`);
      throw new HttpException('Erro interno ao buscar URLs curtas', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Obter estatísticas de uma URL curta
   */
  async getShortUrlStats(shortCode: string): Promise<any> {
    if (!shlinkConfig.isValid()) {
      throw new HttpException('Shlink não configurado', HttpStatus.SERVICE_UNAVAILABLE);
    }

    try {
      const endpoint = shlinkConfig.endpoints.shortUrlStats.replace('{shortCode}', shortCode);
      const response = await fetch(shlinkConfig.getEndpointUrl(endpoint), {
        method: 'GET',
        headers: shlinkConfig.getHeaders(),
      });

      if (!response.ok) {
        throw new HttpException('Erro ao buscar estatísticas', HttpStatus.BAD_REQUEST);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar estatísticas: ${error.message}`);
      throw new HttpException('Erro interno ao buscar estatísticas', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Verifica se o serviço está funcionando
   */
  async healthCheck(): Promise<boolean> {
    if (!shlinkConfig.isValid()) {
      return false;
    }

    try {
      const response = await fetch(shlinkConfig.getEndpointUrl(shlinkConfig.endpoints.shortUrls), {
        method: 'GET',
        headers: shlinkConfig.getHeaders(),
      });

      return response.ok;
    } catch (error) {
      this.logger.error(`❌ Health check falhou: ${error.message}`);
      return false;
    }
  }
}