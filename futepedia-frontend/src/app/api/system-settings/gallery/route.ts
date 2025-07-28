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

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder');

    const params = new URLSearchParams();
    if (folder && folder !== 'all') {
      params.append('folder', folder);
    }

    const response = await fetch(`${API_URL}/upload/gallery?${params.toString()}`, {
      headers: {
        'Authorization': authHeader,
      }
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { message: 'Erro ao buscar imagens' },
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