import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Futebot - Chat de Futebol | Futepédia',
  description: 'Chat público do Futebot. Pergunte sobre jogos, times, classificações e muito mais sobre futebol brasileiro.',
}

export default function FutebotLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 