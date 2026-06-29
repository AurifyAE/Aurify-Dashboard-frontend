import type { Metadata } from 'next';
import './globals.css';
import './common.scss';
import { Roboto, Tenor_Sans } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import { SpotRateProvider } from '@/context/SpotRateContext';
import { CurrencyProvider } from '@/context/CurrencyContext';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const tenorSans = Tenor_Sans({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-tenor-sans',
});

export const metadata: Metadata = {
  title: 'Aurify Technologies',
  description: 'Modern super admin dashboard with comprehensive management tools',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`antialiased ${roboto.className} ${tenorSans.variable}`}>
        <AuthProvider>
          <SpotRateProvider>
            <CurrencyProvider>{children}</CurrencyProvider>
          </SpotRateProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
