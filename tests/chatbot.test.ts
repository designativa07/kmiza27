import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotService } from '../backend/src/chatbot/chatbot.service';
import { DatabaseService } from '../backend/src/database/database.service';

describe('ChatbotService', () => {
  let service: ChatbotService;
  let databaseService: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotService,
        {
          provide: DatabaseService,
          useValue: {
            query: jest.fn(),
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ChatbotService>(ChatbotService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  describe('processMessage', () => {
    it('deve processar mensagem de estatísticas corretamente', async () => {
      const mockStats = {
        team: 'Flamengo',
        goals: 45,
        position: 1,
      };

      jest.spyOn(databaseService, 'query').mockResolvedValue([mockStats]);

      const result = await service.processMessage('estatísticas do Flamengo');

      expect(result).toContain('Flamengo');
      expect(result).toContain('45 gols');
      expect(result).toContain('1ª posição');
    });

    it('deve retornar mensagem de erro para time não encontrado', async () => {
      jest.spyOn(databaseService, 'query').mockResolvedValue([]);

      const result = await service.processMessage('estatísticas do TimeInexistente');

      expect(result).toContain('não encontrei informações');
    });

    it('deve processar mensagem de próximos jogos', async () => {
      const mockGames = [
        {
          homeTeam: 'Flamengo',
          awayTeam: 'Vasco',
          date: '2024-03-20',
          time: '20:00',
        },
      ];

      jest.spyOn(databaseService, 'query').mockResolvedValue(mockGames);

      const result = await service.processMessage('próximos jogos do Flamengo');

      expect(result).toContain('Flamengo');
      expect(result).toContain('Vasco');
      expect(result).toContain('20:00');
    });
  });

  describe('validateInput', () => {
    it('deve validar input corretamente', () => {
      const validInput = 'estatísticas do Flamengo';
      expect(service.validateInput(validInput)).toBe(true);
    });

    it('deve rejeitar input muito curto', () => {
      const invalidInput = 'oi';
      expect(service.validateInput(invalidInput)).toBe(false);
    });

    it('deve rejeitar input com caracteres inválidos', () => {
      const invalidInput = 'estatísticas do Flamengo!!!';
      expect(service.validateInput(invalidInput)).toBe(false);
    });
  });
}); 