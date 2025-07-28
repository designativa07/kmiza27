import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AmateurPermissionsGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    console.log('=== GUARD: AmateurPermissionsGuard INICIADO ===');
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    console.log('Guard: Token extraído:', token ? 'SIM' : 'NÃO');
    
    if (!token) {
      console.log('Guard: Token não fornecido - bloqueando');
      throw new ForbiddenException('Token não fornecido');
    }

    try {
      const payload = this.jwtService.verify(token);
      console.log('Guard: Token verificado, payload:', payload);
      
      // Verificar se o usuário tem role de amador ou admin
      if (payload.role !== 'amateur' && payload.role !== 'admin') {
        console.log('Guard: Role inválida - bloqueando');
        throw new ForbiddenException('Acesso negado. Apenas usuários amadores podem acessar este recurso.');
      }

      // Adicionar informações do usuário ao request
      request.user = payload;
      console.log('Guard: Acesso permitido');
      console.log('=== GUARD: AmateurPermissionsGuard FINALIZADO ===');
      return true;
    } catch (error) {
      console.log('Guard: Erro na verificação:', error.message);
      throw new ForbiddenException('Token inválido ou expirado');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
} 