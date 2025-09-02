
'use client';

import { LoginForm } from '@/components/login-form';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import type { Settings, User as AppUser } from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/config';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Check if a user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/');
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const storedSettings = localStorage.getItem('billBuddySettings');
    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings);
         const mergedSettings: Settings = {
          ...DEFAULT_SETTINGS,
          ...parsedSettings,
        };
        setSettings(mergedSettings);
      } catch (e) {
        setSettings(DEFAULT_SETTINGS);
      }
    } else {
        setSettings(DEFAULT_SETTINGS);
    }
  }, []);

  const handleLoginSuccess = async (email: string, password: string): Promise<string> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Find the user's role from settings
        const appUser = settings.users.find(u => u.username.toLowerCase() === email.toLowerCase());
        const userRole = appUser ? appUser.role : 'user';

        localStorage.setItem('userRole', userRole);

        toast({
            title: "Login Successful",
            description: "Welcome back!",
        });
        router.push('/');
        return userRole;
    } catch (error: any) {
        console.error("Firebase Auth Error:", error);
        let errorMessage = "An unknown error occurred during login.";
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                errorMessage = "Invalid email or password. Please try again.";
                break;
            case 'auth/invalid-email':
                errorMessage = "Please enter a valid email address.";
                break;
        }
        toast({
            variant: 'destructive',
            title: "Login Failed",
            description: errorMessage,
        });
        throw new Error(errorMessage);
    }
  };
  
  if (loading) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
  }

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
        <LoginForm onLoginSuccess={handleLoginSuccess} />
    </div>
    </div>
  );
}
