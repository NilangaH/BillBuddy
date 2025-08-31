
import { z } from 'zod';

export type Utility = 'LECO' | 'CEB' | 'Water';

export const billSchema = z.object({
  accountNo: z.string().min(1, 'Account number is required.'),
  amount: z.coerce.number().positive('Amount must be a positive number'),
  accountName: z.string().min(2, 'Account name is required').max(50),
  phoneNo: z.string().regex(/^\+?[0-9]{10,15}$/, 'Please enter a valid phone number'),
});

export type Bill = z.infer<typeof billSchema>;

export type PaymentStatus = 'Paid' | 'Pending';

export type Payment = Bill & {
  id: string;
  userId: string;
  utility: Utility;
  date: string;
  status: PaymentStatus;
  serviceCharge: number;
  transactionNo: string;
  referenceNo?: string;
  paidAmount?: number;
};

export type UtilityLogos = {
  [key in Utility]: string;
};

export type UtilityPaymentLinks = {
  [key in Utility]: string;
};

export type ServiceChargeRule = {
  id: string;
  min: number;
  max: number | null;
  value: number;
  type: 'fixed' | 'percentage';
};

export type ShopDetails = {
  logo: string;
  shopName: string;
  address: string;
  phoneNo: string;
  email?: string;
};

export type UserRole = 'admin' | 'user';

export type User = {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
};

export type PrintSize = 'A5' | '80mm';

export type Settings = {
  logos: UtilityLogos;
  paymentLinks: UtilityPaymentLinks;
  serviceCharges: ServiceChargeRule[];
  shopDetails: ShopDetails;
  users: User[];
  showBalanceCalculator: boolean;
  printSize: PrintSize;
  sendSmsOnConfirm: boolean;
};
