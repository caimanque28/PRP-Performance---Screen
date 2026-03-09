import type { Metadata } from 'next';
import { Lexend } from 'next/font/google';
import './globals.css';

import { AuthProvider } from '@/components/AuthContext';

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
});

export const metadata: Metadata = {
  title: 'Portal de Avaliação Funcional',
  description: 'Sistema completo para avaliação física funcional e acompanhamento de performance de atletas.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${lexend.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
