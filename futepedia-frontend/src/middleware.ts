import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Verificar se a rota é do painel amador
  if (request.nextUrl.pathname.startsWith('/admin-amadores')) {
    // Verificar se há token no localStorage (client-side)
    // Como middleware roda no servidor, vamos redirecionar para login
    // e deixar a verificação client-side
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin-amadores/:path*',
  ],
}; 