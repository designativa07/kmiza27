import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET || 'kmiza27_secret_key_admin';

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    // Para o usuário administrativo padrão
    if (username === 'admin_kmiza27' && password === 'admin@kmiza27') {
      return {
        id: 0,
        username: 'admin_kmiza27',
        is_admin: true,
        name: 'Administrador Kmiza27'
      };
    }

    // Buscar usuário no banco de dados
    const user = await this.userRepository.findOne({
      where: [
        { email: username },
        { phone_number: username }
      ]
    });

    if (user && user.is_admin && user.password_hash) {
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (isPasswordValid) {
        const { password_hash, ...result } = user;
        return result;
      }
    }

    return null;
  }

  async login(loginDto: { username: string; password: string }) {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { 
      username: user.username || user.email || user.phone_number, 
      sub: user.id,
      is_admin: user.is_admin
    };

    return {
      access_token: jwt.sign(payload, this.jwtSecret, { expiresIn: '24h' }),
      user: {
        id: user.id,
        username: user.username || user.email || user.phone_number,
        name: user.name,
        is_admin: user.is_admin
      }
    };
  }

  async verifyToken(token: string): Promise<any> {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  async createAdminUser(userData: {
    name: string;
    email?: string;
    phone_number?: string;
    password: string;
  }): Promise<User> {
    // Validações
    if (!userData.name?.trim()) {
      throw new BadRequestException('Nome é obrigatório');
    }

    if (!userData.password?.trim()) {
      throw new BadRequestException('Senha é obrigatória');
    }

    if (userData.password.length < 6) {
      throw new BadRequestException('Senha deve ter pelo menos 6 caracteres');
    }

    // Verificar se já existe um admin com este email ou telefone
    if (userData.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: userData.email }
      });
      if (existingEmail) {
        throw new BadRequestException('Email já está em uso');
      }
    }

    if (userData.phone_number) {
      const existingPhone = await this.userRepository.findOne({
        where: { phone_number: userData.phone_number }
      });
      if (existingPhone) {
        throw new BadRequestException('Telefone já está em uso');
      }
    }

    // Gerar hash da senha
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(userData.password, saltRounds);

    // Criar novo usuário admin
    const adminUser = this.userRepository.create({
      name: userData.name.trim(),
      email: userData.email?.trim(),
      phone_number: userData.phone_number?.trim(),
      password_hash,
      is_admin: true,
      is_active: true,
      preferences: {
        notifications: true,
        language: 'pt-BR'
      }
    });

    // Salvar no banco
    try {
      const savedUser = await this.userRepository.save(adminUser);
      const { password_hash: _, ...userWithoutPassword } = savedUser;
      return userWithoutPassword as User;
    } catch (error) {
      throw new BadRequestException('Erro ao criar administrador: ' + error.message);
    }
  }

  async updateAdminPassword(userId: number, newPassword: string): Promise<boolean> {
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    const result = await this.userRepository.update(userId, { password_hash });
    return (result.affected || 0) > 0;
  }
} 