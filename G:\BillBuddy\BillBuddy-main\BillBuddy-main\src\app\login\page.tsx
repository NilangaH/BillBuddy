
'use client';

import { LoginForm } from '@/components/login-form';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import type { Settings } from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/config';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, ShieldCheck, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { differenceInDays, addDays } from 'date-fns';

const TRIAL_PERIOD_DAYS = 20;
const ACTIVATION_SUFFIX = '-NH19880529';

export default function LoginPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [activationStatus, setActivationStatus] = useState<'LOADING' | 'TRIAL' | 'EXPIRED' | 'ACTIVATED'>('LOADING');
  const [visitorId, setVisitorId] = useState<string>('');
  const [daysLeft, setDaysLeft] = useState(TRIAL_PERIOD_DAYS);
  const [showActivationForm, setShowActivationForm] = useState(false);
  const activationClicks = useRef(0);

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
    
    const checkActivation = async () => {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        const currentVisitorId = result.visitorId;
        setVisitorId(currentVisitorId);

        const activatedDeviceId = localStorage.getItem('billBuddyActivatedDevice');
        if (activatedDeviceId === `${currentVisitorId}${ACTIVATION_SUFFIX}`) {
          setActivationStatus('ACTIVATED');
          localStorage.setItem('isActivated', 'true');
          return;
        }
        localStorage.removeItem('isActivated');

        let trialStartDateStr = localStorage.getItem('billBuddyTrialStartDate');
        if (!trialStartDateStr) {
          trialStartDateStr = new Date().toISOString();
          localStorage.setItem('billBuddyTrialStartDate', trialStartDateStr);
        }

        const trialStartDate = new Date(trialStartDateStr);
        const daysSinceStart = differenceInDays(new Date(), trialStartDate);
        const remainingDays = Math.max(0, TRIAL_PERIOD_DAYS - daysSinceStart);
        setDaysLeft(remainingDays);

        if (remainingDays > 0) {
          setActivationStatus('TRIAL');
        } else {
          setActivationStatus('EXPIRED');
        }
      } catch (error) {
        console.error("FingerprintJS error:", error);
        setActivationStatus('EXPIRED'); 
      }
    };

    checkActivation();

  }, []);

  const handleLoginSuccess = (userRole: string) => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', userRole);
    if(activationStatus === 'TRIAL'){
       localStorage.setItem('isTrial', 'true');
    } else {
       localStorage.removeItem('isTrial');
    }
    // This is the corrected navigation call for Electron
    window.location.href = './';
  };

  const handleActivate = (licenseKey: string) => {
    if (licenseKey === `${visitorId}${ACTIVATION_SUFFIX}`) {
        localStorage.setItem('billBuddyActivatedDevice', licenseKey);
        setActivationStatus('ACTIVATED');
        setShowActivationForm(false);
        toast({
            title: "Activation Successful!",
            description: "Your application has been permanently activated.",
        });
    } else {
        toast({
            variant: 'destructive',
            title: "Activation Failed",
            description: "The license key is incorrect. Please try again.",
        });
    }
  };
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(visitorId);
    toast({
      title: "Copied to clipboard!",
      description: "Device ID has been copied successfully.",
    });
  };

  const handleTrialClick = () => {
    activationClicks.current += 1;
    if (activationClicks.current >= 5) {
        setShowActivationForm(true);
        activationClicks.current = 0; // Reset for next time
    }
  };


  if (activationStatus === 'LOADING') {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Verifying license...</p>
        </div>
      );
  }
  
  const renderTrialInfo = () => (
    <div className="text-center mb-4">
        <p 
            className="text-sm text-muted-foreground cursor-pointer"
            onClick={handleTrialClick}
        >
            You are on a trial version.
        </p>
        <p 
            className="text-lg font-bold text-primary cursor-pointer"
            onClick={handleTrialClick}
        >
            {daysLeft} days remaining
        </p>
    </div>
  );

  const renderActivationContent = () => (
    <div className="w-full max-w-md">
        <Card className="shadow-lg border-destructive">
            <CardHeader className="items-center text-center">
            <Clock className="h-12 w-12 text-destructive mb-4" />
            <CardTitle className="font-headline text-2xl text-destructive">
                {activationStatus === 'EXPIRED' ? 'Trial Expired' : 'Application Activation'}
            </CardTitle>
            <CardDescription>
                {activationStatus === 'EXPIRED' 
                ? 'Your trial has ended. Please activate your license to continue.'
                : 'Enter your license key below to activate the application.'
                }
            </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <div className="flex items-center justify-center gap-2 p-2 rounded-md bg-muted font-mono text-sm break-all">
                    <span>{visitorId}</span>
                </div>
                <Button onClick={handleCopyToClipboard} variant="outline" size="sm" className="mt-4">
                    <Copy className="mr-2" />
                    Copy Device ID
                </Button>
                
                 <div className="mt-6">
                    <LoginForm onLicenseSubmit={handleActivate} isLicenseFlow={true} />
                 </div>

                 {activationStatus !== 'EXPIRED' && (
                    <Button onClick={() => setShowActivationForm(false)} className="mt-6" variant="ghost">
                        Back to Login
                    </Button>
                )}
            </CardContent>
        </Card>
    </div>
  );


  const renderLoginContent = () => (
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
        {activationStatus === 'TRIAL' && renderTrialInfo()}
        <LoginForm onLoginSuccess={handleLoginSuccess} users={settings.users} />
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       {showActivationForm || activationStatus === 'EXPIRED' 
            ? renderActivationContent() 
            : renderLoginContent()
        }
    </div>
  );
}
