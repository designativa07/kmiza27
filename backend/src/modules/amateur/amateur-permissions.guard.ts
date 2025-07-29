import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AmateurPermissionsGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new ForbiddenException('Token não fornecido');
    }

    try {
      const payload = this.jwtService.verify(token);
      
      // Verificar se o usuário tem role de amador ou admin
      if (payload.role !== 'amateur' && payload.role !== 'admin') {
        throw new ForbiddenException('Acesso negado. Apenas usuários amadores podem acessar este recurso.');
      }

      // Adicionar informações do usuário ao request
      request.user = payload;
      return true;
    } catch (error) {
      throw new ForbiddenException('Token inválido ou expirado');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
} 