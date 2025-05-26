import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  async validateUser(username: string, password: string): Promise<any> {
    // Implementar validação de usuário
    return null;
  }

  async login(user: any) {
    // Implementar login
    return {
      access_token: 'token',
    };
  }
} 