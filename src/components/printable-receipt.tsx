
'use client';

import type { Payment, Settings } from '@/lib/types';
import { format } from 'date-fns';
import Image from 'next/image';

interface PrintableReceiptProps {
  payment: Payment;
  settings: Settings;
}

export function PrintableReceipt({ payment, settings }: PrintableReceiptProps) {

  const totalAmount = payment.amount + payment.serviceCharge;
  const balance = payment.paidAmount ? payment.paidAmount - totalAmount : undefined;
  
  const is80mm = settings.printSize === '80mm';

  if (is80mm) {
     return (
        <div className="relative p-2 font-sans text-xs bg-white text-black h-full w-full overflow-hidden">
            <div className="watermark-80mm">PAID</div>
            <div className="relative z-10 text-center">
                <header className="flex flex-col items-center mb-4">
                    <Image 
                      src={settings.shopDetails.logo}
                      alt="Shop Logo"
                      width={40}
                      height={40}
                      className="rounded-md mb-2"
                      data-ai-hint="shop logo"
                    />
                    <h1 className="font-headline text-lg font-bold">
                      {settings.shopDetails.shopName}
                    </h1>
                    <p>{settings.shopDetails.address}</p>
                    <p>Tel: {settings.shopDetails.phoneNo}</p>
                    {settings.shopDetails.email && <p>Email: {settings.shopDetails.email}</p>}
                </header>
                
                <h2 className="font-bold text-base my-4">Payment Receipt</h2>
                
                <div className="text-left space-y-1 text-xs">
                    <p><strong>Date:</strong> {format(new Date(payment.date), "yyyy-MM-dd, p")}</p>
                    <p><strong>Provider:</strong> {payment.utility}</p>
                    <p><strong>Acc Name:</strong> {payment.accountName}</p>
                    <p><strong>Acc No:</strong> {payment.accountNo}</p>
                    <p><strong>Contact:</strong> {payment.phoneNo}</p>
                </div>
                
                <div className="my-4">
                  <table className="w-full text-left text-xs">
                    <tbody>
                      <tr><td className="pb-1">Bill Amount:</td><td className="text-right font-mono pb-1">{payment.amount.toFixed(2)}</td></tr>
                      <tr><td className="pb-1">Service Charge:</td><td className="text-right font-mono pb-1">{payment.serviceCharge.toFixed(2)}</td></tr>
                      <tr className="font-bold"><td className="pt-2">Total Amount Due:</td><td className="text-right font-mono pt-2">{totalAmount.toFixed(2)}</td></tr>
                      {payment.paidAmount && (
                        <tr className="pt-2"><td>Amount Paid:</td><td className="text-right font-mono">{payment.paidAmount.toFixed(2)}</td></tr>
                      )}
                      {balance !== undefined && balance >= 0 && (
                        <tr><td>Balance:</td><td className="text-right font-mono">{balance.toFixed(2)}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="my-2">
                    <p className="font-bold text-sm text-center">{payment.transactionNo}</p>
                </div>
                
                <div className="my-4 text-center text-xs text-gray-500">
                    <p>Thank you for using Bill Buddy!</p>
                    <p>077-6600 674</p>
                </div>
            </div>
        </div>
     )
  }

  // A5 Receipt
  return (
    <div className="relative px-8 pb-8 pt-8 font-sans text-sm bg-white text-black h-full w-full overflow-hidden">
        <div className="watermark">PAID</div>
        
        <div className="relative z-10">
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <Image 
                    src={settings.shopDetails.logo}
                    alt="Shop Logo"
                    width={60}
                    height={60}
                    className="rounded-md"
                    data-ai-hint="shop logo"
                  />
                  <div>
                    <h1 className="font-headline text-2xl font-bold tracking-tight">
                      {settings.shopDetails.shopName}
                    </h1>
                    <p className="text-xs">{settings.shopDetails.address}</p>
                    <p className="text-xs">Tel: {settings.shopDetails.phoneNo}</p>
                    {settings.shopDetails.email && <p className="text-xs">Email: {settings.shopDetails.email}</p>}
                  </div>
                </div>
                 <div className="text-right flex flex-col items-end">
                    <h2 className="font-bold text-xl">Payment Receipt</h2>
                    <div className="mt-2">
                        <Image
                            src={settings.logos[payment.utility]}
                            alt={`${payment.utility} logo`}
                            width={40}
                            height={40}
                            className="rounded-full"
                            data-ai-hint={`${payment.utility.toLowerCase()} logo`}
                        />
                    </div>
                </div>
            </header>
            
            <div className="text-center my-6">
                <p className="font-bold text-lg">{payment.transactionNo}</p>
            </div>

            <div className="flex justify-between items-center bg-green-100 text-green-800 p-3 rounded-md mb-6 border border-green-200">
                <span className="font-bold text-lg">STATUS: PAID</span>
                <span className="text-xs font-medium">{format(new Date(payment.date), "PPP")}</span>
            </div>

            <div className="grid grid-cols-2 gap-y-1 mb-6">
                <span className="text-gray-600">Utility Provider:</span>
                <span className="font-medium text-right">{payment.utility}</span>
                <span className="text-gray-600">Account Name:</span>
                <span className="font-medium text-right">{payment.accountName}</span>
                <span className="text-gray-600">Account Number:</span>
                <span className="font-medium text-right">{payment.accountNo}</span>
                <span className="text-gray-600">Contact Number:</span>
                <span className="font-medium text-right">{payment.phoneNo}</span>
            </div>

            <table className="w-full text-sm">
                <tbody>
                    <tr>
                        <td className="py-1 text-gray-600">Bill Amount:</td>
                        <td className="py-1 text-right font-mono">LKR {payment.amount.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td className="pb-2 text-gray-600">Service Charge:</td>
                        <td className="pb-2 text-right font-mono">LKR {payment.serviceCharge.toFixed(2)}</td>
                    </tr>
                    <tr className="border-t-2 border-black">
                        <td className="pt-2 font-bold text-base">Total Amount Due:</td>
                        <td className="pt-2 text-right font-mono font-bold text-base">LKR {totalAmount.toFixed(2)}</td>
                    </tr>
                     {payment.paidAmount && (
                        <tr>
                            <td className="pt-2">Amount Paid:</td>
                            <td className="pt-2 text-right font-mono">LKR {payment.paidAmount.toFixed(2)}</td>
                        </tr>
                    )}
                    {balance !== undefined && balance >= 0 && (
                        <tr className="">
                            <td className="pt-2 font-bold">Balance Returned:</td>
                            <td className="pt-2 text-right font-mono font-bold">LKR {balance.toFixed(2)}</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div className="mt-8 text-center text-xs text-gray-500">
                <p>Thank you for using Bill Buddy!</p>
                <p>077-6600 674</p>
            </div>
        </div>
    </div>
  );
}
