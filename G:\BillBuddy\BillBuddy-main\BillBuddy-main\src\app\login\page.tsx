
'use client';

import { LoginForm } from '@/components/login-form';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { Settings } from '@/lib/types';
import { DEFAULT_SETTINGS, getDefaultUsers } from '@/lib/config';

export default function LoginPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const storedSettings = localStorage.getItem('billBuddySettings');
    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings);
         const mergedSettings: Settings = {
          ...DEFAULT_SETTINGS,
          ...parsedSettings,
          // Always load default users to prevent login issues
          users: getDefaultUsers(), 
        };
        setSettings(mergedSettings);
      } catch (e) {
        setSettings(DEFAULT_SETTINGS);
      }
    } else {
        setSettings(DEFAULT_SETTINGS);
    }
  }, []);

  const handleLoginSuccess = (userRole: string) => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', userRole);
    // This is the corrected navigation call for Electron.
    window.location.href = './';
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <header className="mb-8 flex flex-col items-center text-center">
            <Image
            src={settings.shopDetails.logo}
            alt="Shop Logo"
            width={80}
            height={80}
            className="rounded-full mb-4"
            data-ai-hint="shop logo"
            />
            <div className="flex items-center gap-2">
                <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">
                    {settings.shopDetails.shopName}
                </h1>
            </div>
            <p className="text-muted-foreground mt-2">
            Please log in to continue.
            </p>
        </header>
        <LoginForm onLoginSuccess={handleLoginSuccess} users={settings.users} />
      </div>
    </div>
  );
}
