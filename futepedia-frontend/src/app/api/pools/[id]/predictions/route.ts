import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const poolId = params.id;
    const authHeader = request.headers.get('authorization');
    const body = await request.json();
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Token de acesso não fornecido' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/pools/${poolId}/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Erro ao salvar palpite' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao salvar palpite:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}