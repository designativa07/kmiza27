import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    console.log('=== UPLOAD REQUEST START ===');
    console.log('Upload request received');
    const formData = await request.formData();
    console.log('FormData parsed successfully');
    
    // Verificar token de autorização
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    console.log('Auth header value:', authHeader?.substring(0, 20) + '...');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Unauthorized upload request');
      return NextResponse.json(
        { message: 'Token de autorização necessário' },
        { status: 401 }
      );
    }

    const backendUrl = `${API_BASE_URL}/upload/cloud`;
    console.log('Backend upload URL:', backendUrl);
    console.log('API_BASE_URL:', API_BASE_URL);
    
    console.log('Sending request to backend...');
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
      },
      body: formData,
    });

    console.log('Backend upload response status:', response.status);
    console.log('Backend response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend upload error:', errorData);
      return NextResponse.json(
        { message: errorData.message || 'Erro no upload' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Backend upload success:', data);
    console.log('=== UPLOAD REQUEST END ===');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Upload API route error:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao fazer upload da imagem',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
} 