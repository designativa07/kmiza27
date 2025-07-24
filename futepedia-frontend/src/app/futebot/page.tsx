'use client';

import FutebotChat from '../../components/FutebotChat'

export default function FutebotPage() {
  return (
    <FutebotChat 
      isWidget={false} 
      apiUrl={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'} 
    />
  )
}

export const metadata = {
  title: 'Futebot - Chat de Futebol | Futepédia',
  description: 'Chat público do Futebot. Pergunte sobre jogos, times, classificações e muito mais sobre futebol brasileiro.',
} 