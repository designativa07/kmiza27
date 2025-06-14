import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../backend/src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../backend/src/users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('login', () => {
    it('deve retornar um token JWT válido', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      };

      const mockToken = 'mock.jwt.token';

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('access_token', mockToken);
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('deve lançar erro para credenciais inválidas', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      await expect(
        service.login({
          email: 'invalid@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow('Credenciais inválidas');
    });
  });

  describe('validateUser', () => {
    it('deve validar usuário corretamente', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toBeDefined();
      expect(result.email).toBe(mockUser.email);
    });

    it('deve retornar null para usuário não encontrado', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password123');

      expect(result).toBeNull();
    });
  });
}); 