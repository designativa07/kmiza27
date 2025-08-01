import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/all`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar times');
    }

    const teams = await response.json();
    return NextResponse.json(teams);
  } catch (error) {
    console.error('Erro na API de times:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 