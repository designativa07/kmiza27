import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { aliases } = await request.json();
    const teamId = params.id;

    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/aliases`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ aliases }),
    });

    if (!response.ok) {
      throw new Error('Erro ao atualizar aliases');
    }

    const updatedTeam = await response.json();
    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error('Erro ao atualizar aliases:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar aliases' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { alias } = await request.json();
    const teamId = params.id;

    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/aliases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ alias }),
    });

    if (!response.ok) {
      throw new Error('Erro ao adicionar alias');
    }

    const updatedTeam = await response.json();
    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error('Erro ao adicionar alias:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar alias' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; alias: string } }
) {
  try {
    const teamId = params.id;
    const alias = params.alias;

    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/aliases/${encodeURIComponent(alias)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Erro ao remover alias');
    }

    const updatedTeam = await response.json();
    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error('Erro ao remover alias:', error);
    return NextResponse.json(
      { error: 'Erro ao remover alias' },
      { status: 500 }
    );
  }
} 