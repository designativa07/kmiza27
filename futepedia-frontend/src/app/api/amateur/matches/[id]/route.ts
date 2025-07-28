import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== GET MATCH REQUEST ===');
    console.log('Match ID:', params.id);
    
    // Verificar token de autorização
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Unauthorized request');
      return NextResponse.json(
        { message: 'Token de autorização necessário' },
        { status: 401 }
      );
    }

    const backendUrl = `${API_URL}/amateur/matches/${params.id}`;
    console.log('Backend URL:', backendUrl);
    
    const response = await fetch(backendUrl, {
      headers: {
        'Authorization': authHeader,
      }
    });
    
    console.log('Backend response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend error:', errorData);
      return NextResponse.json(
        { message: 'Erro ao buscar jogo' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Backend success:', data);
    console.log('=== GET MATCH REQUEST END ===');
    return NextResponse.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== API ROUTE: PATCH /api/amateur/matches/[id] INICIADO ===');
    console.log('ID do jogo:', params.id);
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

    console.log('Enviando para backend:', `${API_URL}/amateur/matches/${params.id}`);
    const response = await fetch(`${API_URL}/amateur/matches/${params.id}`, {
      method: 'PATCH',
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
        { message: errorData.message || 'Erro ao atualizar jogo' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Resposta de sucesso do backend:', data);
    console.log('=== API ROUTE: PATCH /api/amateur/matches/[id] FINALIZADO ===');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao atualizar jogo:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar token de autorização
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Token de autorização necessário' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_URL}/amateur/matches/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { message: errorData.message || 'Erro ao excluir jogo' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 