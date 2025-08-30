
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Wallet, User, Hash, Phone, Droplets, Zap, Info } from 'lucide-react';
import { billSchema, type Utility, type Bill, type Payment, type UtilityLogos } from '@/lib/types';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface BillFormProps {
  utility: Utility;
  onSubmit: (data: Bill) => void;
  onBack: () => void;
  payments: Payment[];
  logos: UtilityLogos;
}

const utilityIcons = {
  LECO: <Zap className="h-6 w-6" />,
  CEB: <Zap className="h-6 w-6" />,
  Water: <Droplets className="h-6 w-6" />,
};

export function BillForm({ utility, onSubmit, onBack, payments, logos }: BillFormProps) {
  const [lastPayment, setLastPayment] = useState<Payment | null>(null);

  const dynamicBillSchema = useMemo(() => {
    return billSchema.superRefine((data, ctx) => {
      if (!data.accountNo) return;
      if (utility === 'LECO' || utility === 'CEB') {
        if (data.accountNo.length !== 10) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['accountNo'],
            message: 'Account number must be exactly 10 characters long.',
          });
        }
      } else if (utility === 'Water') {
        if (data.accountNo.length !== 12) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['accountNo'],
            message: 'Account number must be exactly 12 characters long.',
          });
        }
      }
    });
  }, [utility]);

  const form = useForm<Bill>({
    resolver: zodResolver(dynamicBillSchema),
    defaultValues: {
      phoneNo: '',
      accountNo: '',
      amount: '' as unknown as number,
      accountName: '',
    },
    mode: 'onTouched',
  });
  
  const handlePhoneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const phoneNo = e.target.value;
    // Reset last payment details if phone number is cleared or changed
    setLastPayment(null);
    form.setValue('accountName', '', { shouldValidate: false });
    form.setValue('accountNo', '', { shouldValidate: false });

    if (phoneNo && form.getFieldState('phoneNo').isDirty && !form.getFieldState('accountNo').isDirty && !form.getFieldState('accountName').isDirty) {
      // Find the most recent payment for this phone number AND utility
      const existingPayment = payments
        .filter(p => p.phoneNo === phoneNo && p.utility === utility)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      if (existingPayment) {
        // Automatically load details
        form.setValue('accountName', existingPayment.accountName, { shouldValidate: true });
        form.setValue('accountNo', existingPayment.accountNo, { shouldValidate: true });
        setLastPayment(existingPayment);
      }
    }
  };


  return (
    <>
      <Card className="w-full max-w-lg mx-auto shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
             <div className="flex-shrink-0">
              <Image
                src={logos[utility]}
                alt={`${utility} logo`}
                width={40}
                height={40}
                className="rounded-full"
              />
            </div>
            <div>
              <CardTitle className="font-headline text-2xl">Pay {utility} Bill</CardTitle>
              <CardDescription>Please fill in the details below.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="phoneNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                     <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input 
                          type="tel" 
                          placeholder="e.g., 0771234567" 
                          {...field} 
                          onBlur={handlePhoneBlur}
                          className="pl-10" 
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input
                          placeholder="e.g., 1234567890"
                          {...field}
                          className="pl-10"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="accountName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name</FormLabel>
                     <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input placeholder="e.g., John Doe" {...field} className="pl-10" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (LKR)</FormLabel>
                     <div className="relative">
                      <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 1500.00"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || '')}
                          className="pl-10"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {lastPayment && (
                <Alert variant="default" className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 !text-blue-600" />
                    <AlertDescription className="text-blue-700">
                      Last payment for this account was <span className="font-bold">LKR {lastPayment.amount.toFixed(2)}</span>.
                    </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={onBack}>
                <ArrowLeft />
                Back
              </Button>
              <Button type="submit" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }} className="hover:opacity-90">
                Preview Details
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </>
  );
}
