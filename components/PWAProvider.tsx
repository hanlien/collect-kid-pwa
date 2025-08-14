'use client';

import { useEffect, createContext, useContext, useState } from 'react';

interface PWAContextType {
  isInstalled: boolean;
  canInstall: boolean;
  installPrompt: any;
  installApp: () => void;
}

const PWAContext = createContext<PWAContextType>({
  isInstalled: false,
  canInstall: false,
  installPrompt: null,
  installApp: () => {},
});

export const usePWA = () => useContext(PWAContext);

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInApp = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInApp);
    };

    checkInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setCanInstall(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setInstallPrompt(null);
    };

    // Force cache clear for design system update
    const forceUpdate = async () => {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        // Clear old caches
        await Promise.all(
          cacheNames
            .filter(name => name.includes('collect-kid') && !name.includes('v3'))
            .map(name => caches.delete(name))
        );
      }
    };
    
    forceUpdate();

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
          
          // Force immediate activation of new service worker
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (installPrompt) {
      const result = await installPrompt.prompt();
      if (result.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setInstallPrompt(null);
      setCanInstall(false);
    }
  };

  return (
    <PWAContext.Provider
      value={{
        isInstalled,
        canInstall,
        installPrompt,
        installApp,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}
