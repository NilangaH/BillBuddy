
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, DollarSign } from 'lucide-react';
import type { Payment, UtilityLogos, Settings } from '@/lib/types';
import { format } from 'date-fns';
import Image from 'next/image';

interface BillPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentData: Payment) => void;
  payment: Payment;
  logos: UtilityLogos;
  settings: Settings;
}

export function BillPreview({ isOpen, onClose, onConfirm, payment, logos, settings }: BillPreviewProps) {
  const [paidAmount, setPaidAmount] = useState<number | undefined>();
  
  const totalAmount = payment.amount + payment.serviceCharge;
  const balance = paidAmount !== undefined ? paidAmount - totalAmount : undefined;

  const handleConfirm = () => {
    const finalPayment = {
      ...payment,
      paidAmount: paidAmount,
    };
    onConfirm(finalPayment);
  };

  const handlePaidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.valueAsNumber;
    setPaidAmount(isNaN(value) ? undefined : value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        setPaidAmount(undefined); // Reset on close
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
             <Image
                src={logos[payment.utility]}
                alt={`${payment.utility} logo`}
                width={24}
                height={24}
                className="rounded-full"
              />
            <DialogTitle className="font-headline text-2xl">Payment Confirmation</DialogTitle>
          </div>
          <DialogDescription>
            Please review your bill details before printing the PDF.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="my-4 space-y-4 text-sm">
          {/* Bill details */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account Name:</span>
            <span className="font-medium">{payment.accountName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account Number:</span>
            <span className="font-medium">{payment.accountNo}</span>
          </div>
          <Separator />
          {/* Amount details */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bill Amount:</span>
            <span className="font-mono">LKR {payment.amount.toFixed(2)}</span>
          </div>
           <div className="flex justify-between">
            <span className="text-muted-foreground">Service Charge:</span>
            <span className="font-mono">LKR {payment.serviceCharge.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center text-lg">
            <span className="text-muted-foreground">Total to Pay:</span>
            <span className="font-bold font-headline text-primary">
              LKR {totalAmount.toFixed(2)}
            </span>
          </div>
          
          {/* Balance Calculator Section */}
          {settings.showBalanceCalculator && (
            <div className="space-y-4 pt-4 border-t border-dashed">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="paidAmount">Amount Paid (LKR)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="paidAmount"
                      type="number"
                      placeholder="e.g., 6000.00"
                      value={paidAmount ?? ''}
                      onChange={handlePaidAmountChange}
                      className="pl-10 font-mono"
                    />
                  </div>
                </div>
                {balance !== undefined && (
                  <div className="flex justify-between items-center text-lg">
                    <span className="text-muted-foreground">Balance to Return:</span>
                    <span className={`font-bold font-headline ${balance < 0 ? 'text-destructive' : 'text-green-600'}`}>
                      LKR {balance.toFixed(2)}
                    </span>
                  </div>
                )}
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center pt-2">
            Generated on {format(new Date(payment.date), "PPP, p")}
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button 
            onClick={handleConfirm} 
            style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }} 
            className="hover:opacity-90 w-full"
            disabled={settings.showBalanceCalculator && (paidAmount === undefined || (balance && balance < 0))}
          >
            <Printer className="mr-2 h-4 w-4"/>
            Confirm & Print PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
