
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { UtilitySelector } from '@/components/utility-selector';
import { BillForm } from '@/components/bill-form';
import { TodayPayments } from '@/components/today-payments';
import { ReportsView } from '@/components/reports-view';
import { BillPreview } from '@/components/bill-preview';
import { PrintableReceipt } from '@/components/printable-receipt';
import { SettingsDialog } from '@/components/settings-dialog';
import { Button } from '@/components/ui/button';
import type { Utility, Bill, Payment, Settings, User as AuthUser } from '@/lib/types';
import { Settings as SettingsIcon, History, Loader2, LogOut } from 'lucide-react';
import { isToday, parseISO, isWithinInterval } from 'date-fns';
import { DEFAULT_SETTINGS } from '@/lib/config';
import Image from 'next/image';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';


function getUserIdByPhone(phoneNo: string, payments: Payment[]): string | null {
  const existingPayment = payments.find(p => p.phoneNo === phoneNo);
  return existingPayment ? existingPayment.userId : null;
}

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

function generateNewTransactionNo(payments: Payment[]): string {
  if (!payments || payments.length === 0) return 'NHTR0001';

  const existingTxnNos = payments.map(p => p.transactionNo);
  const numericIds = existingTxnNos
    .filter(id => id && id.startsWith('NHTR'))
    .map(id => parseInt(id.substring(4), 10))
    .filter(id => !isNaN(id));

  const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
  const newIdNumber = maxId + 1;
  
  return `NHTR${String(newIdNumber).padStart(4, '0')}`;
}

