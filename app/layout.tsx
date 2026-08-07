import type { Metadata } from 'next';
import './globals.css';
import './common.scss';
import { Roboto, Tenor_Sans } from 'next/font/google';
import { LogoutProvider } from '@/providers/LogoutProvider';
import { AuthProvider } from '@/context/AuthContext';
import { SpotRateProvider } from '@/context/SpotRateContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { NotificationProvider } from '@/context/NotificationContext';
import NotificationOverlay from '@/components/dashboard/NotificationOverlay';
import { Toaster } from 'react-hot-toast';

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
        <LogoutProvider>
          <AuthProvider>
            <NotificationProvider>
              <SpotRateProvider>
                <CurrencyProvider>
                  {children}
                  <NotificationOverlay />
                  <Toaster
                    position="top-center"
                    toastOptions={{
                      style: {
                        background: '#1e293b', // slate-800
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: 500,
                        borderRadius: '12px',
                        padding: '10px 16px',
                        boxShadow:
                          '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                      },
                      error: {
                        iconTheme: {
                          primary: '#ef4444',
                          secondary: '#fff',
                        },
                      },
                      success: {
                        iconTheme: {
                          primary: '#22c55e',
                          secondary: '#fff',
                        },
                      },
                    }}
                  />
                </CurrencyProvider>
              </SpotRateProvider>
            </NotificationProvider>
          </AuthProvider>
        </LogoutProvider>
      </body>
    </html>
  );
}
