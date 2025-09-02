import type { Settings, ShopDetails, UtilityLogos, UtilityPaymentLinks } from './types';

export const getDefaultLogos = (): UtilityLogos => ({
  LECO: 'https://placehold.co/40x40.png',
  CEB: 'https://placehold.co/40x40.png',
  Water: 'https://placehold.co/40x40.png',
});

export const getDefaultPaymentLinks = (): UtilityPaymentLinks => ({
  LECO: 'https://online.leco.lk/ceb_bill/online_payment.jsp',
  CEB: 'https://pg.ceb.lk/billpayment/onlinepayment',
  Water: 'https://online.waterboard.lk/',
});

export const getDefaultShopDetails = (): ShopDetails => ({
  logo: 'https://placehold.co/100x100.png',
  shopName: 'Bill Buddy',
  address: '123 Main Street, Colombo 01',
  phoneNo: '011-1234567',
  email: 'shop@billbuddy.com',
});

export const DEFAULT_SETTINGS: Settings = {
  logos: getDefaultLogos(),
  paymentLinks: getDefaultPaymentLinks(),
  serviceCharges: [
    {
      id: 'rule1',
      min: 1,
      max: 4999,
      value: 30,
      type: 'fixed',
    },
    {
      id: 'rule2',
      min: 5000,
      max: 9999,
      value: 50,
      type: 'fixed',
    },
    {
      id: 'rule3',
      min: 10000,
      max: null,
      value: 1,
      type: 'percentage',
    },
  ],
  shopDetails: getDefaultShopDetails(),
  showBalanceCalculator: false,
  printSize: 'A5',
  sendSmsOnConfirm: false,
};
