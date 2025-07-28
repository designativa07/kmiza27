import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const competitionId = params.id;
    const token = request.headers.get('authorization');

    console.log('=== GET COMPETITION TEAMS INICIADO ===');
    console.log('Competition ID:', competitionId);
    console.log('Token:', token);

    // Buscar times da competição no backend
    const response = await fetch(`${API_URL}/amateur/competitions/${competitionId}/teams`, {
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json'
      }
    });

    console.log('Status da resposta:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Times encontrados:', data);
      console.log('=== GET COMPETITION TEAMS FINALIZADO ===');
      return NextResponse.json(data);
    } else {
      const errorData = await response.json();
      console.error('Erro na resposta:', errorData);
      console.log('=== GET COMPETITION TEAMS FINALIZADO COM ERRO ===');
      return NextResponse.json(
        { message: errorData.message || 'Erro ao buscar times da competição' },
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
    const competitionId = params.id;
    const token = request.headers.get('authorization');
    const body = await request.json();

    console.log('=== POST COMPETITION TEAMS INICIADO ===');
    console.log('Competition ID:', competitionId);
    console.log('Dados recebidos:', body);

    // Salvar times da competição no backend
    const response = await fetch(`${API_URL}/amateur/competitions/${competitionId}/teams`, {
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
      console.log('Times salvos:', data);
      console.log('=== POST COMPETITION TEAMS FINALIZADO ===');
      return NextResponse.json(data);
    } else {
      const errorData = await response.json();
      console.error('Erro na resposta:', errorData);
      console.log('=== POST COMPETITION TEAMS FINALIZADO COM ERRO ===');
      return NextResponse.json(
        { message: errorData.message || 'Erro ao salvar times da competição' },
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