export default function HomePage() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [selectedUtility, setSelectedUtility] = useState<Utility | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const [previewData, setPreviewData] = useState<Payment | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [viewMode, setViewMode] = useState<'dashboard' | 'reports'>('dashboard');
  const [utilityLogos, setUtilityLogos] = useState(DEFAULT_SETTINGS.logos);
  const [isPrinting, setIsPrinting] = useState(false);
  const [paymentForPrint, setPaymentForPrint] = useState<Payment | null>(null);
  
  const fetchPayments = useCallback(async (userId: string) => {
    setIsLoadingPayments(true);
    try {
      const q = query(collection(db, "payments"), where("ownerUid", "==", userId));
      const querySnapshot = await getDocs(q);
      const userPayments: Payment[] = [];
      querySnapshot.forEach((doc) => {
        userPayments.push({ id: doc.id, ...doc.data() } as Payment);
      });
      setPayments(userPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error("Error fetching payments: ", error);
      setPayments([]);
    } finally {
      setIsLoadingPayments(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userWithRole: AuthUser = {
          uid: user.uid,
          email: user.email,
          role: 'admin', // Placeholder, role management to be implemented
        };
        setAuthUser(userWithRole);
        fetchPayments(user.uid);
      } else {
        setAuthUser(null);
        setPayments([]);
        router.push('/login');
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [router, fetchPayments]);

  // Load settings from localStorage
  useEffect(() => {
    if (authUser) {
       const storedSettings = localStorage.getItem('billBuddySettings');
       if (storedSettings) {
         try {
           const parsedSettings = JSON.parse(storedSettings);
           
           const mergedSettings: Settings = {
             ...DEFAULT_SETTINGS,
             ...parsedSettings,
             logos: { ...DEFAULT_SETTINGS.logos, ...parsedSettings.logos },
             paymentLinks: { ...DEFAULT_SETTINGS.paymentLinks, ...(parsedSettings.paymentLinks || {}) },
             serviceCharges: parsedSettings.serviceCharges || DEFAULT_SETTINGS.serviceCharges,
             shopDetails: { ...DEFAULT_SETTINGS.shopDetails, ...(parsedSettings.shopDetails || {}) },
             printSize: parsedSettings.printSize || DEFAULT_SETTINGS.printSize,
             showBalanceCalculator: parsedSettings.showBalanceCalculator || false,
             sendSmsOnConfirm: parsedSettings.sendSmsOnConfirm || false,
           };
           setSettings(mergedSettings);
         } catch (e) {
           setSettings(DEFAULT_SETTINGS);
         }
       } else {
         setSettings(DEFAULT_SETTINGS);
       }
    }
  }, [authUser]);
  
  useEffect(() => {
    setUtilityLogos(settings.logos);
  }, [settings]);
  
  const generateAndShowPdf = async () => {
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
            pdf = new jsPDF({
              orientation: 'portrait',
              unit: 'mm',
              format: [pdfWidth, pdfHeight]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          } else {
            pdf = new jsPDF({
              orientation: 'portrait',
              unit: 'mm',
              format: 'a5',
            });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgProps = { width: canvas.width, height: canvas.height };
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
          }
          
          const pdfBlob = pdf.output('blob');
          const pdfUrl = URL.createObjectURL(pdfBlob);
          
          const printWindow = window.open(pdfUrl, '_blank');
          if (printWindow) {
            printWindow.onload = () => {
              setTimeout(() => {
                printWindow.print();
              }, 500); 
            };
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
    if (!authUser) return;
  
    const paymentsToClear = payments.filter(p => {
      if (startDate && endDate) {
        const paymentDate = parseISO(p.date);
        return isWithinInterval(paymentDate, { start: startDate, end: endDate });
      }
      if (selectedMonth && selectedMonth !== 'all') {
        const paymentMonth = parseISO(p.date).toISOString().slice(0, 7);
        return paymentMonth === selectedMonth;
      }
      if (!startDate && !endDate && !selectedMonth) {
        // Clear all condition
        return true;
      }
      return false;
    });

    if (paymentsToClear.length > 0) {
      const batch = writeBatch(db);
      paymentsToClear.forEach(p => {
        const docRef = doc(db, 'payments', p.id);
        batch.delete(docRef);
      });
      await batch.commit();
      await fetchPayments(authUser.uid); // Re-fetch payments
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

  const handleShowPreview = (data: Bill) => {
    if (!selectedUtility || !authUser) return;

    const userId = getUserIdByPhone(data.phoneNo, payments) || generateNewUserId(payments);
    const transactionNo = generateNewTransactionNo(payments);
    
    const serviceCharge = calculateServiceCharge(data.amount);

    const newPaymentData: Payment = {
      id: `${data.accountNo}-${new Date().getTime()}`, // This ID is temporary client-side
      userId: userId,
      transactionNo: transactionNo,
      utility: selectedUtility,
      date: new Date().toISOString(),
      status: 'Pending',
      serviceCharge: serviceCharge,
      ownerUid: authUser.uid, // Add owner UID
      ...data,
    };
    setPreviewData(newPaymentData);
  };

  const handleConfirmAndPrint = async (paymentData: Payment) => {
    if (!authUser) return;

    try {
      // Add to firestore
      const { id, ...paymentToSave } = paymentData;
      const docRef = await addDoc(collection(db, "payments"), paymentToSave);
      
      const finalPayment = { ...paymentData, id: docRef.id, status: 'Pending' as 'Pending' };

      // Update local state
      const updatedPayments = [finalPayment, ...payments];
      setPayments(updatedPayments);

      setPaymentForPrint(finalPayment);
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
      const paymentDocRef = doc(db, 'payments', paymentId);
      await updateDoc(paymentDocRef, {
        status: 'Paid',
        referenceNo: referenceNo,
      });

      const updatedPayments = payments.map(p => 
        p.id === paymentId 
          ? { ...p, status: 'Paid' as 'Paid', referenceNo: referenceNo } 
          : p
      );
      setPayments(updatedPayments);
    } catch (error) {
      console.error("Error updating payment: ", error);
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out: ', error);
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
  
  if (isLoadingAuth || !authUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const isAdmin = authUser?.role === 'admin';

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
            {isLoadingPayments ? (
               <motion.div
                key="loading"
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={{ duration: 0.3 }}
                className="w-full flex justify-center items-center h-64"
               >
                 <Loader2 className="h-12 w-12 animate-spin text-primary" />
               </motion.div>
            ) : selectedUtility ? (
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
      
      <div className={`absolute -left-[9999px] -top-[9999px] h-auto ${settings.printSize === '80mm' ? 'w-[80mm]' : 'w-[148mm]'}`}>
           <div id="printable-receipt-content">
             {paymentForPrint && <PrintableReceipt payment={paymentForPrint} settings={settings} />}
           </div>
      </div>
    </>
  );
}

    