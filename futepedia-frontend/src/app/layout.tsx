import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import ClientOnly from "@/components/ClientOnly";
import FutebotChat from "@/components/FutebotChat";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kmiza27 Futepédia",
  description: "Acompanhe seus campeonatos favoritos em tempo real.",
  icons: {
    icon: "/favicon.ico",
  },
};

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
