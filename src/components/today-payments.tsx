
'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Payment, PaymentStatus, Utility, Settings } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Printer, Sun, CheckCircle2 } from 'lucide-react';

interface TodayPaymentsProps {
  payments: Payment[];
  onAddReference: (paymentId: string, referenceNo: string) => void;
  onReprint: (payment: Payment) => void;
  settings: Settings;
}

const utilityColorMap: Record<Utility, string> = {
  LECO: 'bg-yellow-400 hover:bg-yellow-400/80 text-yellow-900',
  CEB: 'bg-red-800 hover:bg-red-800/80 text-white',
  Water: 'bg-blue-500 hover:bg-blue-500/80 text-white',
};

const statusColorMap: Record<PaymentStatus, string> = {
    Paid: 'bg-green-500 hover:bg-green-500/80 text-white',
    Pending: 'bg-orange-500 hover:bg-orange-500/80 text-white',
}

export function TodayPayments({ 
  payments,
  onAddReference,
  onReprint,
  settings
}: TodayPaymentsProps) {
  
  const [referenceInput, setReferenceInput] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setReferenceInput(''); // Reset input
    setIsDialogOpen(true);
  };
  
  const handleCompletePayment = () => {
    if (selectedPayment && referenceInput) {
      onAddReference(selectedPayment.id, referenceInput);
      setIsDialogOpen(false);
      setSelectedPayment(null);
    }
  };

  const handlePayClick = (utility: Utility) => {
    const paymentLink = settings.paymentLinks[utility];
    if (paymentLink) {
      window.open(paymentLink, '_blank');
    }
  };
  
  const dailyTotals = useMemo(() => {
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalServiceCharge = payments.reduce((sum, p) => sum + p.serviceCharge, 0);
    return { totalAmount, totalServiceCharge };
  }, [payments]);


  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Enter the reference number provided after successful payment to mark this transaction as 'Paid'.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reference-no" className="text-right">
                Reference No.
              </Label>
              <Input
                id="reference-no"
                value={referenceInput}
                onChange={(e) => setReferenceInput(e.target.value)}
                className="col-span-3"
                placeholder="Enter payment reference number"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleCompletePayment} disabled={!referenceInput}>Complete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <section>
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <Sun className="h-6 w-6 text-accent" />
                Today's Payments
              </CardTitle>
              {payments.length > 0 && (
                  <div className="text-sm text-muted-foreground space-y-1 mt-2 bg-muted p-2 rounded-md w-64">
                      <div className="flex justify-between">
                        <span>Bills Total:</span>
                        <span className="font-mono font-semibold">
                          LKR {dailyTotals.totalAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service Charges:</span>
                        <span className="font-mono font-semibold">
                          LKR {dailyTotals.totalServiceCharge.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-dashed border-foreground/20">
                        <span className='font-bold'>Grand Total:</span>
                        <span className="font-mono font-bold text-foreground">
                          LKR {(dailyTotals.totalAmount + dailyTotals.totalServiceCharge).toFixed(2)}
                        </span>
                      </div>
                    </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
              {payments.length > 0 ? (
                  <Table>
                      <TableHeader>
                      <TableRow>
                          <TableHead className="w-[80px]">User ID</TableHead>
                          <TableHead className="w-[120px]">Txn No.</TableHead>
                          <TableHead className="w-[100px]">Utility</TableHead>
                          <TableHead>Account No.</TableHead>
                          <TableHead className="text-right">Amount (LKR)</TableHead>
                          <TableHead>Reference No.</TableHead>
                          <TableHead className="w-[100px]">Status</TableHead>
                          <TableHead className="w-[200px]">Action</TableHead>
                      </TableRow>
                      </TableHeader>
                      <TableBody>
                      {payments.map((payment) => (
                          <TableRow key={payment.id}>
                          <TableCell>{payment.userId}</TableCell>
                          <TableCell>{payment.transactionNo}</TableCell>
                          <TableCell>
                              <Badge className={cn('border-transparent', utilityColorMap[payment.utility])}>{payment.utility}</Badge>
                          </TableCell>
                          <TableCell>{payment.accountNo}</TableCell>
                          <TableCell className="text-right font-mono">{payment.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 font-mono">
                                  {payment.referenceNo || '-'}
                              </div>
                          </TableCell>
                          <TableCell>
                              <Badge className={cn('border-transparent', statusColorMap[payment.status])}>{payment.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col items-stretch gap-2">
                                {payment.status === 'Paid' ? (
                                    <div className="flex items-center gap-2">
                                    <Button size="sm" variant="outline" className="h-8 flex-1" onClick={() => onReprint(payment)}>
                                        <Printer className="mr-2 h-4 w-4" />
                                        Reprint
                                    </Button>
                                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                                    </div>
                                ) : (
                                <>
                                    <div className="flex justify-between gap-2">
                                        <Button size="sm" variant="outline" className="h-8 flex-1 text-left justify-start" onClick={() => onReprint(payment)}>
                                            <Printer className="mr-2 h-4 w-4" />
                                            Reprint
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            className="h-8 flex-1" 
                                            onClick={() => handlePayClick(payment.utility)}
                                            style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }} 
                                            >
                                            Pay Now
                                        </Button>
                                    </div>
                                    <Button size="sm" className="h-8 w-full" onClick={() => handleOpenDialog(payment)}>
                                      Mark as Complete
                                    </Button>
                                </>
                                )}
                            </div>
                          </TableCell>
                          </TableRow>
                      ))}
                      </TableBody>
                  </Table>
              ) : (
                  <p className="text-center text-muted-foreground py-8">No payments made today. Make your first payment to see it here.</p>
              )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
