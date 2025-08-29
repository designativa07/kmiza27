import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotService } from '../src/chatbot/chatbot.service';
import { QueryAdapterService } from '../src/modules/ai-research/query-adapter.service';
import { AIResearchService } from '../src/modules/ai-research/ai-research.service';
import { OpenAIService } from '../src/chatbot/openai.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/entities/user.entity';
import { Team } from '../src/entities/team.entity';
import { Match } from '../src/entities/match.entity';
import { Competition } from '../src/entities/competition.entity';
import { CompetitionTeam } from '../src/entities/competition-team.entity';
import { MatchBroadcast } from '../src/entities/match-broadcast.entity';
import { Channel } from '../src/entities/channel.entity';
import { Round } from '../src/entities/round.entity';

describe('Chatbot Integration Tests', () => {
  let module: TestingModule;
  let chatbotService: ChatbotService;
  let queryAdapterService: QueryAdapterService;
  let aiResearchService: AIResearchService;
  let openAIService: OpenAIService;

  // Mock repositories
  let userRepository: Repository<User>;
  let teamRepository: Repository<Team>;
  let matchRepository: Repository<Match>;
  let competitionRepository: Repository<Competition>;
  let competitionTeamRepository: Repository<CompetitionTeam>;
  let matchBroadcastRepository: Repository<MatchBroadcast>;
  let channelRepository: Repository<Channel>;
  let roundRepository: Repository<Round>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotService,
        QueryAdapterService,
        AIResearchService,
        OpenAIService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Team),
          useValue: {
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              addOrderBy: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
              getOne: jest.fn(),
            })),
          },
        },
        {
          provide: getRepositoryToken(Match),
          useValue: {
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            })),
          },
        },
        {
          provide: getRepositoryToken(Competition),
          useValue: {
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              getOne: jest.fn(),
            })),
          },
        },
        {
          provide: getRepositoryToken(CompetitionTeam),
          useValue: {
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              addOrderBy: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            })),
          },
        },
        {
          provide: getRepositoryToken(MatchBroadcast),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnThis(),
          },
        },
        {
          provide: getRepositoryToken(Channel),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnThis(),
          },
        },
        {
          provide: getRepositoryToken(Round),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnThis(),
          },
        },
      ],
    }).compile();

    chatbotService = module.get<ChatbotService>(ChatbotService);
    queryAdapterService = module.get<QueryAdapterService>(QueryAdapterService);
    aiResearchService = module.get<AIResearchService>(AIResearchService);
    openAIService = module.get<OpenAIService>(OpenAIService);

    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    teamRepository = module.get<Repository<Team>>(getRepositoryToken(Team));
    matchRepository = module.get<Repository<Match>>(getRepositoryToken(Match));
    competitionRepository = module.get<Repository<Competition>>(getRepositoryToken(Competition));
    competitionTeamRepository = module.get<Repository<CompetitionTeam>>(getRepositoryToken(CompetitionTeam));
    matchBroadcastRepository = module.get<Repository<MatchBroadcast>>(getRepositoryToken(MatchBroadcast));
    channelRepository = module.get<Repository<Channel>>(getRepositoryToken(Channel));
    roundRepository = module.get<Repository<Round>>(getRepositoryToken(Round));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Query Adapter Service', () => {
    it('should detect broadcast_info intent for "onde vai passar"', async () => {
      const result = await queryAdapterService.adaptQueryToIntent('onde vai passar botafogo?');
      
      expect(result.adapted).toBe(true);
      expect(result.intent).toBe('broadcast_info');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should detect competition_info intent for "copa do brasil"', async () => {
      const result = await queryAdapterService.adaptQueryToIntent('copa do brasil');
      
      expect(result.adapted).toBe(true);
      expect(result.intent).toBe('competition_info');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should detect table intent for "tabela de classificação"', async () => {
      const result = await queryAdapterService.adaptQueryToIntent('tabela de classificação');
      
      expect(result.adapted).toBe(true);
      expect(result.intent).toBe('table');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should extract teams from broadcast questions', async () => {
      const teams = await queryAdapterService.extractTeamsWithAI('onde vai passar botafogo e bragantino?');
      
      expect(teams).toContain('botafogo');
      expect(teams).toContain('bragantino');
      expect(teams.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle single team extraction', async () => {
      const teams = await queryAdapterService.extractTeamsWithAI('onde vai passar o criciuma?');
      
      expect(teams).toContain('criciuma');
      expect(teams.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Competition Info System', () => {
    const mockCompetition = {
      id: 1,
      name: 'Copa do Brasil',
      slug: 'copa-do-brasil',
      season: '2025',
      country: 'Brasil',
      type: 'mata_mata',
      is_active: true,
    };

    const mockUpcomingMatches = [
      {
        id: 1,
        match_date: new Date('2025-09-10T19:00:00'),
        home_team: { name: 'Fluminense' },
        away_team: { name: 'Bahia' },
        round: { name: 'Quartas de Final' },
        broadcasts: [
          { channel: { name: 'Premiere' } },
          { channel: { name: 'SporTV' } },
        ],
      },
      {
        id: 2,
        match_date: new Date('2025-09-10T21:30:00'),
        home_team: { name: 'Corinthians' },
        away_team: { name: 'Athletico-PR' },
        round: { name: 'Quartas de Final' },
        broadcasts: [
          { channel: { name: 'Premiere' } },
          { channel: { name: 'SporTV' } },
          { channel: { name: 'Amazon Prime Video' } },
        ],
      },
    ];

    const mockTopTeams = [
      { team: { name: 'Internacional' }, points: 15, goals_for: 20, goals_against: 10 },
      { team: { name: 'CSA-AL' }, points: 12, goals_for: 18, goals_against: 12 },
      { team: { name: 'Maringá' }, points: 10, goals_for: 15, goals_against: 15 },
    ];

    const mockBottomTeams = [
      { team: { name: 'Internacional' }, points: 5, goals_for: 8, goals_against: 20 },
      { team: { name: 'CSA-AL' }, points: 4, goals_for: 6, goals_against: 22 },
      { team: { name: 'CRB-AL' }, points: 3, goals_for: 5, goals_against: 25 },
    ];

    beforeEach(() => {
      // Mock competition repository
      jest.spyOn(competitionRepository, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockCompetition),
      } as any);

      // Mock match repository
      jest.spyOn(matchRepository, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockUpcomingMatches),
      } as any);

      // Mock competition team repository
      jest.spyOn(competitionTeamRepository, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn()
          .mockResolvedValueOnce(mockTopTeams) // First call for top teams
          .mockResolvedValueOnce(mockBottomTeams), // Second call for bottom teams
      } as any);
    });

    it('should return complete competition info', async () => {
      const result = await chatbotService['getCompetitionInfo']('copa do brasil');
      
      expect(result).toContain('🏆 COPA DO BRASIL 🏆');
      expect(result).toContain('📅 Temporada: 2025');
      expect(result).toContain('📅 PRÓXIMOS JOGOS:');
      expect(result).toContain('📊 TOP 5 DA TABELA:');
      expect(result).toContain('⚠️ TIMES EM RISCO:');
      expect(result).toContain('📅 PRÓXIMA RODADA: Quartas de Final');
      expect(result).toContain('📱 Info completa: http://localhost:3001/copa-do-brasil/jogos');
    });

    it('should include upcoming matches with broadcast information', async () => {
      const result = await chatbotService['getCompetitionInfo']('copa do brasil');
      
      expect(result).toContain('📆 10/09 - 19:00');
      expect(result).toContain('🆚 Fluminense vs Bahia');
      expect(result).toContain('🏆 Quartas de Final');
      expect(result).toContain('📺 Premiere, SporTV');
      
      expect(result).toContain('📆 10/09 - 21:30');
      expect(result).toContain('🆚 Corinthians vs Athletico-PR');
      expect(result).toContain('📺 Premiere, SporTV, Amazon Prime Video');
    });

    it('should show top 5 teams in table', async () => {
      const result = await chatbotService['getCompetitionInfo']('copa do brasil');
      
      expect(result).toContain('🥇 Internacional');
      expect(result).toContain('🥈 CSA-AL');
      expect(result).toContain('🥉 Maringá');
      expect(result).toContain('📊 15 pts | 20⚽ | 10🥅');
    });

    it('should show teams at risk with visual indicators', async () => {
      const result = await chatbotService['getCompetitionInfo']('copa do brasil');
      
      expect(result).toContain('🔴 Internacional');
      expect(result).toContain('🟠 CSA-AL');
      expect(result).toContain('🟡 CRB-AL');
      expect(result).toContain('📊 5 pts | 8⚽ | 20🥅');
    });
  });

  describe('Confirmation System', () => {
    it('should detect confirmation messages', () => {
      const confirmations = ['sim', 'yes', 'claro', 'quero', 'queria', 'gostaria', 'pode ser', 'ok', 'beleza'];
      
      confirmations.forEach(confirmation => {
        const result = chatbotService['isConfirmationForCompetitionGames'](confirmation);
        expect(result).toBe(true);
      });
    });

    it('should reject non-confirmation messages', () => {
      const nonConfirmations = ['não', 'nope', 'talvez', 'depois', 'teste', 'oi'];
      
      nonConfirmations.forEach(message => {
        const result = chatbotService['isConfirmationForCompetitionGames'](message);
        expect(result).toBe(false);
      });
    });
  });

  describe('Team Extraction Intelligence', () => {
    it('should extract teams from complex questions', async () => {
      const teams = await queryAdapterService['extractTeamsIntelligently']('onde vai passar botafogo e bragantino?');
      
      expect(teams).toContain('botafogo');
      expect(teams).toContain('bragantino');
    });

    it('should handle single team questions', async () => {
      const teams = await queryAdapterService['extractTeamsIntelligently']('onde vai passar o criciuma?');
      
      expect(teams).toContain('criciuma');
    });

    it('should filter out common words', async () => {
      const teams = await queryAdapterService['extractTeamsIntelligently']('onde vai passar o flamengo hoje?');
      
      expect(teams).toContain('flamengo');
      expect(teams).not.toContain('hoje');
      expect(teams).not.toContain('onde');
      expect(teams).not.toContain('vai');
      expect(teams).not.toContain('passar');
    });

    it('should handle multiple teams with "x" separator', async () => {
      const teams = await queryAdapterService['extractTeamsIntelligently']('onde assistir santos x corinthians?');
      
      expect(teams).toContain('santos');
      expect(teams).toContain('corinthians');
    });
  });

  describe('Slug System', () => {
    it('should use competition slug from database', async () => {
      const mockCompetition = {
        id: 1,
        name: 'Brasileirão Série A',
        slug: 'brasileiro-serie-a',
        season: '2025',
        country: 'Brasil',
        type: 'pontos_corridos',
        is_active: true,
      };

      jest.spyOn(competitionRepository, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockCompetition),
      } as any);

      const result = await chatbotService['getCompetitionInfo']('brasileirao');
      
      expect(result).toContain('📱 Info completa: http://localhost:3001/brasileiro-serie-a/jogos');
    });
  });

  describe('Integration Flow', () => {
    it('should handle complete flow: question → info → confirmation → games', async () => {
      // Mock OpenAI service
      jest.spyOn(openAIService, 'analyzeMessage').mockResolvedValue({
        intent: 'competition_info',
        confidence: 0.8,
        team: null,
        homeTeam: null,
        awayTeam: null,
        competition: 'copa do brasil',
      });

      // Mock Query Adapter
      jest.spyOn(queryAdapterService, 'adaptQueryToIntent').mockResolvedValue({
        adapted: true,
        intent: 'competition_info',
        confidence: 0.9,
        reasoning: 'Padrão de competição detectado',
      });

      // Mock competition info
      const mockCompetition = {
        id: 1,
        name: 'Copa do Brasil',
        slug: 'copa-do-brasil',
        season: '2025',
        country: 'Brasil',
        type: 'mata_mata',
        is_active: true,
      };

      jest.spyOn(competitionRepository, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockCompetition),
      } as any);

      // Mock empty matches for this test
      jest.spyOn(matchRepository, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      } as any);

      jest.spyOn(competitionTeamRepository, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      } as any);

      // Test the complete flow
      const response1 = await chatbotService.processMessage('copa do brasil', '123456789', 'site');
      
      expect(response1).toContain('🏆 COPA DO BRASIL 🏆');
      expect(response1).toContain('🔍 Quer saber mais sobre jogos específicos desta competição?');

      // Now test confirmation
      const response2 = await chatbotService.processMessage('sim', '123456789', 'site');
      
      // Should show games or fallback message
      expect(response2).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle competition not found gracefully', async () => {
      jest.spyOn(competitionRepository, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      } as any);

      const result = await chatbotService['getCompetitionInfo']('competicao inexistente');
      
      expect(result).toContain('❌ Competição "competicao inexistente" não encontrada.');
    });

    it('should handle database errors gracefully', async () => {
      jest.spyOn(competitionRepository, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockRejectedValue(new Error('Database connection failed')),
      } as any);

      const result = await chatbotService['getCompetitionInfo']('copa do brasil');
      
      expect(result).toContain('❌ Erro ao buscar informações da competição.');
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent requests', async () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          queryAdapterService.adaptQueryToIntent(`teste ${i} onde vai passar flamengo`)
        );
      }

      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(typeof result.adapted).toBe('boolean');
      });
    });

    it('should extract teams efficiently', async () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        await queryAdapterService['extractTeamsIntelligently']('onde vai passar botafogo e bragantino?');
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete 100 extractions in less than 1 second
      expect(duration).toBeLessThan(1000);
    });
  });
});
