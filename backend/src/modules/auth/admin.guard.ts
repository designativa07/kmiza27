import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

interface AuthenticatedUser {
  id: number;
  username: string;
  is_admin: boolean;
  role?: string;
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request['user'] as AuthenticatedUser;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    if (!user.is_admin) {
      throw new ForbiddenException('Acesso negado. Apenas administradores podem acessar este recurso.');
    }

    return true;
  }
}
