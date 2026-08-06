'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { LogoutManager, AuthState, LogoutResult } from '@/services/auth/logoutManager';

interface LogoutContextValue {
  isLoggingOut: boolean;
  authState: AuthState;
  logout: (options?: { redirectUrl?: string }) => Promise<LogoutResult>;
}

const LogoutContext = createContext<LogoutContextValue>({
  isLoggingOut: false,
  authState: 'initializing',
  logout: () => LogoutManager.executeLogout(),
});

export function LogoutProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>(LogoutManager.state);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(LogoutManager.isLoggingOut);

  useEffect(() => {
    // 1. Register SPA router navigator for zero-flicker transitions
    const unregisterNav = LogoutManager.setNavigator((url: string) => {
      router.replace(url);
    });

    // 2. Initialize cross-tab logout synchronization
    const unregisterSync = LogoutManager.initCrossTabLogoutSync();

    // 3. Subscribe to state machine transitions
    const unregisterState = LogoutManager.onStateChange((newState) => {
      setAuthState(newState);
      setIsLoggingOut(newState === 'logging_out');
    });

    return () => {
      unregisterNav();
      unregisterSync();
      unregisterState();
    };
  }, [router]);

  return (
    <LogoutContext.Provider
      value={{
        isLoggingOut,
        authState,
        logout: (options) => LogoutManager.executeLogout(options),
      }}
    >
      {children}
    </LogoutContext.Provider>
  );
}

export const useLogout = () => useContext(LogoutContext);
