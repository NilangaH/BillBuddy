
'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, User as UserIcon, KeyRound, Fingerprint } from 'lucide-react';
import type { User } from '@/lib/types';


const loginSchema = z.object({
  username: z.string().min(1, 'Username is required.'),
  password: z.string().min(1, 'Password is required.'),
});
const licenseSchema = z.object({
  licenseKey: z.string().min(1, 'License key is required.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type LicenseFormValues = z.infer<typeof licenseSchema>;


interface LoginFormProps {
  onLoginSuccess?: (role: string) => void;
  users?: User[];
  onLicenseSubmit?: (key: string) => void;
  isLicenseFlow?: boolean;
}

export function LoginForm({ onLoginSuccess, users, onLicenseSubmit, isLicenseFlow = false }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const licenseForm = useForm<LicenseFormValues>({
    resolver: zodResolver(licenseSchema),
    defaultValues: {
      licenseKey: '',
    }
  });

  const onSubmit = (data: LoginFormValues) => {
    if (!onLoginSuccess || !users) return;

    const foundUser = users.find(
      (user) => user.username === data.username && user.password === data.password
    );

    if (foundUser) {
      setError(null);
      onLoginSuccess(foundUser.role);
    } else {
      setError('Invalid username or password. Please try again.');
    }
  };

  const onLicenseFormSubmit = (data: LicenseFormValues) => {
    if (onLicenseSubmit) {
      onLicenseSubmit(data.licenseKey);
    }
  };

  if (isLicenseFlow) {
    return (
      <Form {...licenseForm}>
        <form onSubmit={licenseForm.handleSubmit(onLicenseFormSubmit)}>
            <FormField
              control={licenseForm.control}
              name="licenseKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Key</FormLabel>
                  <div className="relative">
                    <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input placeholder="Enter license key" {...field} className="pl-10" />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
             <Button 
                type="submit" 
                className="w-full hover:opacity-90 mt-4"
                disabled={licenseForm.formState.isSubmitting}
            >
              {licenseForm.formState.isSubmitting ? 'Activating...' : 'Activate'}
            </Button>
        </form>
      </Form>
    )
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Welcome Back!</CardTitle>
        <CardDescription>Enter your credentials to access the app.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Login Failed</AlertTitle>
                    <AlertDescription>
                        {error}
                    </AlertDescription>
                </Alert>
            )}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input placeholder="admin" {...field} className="pl-10" />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input type="password" placeholder="password" {...field} className="pl-10" />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button 
                type="submit" 
                style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }} 
                className="w-full hover:opacity-90"
                disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
