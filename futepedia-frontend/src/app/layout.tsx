import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import ClientOnly from "@/components/ClientOnly";
import FutebotChat from "@/components/FutebotChat";
import { getApiUrl } from "@/lib/config";

const inter = Inter({ subsets: ["latin"] });

async function getFutepediaImageSettings() {
  try {
    const response = await fetch(`${getApiUrl()}/system-settings/futepedia-images`, { cache: 'no-store' });
    if (!response.ok) {
      console.error('Erro ao buscar configurações de imagens da Futepédia:', response.statusText);
      return { ogImageUrl: null };
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao carregar configurações de imagens da Futepédia:', error);
    return { ogImageUrl: null };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { ogImageUrl } = await getFutepediaImageSettings();

  return {
    title: "Kmiza27 Futepédia",
    description: "Acompanhe seus campeonatos favoritos em tempo real.",
    icons: {
      icon: "/favicon.ico",
    },
    openGraph: {
      images: ogImageUrl ? [ogImageUrl] : ['/kmiza27_logo30px.gif'], // Fallback para logo existente
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ErrorBoundary>
          {children}
          
          {/* Widget do Futebot - aparece em todas as páginas */}
          <ClientOnly>
            <FutebotChat 
              isWidget={true} 
              apiUrl={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'} 
            />
          </ClientOnly>
        </ErrorBoundary>
      </body>
    </html>
  );
}
