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