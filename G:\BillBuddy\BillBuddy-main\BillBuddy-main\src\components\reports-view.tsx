
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
import { format, isSameDay, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { HistoryFilters } from './history-filters';
import { Printer, ArrowLeft, CheckCircle2, Search } from 'lucide-react';

interface ReportsViewProps {
  allPayments: Payment[];
  onAddReference: (paymentId: string, referenceNo: string) => void;
  onReprint: (payment: Payment) => void;
  settings: Settings;
  onBack: () => void;
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

export function ReportsView({ 
  allPayments,
  onAddReference,
  onReprint,
  settings,
  onBack,
}: ReportsViewProps) {
  
  const [referenceInput, setReferenceInput] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<Utility | 'all'>('all');
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPayments = useMemo(() => {
    return allPayments.filter(payment => {
      const paymentDate = parseISO(payment.date);
      const typeMatch = filterType === 'all' || payment.utility === filterType;
      const dateMatch = !filterDate || isSameDay(paymentDate, filterDate);
      const monthMatch = selectedMonth === 'all' || format(paymentDate, 'yyyy-MM') === selectedMonth;
      
      const searchMatch = !searchTerm ||
        payment.transactionNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.accountNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.phoneNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.referenceNo && payment.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()));

      return typeMatch && dateMatch && monthMatch && searchMatch;
    });
  }, [allPayments, filterType, filterDate, selectedMonth, searchTerm]);
  
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
  
  const groupedPayments = useMemo(() => {
    const groups: { [key: string]: { payments: Payment[], totalAmount: number, totalServiceCharge: number } } = {};
    
    filteredPayments.forEach(payment => {
      const dateKey = format(new Date(payment.date), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = { payments: [], totalAmount: 0, totalServiceCharge: 0 };
      }
      groups[dateKey].payments.push(payment);
      groups[dateKey].totalAmount += payment.amount;
      groups[dateKey].totalServiceCharge += payment.serviceCharge;
    });
    
    return Object.entries(groups).sort((a,b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());

  }, [filteredPayments]);

  const monthlyTotals = useMemo(() => {
    if (selectedMonth === 'all') return null;

    const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalServiceCharge = filteredPayments.reduce((sum, p) => sum + p.serviceCharge, 0);

    return { totalAmount, totalServiceCharge };
  }, [filteredPayments, selectedMonth]);


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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={onBack}>
                  <ArrowLeft />
                </Button>
                <CardTitle className="font-headline text-2xl">Full Payment History</CardTitle>
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                <HistoryFilters
                  filterType={filterType}
                  setFilterType={setFilterType}
                  filterDate={filterDate}
                  setFilterDate={setFilterDate}
                  selectedMonth={selectedMonth}
                  setSelectedMonth={setSelectedMonth}
                  allPayments={allPayments}
                />
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-auto"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {monthlyTotals && selectedMonth !== 'all' && (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg font-headline">
                      Totals for {format(new Date(selectedMonth), 'MMMM yyyy')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Bills Total:</span>
                      <span className="font-mono font-semibold">
                        LKR {monthlyTotals.totalAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service Charges:</span>
                      <span className="font-mono font-semibold">
                        LKR {monthlyTotals.totalServiceCharge.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-dashed border-foreground/20 font-bold">
                      <span>Grand Total:</span>
                      <span className="font-mono text-foreground">
                        LKR {(monthlyTotals.totalAmount + monthlyTotals.totalServiceCharge).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
              {groupedPayments.length > 0 ? (
                  groupedPayments.map(([date, group]) => (
                    <div key={date}>
                      <div className="mb-2 p-2 rounded-md bg-muted">
                        <h3 className="font-headline text-lg font-semibold">{format(new Date(date), 'PPP')}</h3>
                        <div className="text-sm text-muted-foreground space-y-1 mt-2">
                          <div className="flex justify-between">
                            <span>Bills Total:</span>
                            <span className="font-mono font-semibold">
                              LKR {group.totalAmount.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Service Charges:</span>
                            <span className="font-mono font-semibold">
                              LKR {group.totalServiceCharge.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-dashed border-foreground/20">
                            <span className='font-bold'>Grand Total:</span>
                            <span className="font-mono font-bold text-foreground">
                              LKR {(group.totalAmount + group.totalServiceCharge).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
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
                          {group.payments.map((payment) => (
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
                    </div>
                  ))
              ) : (
                  <p className="text-center text-muted-foreground py-8">No payments found matching your filters.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

    