import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Token de acesso não fornecido' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/users/profile/stats`, {
      headers: {
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Erro ao buscar estatísticas' },
        { status: response.status }
      );
    }

    const stats = await response.json();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}