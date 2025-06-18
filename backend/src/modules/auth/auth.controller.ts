import { Controller, Post, Body, Get, Headers, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { username: string; password: string }) {
    // Autenticação apenas via banco de dados
    return await this.authService.login(loginDto);
  }

  @Post('verify')
  async verifyToken(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: false, message: 'Token não fornecido' };
    }

    const token = authHeader.substring(7);
    try {
      const decoded = await this.authService.verifyToken(token);
      return { valid: true, user: decoded };
    } catch (error) {
      return { valid: false, message: 'Token inválido' };
    }
  }

  @Post('create-admin')
  async createAdminUser(@Body() createAdminDto: {
    name: string;
    email?: string;
    phone_number?: string;
    password: string;
  }) {
    try {
      const user = await this.authService.createAdminUser(createAdminDto);
      const { password_hash, ...userWithoutPassword } = user;
      return {
        success: true,
        message: 'Usuário administrativo criado com sucesso',
        user: userWithoutPassword
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao criar usuário administrativo: ' + error.message
      };
    }
  }

  @Post('change-password')
  async changePassword(@Body() changePasswordDto: {
    userId: number;
    newPassword: string;
  }) {
    try {
      const success = await this.authService.updateAdminPassword(
        changePasswordDto.userId,
        changePasswordDto.newPassword
      );
      
      if (success) {
        return {
          success: true,
          message: 'Senha alterada com sucesso'
        };
      } else {
        return {
          success: false,
          message: 'Erro ao alterar senha'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao alterar senha: ' + error.message
      };
    }
  }
} 