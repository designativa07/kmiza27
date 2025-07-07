import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

const sora = Sora({ 
  subsets: ["latin"],
  variable: '--font-sora',
});

export const metadata: Metadata = {
  title: "Kmiza27 Chatbot - Painel Administrativo",
  description: "Painel administrativo para gerenciar o chatbot de futebol Kmiza27",
  keywords: "chatbot, futebol, administração, kmiza27",
  authors: [{ name: "Kmiza27 Team" }],
  robots: "noindex, nofollow", // Não indexar páginas administrativas
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${sora.variable} font-sans antialiased`}>
        <AuthProvider>
          <ProtectedRoute>
            {children}
          </ProtectedRoute>
        </AuthProvider>
      </body>
    </html>
  );
}
