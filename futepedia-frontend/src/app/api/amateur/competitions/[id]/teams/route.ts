import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const competitionId = params.id;
    const token = request.headers.get('authorization');

    console.log('🔍 Buscando times para competição:', competitionId);
    console.log('Token presente:', !!token);

    // Buscar times da competição no backend
    const response = await fetch(`${API_URL}/amateur/competitions/${competitionId}/teams`, {
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json'
      }
    });

    console.log('Status da resposta do backend:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Dados recebidos do backend:', data.length, 'times');
      return NextResponse.json(data);
    } else {
      const errorData = await response.json();
      console.log('❌ Erro do backend:', errorData);
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

    // Salvar times da competição no backend
    const response = await fetch(`${API_URL}/amateur/competitions/${competitionId}/teams`, {
      method: 'POST',
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      const errorData = await response.json();
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