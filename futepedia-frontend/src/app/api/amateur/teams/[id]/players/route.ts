import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teamId = params.id;
    const token = request.headers.get('authorization');

    console.log('=== GET TEAM PLAYERS INICIADO ===');
    console.log('Team ID:', teamId);
    console.log('Token:', token);

    // Buscar jogadores do time no backend
    const response = await fetch(`${API_URL}/amateur/teams/${teamId}/players`, {
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json'
      }
    });

    console.log('Status da resposta:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Jogadores encontrados:', data);
      console.log('=== GET TEAM PLAYERS FINALIZADO ===');
      return NextResponse.json(data);
    } else {
      const errorData = await response.json();
      console.error('Erro na resposta:', errorData);
      console.log('=== GET TEAM PLAYERS FINALIZADO COM ERRO ===');
      return NextResponse.json(
        { message: errorData.message || 'Erro ao buscar jogadores do time' },
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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teamId = params.id;
    const token = request.headers.get('authorization');
    const body = await request.json();

    console.log('=== POST TEAM PLAYERS INICIADO ===');
    console.log('Team ID:', teamId);
    console.log('Dados recebidos:', body);

    // Salvar jogadores do time no backend
    const response = await fetch(`${API_URL}/amateur/teams/${teamId}/players`, {
      method: 'POST',
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    console.log('Status da resposta:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Jogadores salvos:', data);
      console.log('=== POST TEAM PLAYERS FINALIZADO ===');
      return NextResponse.json(data);
    } else {
      const errorData = await response.json();
      console.error('Erro na resposta:', errorData);
      console.log('=== POST TEAM PLAYERS FINALIZADO COM ERRO ===');
      return NextResponse.json(
        { message: errorData.message || 'Erro ao salvar jogadores do time' },
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