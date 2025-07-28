import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');

    console.log('=== GET AMATEUR PLAYERS INICIADO ===');
    console.log('Token:', token);

    // Buscar todos os jogadores amadores no backend
    const response = await fetch(`${API_URL}/amateur/players`, {
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json'
      }
    });

    console.log('Status da resposta:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Jogadores encontrados:', data);
      console.log('=== GET AMATEUR PLAYERS FINALIZADO ===');
      return NextResponse.json(data);
    } else {
      const errorData = await response.json();
      console.error('Erro na resposta:', errorData);
      console.log('=== GET AMATEUR PLAYERS FINALIZADO COM ERRO ===');
      return NextResponse.json(
        { message: errorData.message || 'Erro ao buscar jogadores' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Erro de conexão:', error);
    return NextResponse.json(
      { message: 'Erro de conexão' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verificar token de autorização
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Token de autorização necessário' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_URL}/amateur/players`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { message: errorData.message || 'Erro ao criar jogador' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao criar jogador:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 