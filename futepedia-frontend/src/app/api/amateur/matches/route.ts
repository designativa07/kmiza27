import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    // Verificar token de autorização
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Token de autorização necessário' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_URL}/amateur/matches`, {
      headers: {
        'Authorization': authHeader,
      }
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { message: 'Erro ao buscar jogos' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar jogos:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== API ROUTE: POST /api/amateur/matches INICIADO ===');
    const body = await request.json();
    console.log('Dados recebidos:', body);
    
    // Verificar token de autorização
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Token de autorização não fornecido');
      return NextResponse.json(
        { message: 'Token de autorização necessário' },
        { status: 401 }
      );
    }

    console.log('Enviando para backend:', `${API_URL}/amateur/matches`);
    const response = await fetch(`${API_URL}/amateur/matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    console.log('Status da resposta do backend:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro do backend:', errorData);
      return NextResponse.json(
        { message: errorData.message || 'Erro ao criar jogo' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Resposta de sucesso do backend:', data);
    console.log('=== API ROUTE: POST /api/amateur/matches FINALIZADO ===');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao criar jogo:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 