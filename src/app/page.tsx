
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';
import { UtilitySelector } from '@/components/utility-selector';
import { BillForm } from '@/components/bill-form';
import { TodayPayments } from '@/components/today-payments';
import { ReportsView } from '@/components/reports-view';
import { BillPreview } from '@/components/bill-preview';
import { PrintableReceipt } from '@/components/printable-receipt';
import { SettingsDialog } from '@/components/settings-dialog';
import { Button } from '@/components/ui/button';
import type { Utility, Bill, Payment, Settings, UserRole } from '@/lib/types';
import { Settings as SettingsIcon, History, Loader2, LogOut } from 'lucide-react';
import { isToday, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { DEFAULT_SETTINGS } from '@/lib/config';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

function generateNewUserId(payments: Payment[]): string {
  if (!payments || payments.length === 0) return 'NH001';

  const existingIds = payments.map(p => p.userId);
  const numericIds = existingIds
    .filter(id => id && id.startsWith('NH'))
    .map(id => parseInt(id.substring(2), 10))
    .filter(id => !isNaN(id));

  const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
  const newIdNumber = maxId + 1;
  
  return `NH${String(newIdNumber).padStart(3, '0')}`;
}

async function generateNewTransactionNo(uid: string): Promise<string> {
    if (!uid) return 'NHTR0001';

    const paymentsRef = collection(db, 'payments');
    const q = query(
        paymentsRef, 
        where("uid", "==", uid),
        orderBy("transactionNo", "desc"),
        limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return 'NHTR0001';
    } else {
        const lastTxnNo = querySnapshot.docs[0].data().transactionNo;
        const numericId = parseInt(lastTxnNo.substring(4), 10);
        const newIdNumber = numericId + 1;
        return `NHTR${String(newIdNumber).padStart(4, '0')}`;
    }
}


export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedUtility, setSelectedUtility] = useState<Utility | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [previewData, setPreviewData] = useState<Payment | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [viewMode, setViewMode] = useState<'dashboard' | 'reports'>('dashboard');
  const [utilityLogos, setUtilityLogos] = useState(DEFAULT_SETTINGS.logos);
  const [isPrinting, setIsPrinting] = useState(false);
  const [paymentForPrint, setPaymentForPrint] = useState<Payment | null>(null);
  
  // Check auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        const role = localStorage.getItem('userRole') as UserRole | 'admin';
        setUserRole(role);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);


  // Fetch payments from Firestore
  const fetchPayments = useCallback(async () => {
    if (!currentUser) return;
    try {
      const paymentsRef = collection(db, 'payments');
      const q = query(paymentsRef, where("uid", "==", currentUser.uid), orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);
      const firestorePayments = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
              ...data,
              id: doc.id,
              date: (data.date as Timestamp).toDate().toISOString(),
          } as Payment;
      });
      setPayments(firestorePayments);
    } catch (error) {
      console.error("Error fetching payments: ", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not fetch payment history."});
    }
  }, [currentUser, toast]);

  // Load settings and fetch payments
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

    if (currentUser) {
        fetchPayments();
    }
  }, [currentUser, fetchPayments]);
  
  useEffect(() => {
    setUtilityLogos(settings.logos);
  }, [settings]);
  
  const generateAndShowPdf = async () => {
      // ... (existing PDF generation logic, no changes needed here)
      const receiptElement = document.getElementById('printable-receipt-content');
      if (!receiptElement) {
          console.error("Printable receipt element not found!");
          setIsPrinting(false);
          setPaymentForPrint(null);
          return;
      }

      try {
          const canvas = await html2canvas(receiptElement, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#ffffff',
          });
          
          const imgData = canvas.toDataURL('image/png');
          let pdf: jsPDF;
          if (settings.printSize === '80mm') {
            const pdfWidth = 80;
            const imgProps = { width: canvas.width, height: canvas.height };
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfWidth, pdfHeight] });
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          } else {
            pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgProps = { width: canvas.width, height: canvas.height };
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
          }
          
          const pdfBlob = pdf.output('blob');
          const pdfUrl = URL.createObjectURL(pdfBlob);
          
          const printWindow = window.open(pdfUrl, '_blank');
          if (printWindow) {
            printWindow.onload = () => { setTimeout(() => { printWindow.print(); }, 500); };
          }

      } catch (error) {
          console.error("Error generating PDF:", error);
      } finally {
          setIsPrinting(false);
          setPaymentForPrint(null);
      }
  };

  useEffect(() => {
    if (paymentForPrint && isPrinting) {
      generateAndShowPdf();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentForPrint, isPrinting]);


  const handleSaveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem('billBuddySettings', JSON.stringify(newSettings));
    setIsSettingsOpen(false);
  };
  
  const handleClearHistory = async (startDate?: Date, endDate?: Date, selectedMonth?: string) => {
    if (!currentUser) return;
    toast({ title: "Deleting History...", description: "Please wait." });
    try {
        let paymentsToDelete = payments;
        if (startDate && endDate) {
            paymentsToDelete = payments.filter(p => {
                const paymentDate = parseISO(p.date);
                return isWithinInterval(paymentDate, { start: startDate, end: endDate });
            });
        } else if (selectedMonth && selectedMonth !== 'all') {
            paymentsToDelete = payments.filter(p => {
                const paymentMonth = parseISO(p.date).toISOString().slice(0, 7);
                return paymentMonth === selectedMonth;
            });
        }
        
        for (const payment of paymentsToDelete) {
            const paymentRef = doc(db, 'payments', payment.id);
            await deleteDoc(paymentRef);
        }

        await fetchPayments(); // Refresh the list
        toast({ title: "Success", description: "Selected payment history has been cleared." });

    } catch (error) {
        console.error("Error clearing history:", error);
        toast({ variant: 'destructive', title: "Error", description: "Could not clear payment history." });
    }
  };

  const calculateServiceCharge = (amount: number): number => {
    for (const rule of settings.serviceCharges) {
      if (amount >= rule.min && (rule.max === null || amount <= rule.max)) {
        return rule.type === 'percentage' ? amount * (rule.value / 100) : rule.value;
      }
    }
    return 0;
  };

  const handleSelectUtility = (utility: Utility) => {
    setSelectedUtility(utility);
  };

  const handleBack = () => {
    setSelectedUtility(null);
    setPreviewData(null);
    setViewMode('dashboard');
  };

  const handleShowPreview = async (data: Bill) => {
    if (!selectedUtility || !currentUser) return;

    const userId = getUserIdByPhone(data.phoneNo, payments) || generateNewUserId(payments);
    const transactionNo = await generateNewTransactionNo(currentUser.uid);
    
    const serviceCharge = calculateServiceCharge(data.amount);

    const newPaymentData: Payment = {
      id: `${data.accountNo}-${new Date().getTime()}`, // Temp ID, will be replaced by Firestore ID
      uid: currentUser.uid,
      userId: userId,
      transactionNo: transactionNo,
      utility: selectedUtility,
      date: new Date().toISOString(),
      status: 'Pending',
      serviceCharge: serviceCharge,
      ...data,
    };
    setPreviewData(newPaymentData);
  };

  const handleConfirmAndPrint = async (paymentData: Payment) => {
    if (!currentUser) return;
    
    try {
        const { id, ...paymentToSave } = paymentData;
        const finalPaymentData = {
          ...paymentToSave,
          date: Timestamp.fromDate(new Date(paymentData.date)),
        };

        const docRef = await addDoc(collection(db, "payments"), finalPaymentData);
        
        const newPaymentWithId = { ...paymentData, id: docRef.id };
        setPayments(prev => [newPaymentWithId, ...prev]);
        setPaymentForPrint(newPaymentWithId);
        
        setIsPrinting(true);
        setPreviewData(null);
        setSelectedUtility(null);
        
        if (settings.sendSmsOnConfirm) {
            const message = `Dear ${paymentData.accountName}, Thank you for your payment of LKR ${paymentData.amount.toFixed(2)} for your ${paymentData.utility} bill. Your Transaction No is ${paymentData.transactionNo}. - ${settings.shopDetails.shopName}`;
            const smsUrl = `sms:${paymentData.phoneNo}?body=${encodeURIComponent(message)}`;
            window.location.href = smsUrl;
        }

    } catch (error) {
        console.error("Error adding document: ", error);
        toast({ variant: 'destructive', title: "Error", description: "Could not save payment. Please try again." });
    }
  };
  
  const handleReprint = (payment: Payment) => {
    setPaymentForPrint(payment);
    setIsPrinting(true);
  };

  const handleClosePreview = () => {
    setPreviewData(null);
  }

  const handleAddReference = async (paymentId: string, referenceNo: string) => {
    try {
        const paymentRef = doc(db, 'payments', paymentId);
        await updateDoc(paymentRef, {
            status: 'Paid',
            referenceNo: referenceNo,
        });
        
        const updatedPayments = payments.map(p => 
          p.id === paymentId 
            ? { ...p, status: 'Paid' as 'Paid', referenceNo: referenceNo } 
            : p
        );
        setPayments(updatedPayments);
        toast({ title: "Success", description: "Payment marked as complete." });

    } catch (error) {
        console.error("Error updating payment:", error);
        toast({ variant: 'destructive', title: "Error", description: "Could not update payment status." });
    }
  };
  
  const handleLogout = async () => {
    try {
        await signOut(auth);
        localStorage.removeItem('userRole');
        router.push('/login');
    } catch (error) {
        console.error("Logout Error:", error);
        toast({ variant: 'destructive', title: "Logout Failed", description: "Could not log out. Please try again." });
    }
  }

  const todaysPayments = useMemo(() => {
    return payments.filter(payment => isToday(new Date(payment.date)));
  }, [payments]);

  const pendingCounts = useMemo(() => {
    return payments.reduce((acc, p) => {
      if (p.status === 'Pending') {
        acc[p.utility] = (acc[p.utility] || 0) + 1;
      }
      return acc;
    }, {} as Record<Utility, number>);
  }, [payments]);

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  };
  
  if (loading || !currentUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const isAdmin = userRole === 'admin';

  return (
    <>
      <main className="container mx-auto flex min-h-screen flex-col items-center p-4 md:p-12">
        <div className="w-full max-w-4xl">
           <header className="mb-8 flex flex-col items-center text-center relative">
            <Image
              src={settings.shopDetails.logo}
              alt="Shop Logo"
              width={60}
              height={60}
              className="rounded-full mb-4"
              data-ai-hint="shop logo"
            />
            <div className="flex items-center gap-2">
              <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground">
                {settings.shopDetails.shopName}
              </h1>
            </div>
            <p className="text-muted-foreground mt-2">
              Your friendly neighborhood bill payment assistant.
            </p>
            <div className="absolute top-0 right-0 flex gap-2">
              {isAdmin && (
                <>
                  <Button variant="ghost" size="icon" onClick={() => setViewMode('reports')}>
                    <History />
                    <span className="sr-only">View Full History</span>
                  </Button>
                 <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
                  <SettingsIcon />
                  <span className="sr-only">Settings</span>
                </Button>
                </>
              )}
               <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut />
                <span className="sr-only">Logout</span>
              </Button>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {selectedUtility ? (
              <motion.div
                key="form"
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <BillForm
                  utility={selectedUtility}
                  onSubmit={handleShowPreview}
                  onBack={handleBack}
                  payments={payments}
                  logos={utilityLogos}
                />
              </motion.div>
            ) : viewMode === 'reports' && isAdmin ? (
                <motion.div
                key="reports"
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={{ duration: 0.3 }}
                className="w-full space-y-12"
              >
                <ReportsView
                  allPayments={payments}
                  onAddReference={handleAddReference}
                  settings={settings}
                  onReprint={handleReprint}
                  onBack={() => setViewMode('dashboard')}
                />
              </motion.div>
            ) : (
              <motion.div
                key="dashboard"
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={{ duration: 0.3 }}
                className="w-full space-y-12"
              >
                <UtilitySelector onSelect={handleSelectUtility} logos={utilityLogos} pendingCounts={pendingCounts} />
                <TodayPayments 
                  payments={todaysPayments}
                  onAddReference={handleAddReference}
                  settings={settings}
                  onReprint={handleReprint}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {isPrinting && !paymentForPrint && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                <div className="bg-background p-6 rounded-lg shadow-xl flex items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-lg font-medium">Generating PDF...</span>
                </div>
            </div>
        )}

        {previewData && (
          <BillPreview
            isOpen={!!previewData}
            onClose={handleClosePreview}
            onConfirm={handleConfirmAndPrint}
            payment={previewData}
            logos={utilityLogos}
            settings={settings}
          />
        )}
        
        {isAdmin && (
          <SettingsDialog
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            onSave={handleSaveSettings}
            currentSettings={settings}
            allPayments={payments}
            onClearHistory={handleClearHistory}
          />
        )}
      </main>
      
      {/* Off-screen container for the printable receipt to live in the DOM for capturing */}
      <div className={`absolute -left-[9999px] -top-[9999px] h-auto ${settings.printSize === '80mm' ? 'w-[80mm]' : 'w-[148mm]'}`}>
           <div id="printable-receipt-content">
             {paymentForPrint && <PrintableReceipt payment={paymentForPrint} settings={settings} />}
           </div>
      </div>
    </>
  );
}
