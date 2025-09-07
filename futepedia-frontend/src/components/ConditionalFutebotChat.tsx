'use client';

import { usePathname } from 'next/navigation';
import FutebotChat from './FutebotChat';

export default function ConditionalFutebotChat() {
  const pathname = usePathname();
  
  // Não mostrar o chat nas páginas do Instagram
  const isInstagramPage = pathname?.includes('/instagram-card');
  
  if (isInstagramPage) {
    return null;
  }
  
  return (
    <FutebotChat 
      isWidget={true} 
      apiUrl={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'} 
    />
  );
}
