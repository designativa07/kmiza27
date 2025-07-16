import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function GET() {
  try {
    const url = `${API_BASE_URL}/system-settings/futepedia-images`;
    console.log('🌐 Frontend API Proxy - GET:', { API_BASE_URL, url });
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Frontend API Proxy - Response:', { 
      status: response.status, 
      ok: response.ok,
      statusText: response.statusText 
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Frontend API Proxy - Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Frontend API Proxy - Data received:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Frontend API Proxy - Erro ao buscar configurações de imagens:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações de imagens' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${API_BASE_URL}/system-settings/futepedia-images`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao salvar configurações de imagens da Futepédia:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar configurações de imagens' },
      { status: 500 }
    );
  }
} 