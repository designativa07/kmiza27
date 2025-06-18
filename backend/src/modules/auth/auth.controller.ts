import { Controller, Post, Body, Get, Headers, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { username: string; password: string }) {
    console.log('📨 AuthController.login recebeu:', {
      body: loginDto,
      username: loginDto?.username,
      password: loginDto?.password,
      usernameType: typeof loginDto?.username,
      passwordType: typeof loginDto?.password,
      bodyKeys: Object.keys(loginDto || {}),
      rawBody: JSON.stringify(loginDto)
    });
    
    // Validação direta e simples para debug
    const username = loginDto?.username?.toString().trim();
    const password = loginDto?.password?.toString().trim();
    
    console.log('🔍 Validação direta:', { username, password });
    
    // Verificação hardcoded direta
    if (username === 'admin_kmiza27' && password === 'admin@kmiza27') {
      console.log('✅ Login direto bem-sucedido!');
      return {
        access_token: 'debug_token_' + Date.now(),
        user: {
          id: 0,
          username: 'admin_kmiza27',
          name: 'Administrador Kmiza27',
          is_admin: true
        }
      };
    }
    
    // Credenciais alternativas para teste
    if (username === 'admin' && password === 'admin') {
      console.log('✅ Login alternativo bem-sucedido!');
      return {
        access_token: 'debug_token_' + Date.now(),
        user: {
          id: 0,
          username: 'admin',
          name: 'Administrador Kmiza27',
          is_admin: true
        }
      };
    }
    
    try {
      const result = await this.authService.login(loginDto);
      console.log('✅ Login bem-sucedido via service:', { userId: result.user.id, username: result.user.username });
      return result;
    } catch (error) {
      console.log('❌ Erro no login via service:', error.message);
      
      // Log detalhado do erro
      console.log('❌ Credenciais rejeitadas:', {
        receivedUsername: username,
        receivedPassword: password,
        expectedUsername: 'admin_kmiza27',
        expectedPassword: 'admin@kmiza27'
      });
      
      throw error;
    }
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