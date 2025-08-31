
'use client';

import { LoginForm } from '@/components/login-form';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { Settings } from '@/lib/types';
import { DEFAULT_SETTINGS, getDefaultUsers } from '@/lib/config';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    // Attempt to load stored settings for theme/shop details, but always use default users
    const storedSettings = localStorage.getItem('billBuddySettings');
    let baseSettings = DEFAULT_SETTINGS;
    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings);
        baseSettings = { ...baseSettings, ...parsedSettings };
      } catch (e) {
        // Fallback to default if stored settings are corrupt
        baseSettings = DEFAULT_SETTINGS;
      }
    }
    
    // Crucially, always overwrite with default users to guarantee login is possible
    const finalSettings: Settings = {
      ...baseSettings,
      users: getDefaultUsers(),
    };
    setSettings(finalSettings);

  }, []);

  const handleLoginSuccess = (userRole: string) => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', userRole);
    // For Electron, useRouter.push('/') is preferred.
    // If that causes issues, window.location.href = './' is the fallback.
    router.push('/');
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
