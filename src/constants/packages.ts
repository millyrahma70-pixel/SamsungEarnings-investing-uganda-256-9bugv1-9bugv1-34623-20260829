import { InvestmentPackage } from '@/types';

export const PACKAGES: InvestmentPackage[] = [
  {
    id: 'nova-15',
    name: 'Nova 15',
    group: 1,
    price: 25000,
    dailyIncome: 4500,
    duration: 60,
    phone: 'Huawei Nova 15 Max',
    image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&q=80',
  },
  {
    id: 'p60-pro',
    name: 'P60 Pro',
    group: 1,
    price: 38000,
    dailyIncome: 9000,
    duration: 60,
    phone: 'Huawei P60 Pro',
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80',
  },
  {
    id: 'p30-pro',
    name: 'P30 Pro',
    group: 2,
    price: 50000,
    dailyIncome: 12500,
    duration: 180,
    phone: 'Huawei P30 Pro',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80',
  },
  {
    id: 'nova-16s-pro-a35',
    name: 'Nova 16s Pro A35',
    group: 2,
    price: 100000,
    dailyIncome: 26000,
    duration: 180,
    phone: 'Huawei Nova 16s Pro A35',
    image: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400&q=80',
  },
  {
    id: 'pura-80-pro',
    name: 'Pura 80 Pro',
    group: 2,
    price: 150000,
    dailyIncome: 40000,
    duration: 180,
    phone: 'Huawei Pura 80 Pro',
    image: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400&q=80',
  },
  {
    id: 'pura-90s-pro',
    name: 'Pura 90s Pro',
    group: 3,
    price: 300000,
    dailyIncome: 90000,
    duration: 210,
    phone: 'Huawei Pura 90s Pro',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&q=80',
  },
  {
    id: 'pura-90s-pro-max',
    name: 'Pura 90s Pro Max',
    group: 3,
    price: 500000,
    dailyIncome: 160000,
    duration: 210,
    phone: 'Huawei Pura 90s Pro Max',
    image: 'https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=400&q=80',
  },
  {
    id: 'mate-x17',
    name: 'Mate X17',
    group: 3,
    price: 800000,
    dailyIncome: 280200,
    duration: 210,
    phone: 'Huawei Mate X17',
    image: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&q=80',
  },
  {
    id: 'mate-80-pro',
    name: 'Mate 80 Pro',
    group: 3,
    price: 1200000,
    dailyIncome: 450000,
    duration: 210,
    phone: 'Huawei Mate 80 Pro',
    image: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=400&q=80',
  },
  {
    id: 'pura-80-ultra',
    name: 'Pura 80 Ultra',
    group: 3,
    price: 1300000,
    dailyIncome: 500000,
    duration: 210,
    phone: 'Huawei Pura 80 Ultra',
    image: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=400&q=80',
  },
  {
    id: 'mate-xt-ultimate',
    name: 'Mate XT Ultimate',
    group: 3,
    price: 2000000,
    dailyIncome: 700000,
    duration: 210,
    phone: 'Huawei Mate XT Ultimate',
    image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80',
  },
];

// ─── RECHARGE - NEW WAY (PesaJet Prompt) ─────────────────────────────
// NO MTN_NUMBER / AIRTEL_NUMBER for payment anymore.
// User does NOT send money to any number.
// Admin collects from user via PesaJet app.
export const RECHARGE_METHOD = 'pesajet_prompt';
export const RECHARGE_NOTE = 'Admin will send you a payment prompt. Enter your PIN to complete.';
export const RECHARGE_MIN = 25000;

// Admin contact only - for Help, NOT for payment
export const ADMIN_CONTACT_NAME = 'Nabakooza Milly';
export const ADMIN_CONTACT_PHONE = '0756406186';

// ⚠️ DEPRECATED - Kept only so old imports don't crash. DO NOT USE FOR PAYMENT.
// If any file still shows "Send to MTN_NUMBER", delete that code.
export const MTN_NUMBER = '';
export const MTN_NAME = '';
export const AIRTEL_NUMBER = '';
export const AIRTEL_NAME = '';

export const REGISTRATION_BONUS = 9000;
export const MIN_DEPOSIT = 25000;
export const MIN_WITHDRAWAL = 9000;
export const MAX_WITHDRAWALS_PER_DAY = 2;
export const WITHDRAWAL_TAX = 0.18;
export const DAILY_CHECKIN_REWARD = 300;
export const REFERRAL_L1 = 0.27;
export const REFERRAL_L2 = 0.02;
export const REFERRAL_L3 = 0.01;

export const TELEGRAM_OFFICIAL = 'https://t.me/+adk1usHyKF4yYzQ0';
export const TELEGRAM_GROUP = 'https://t.me/+kH7QuzE6dp0xZmVk';

export const ADMIN_CREDENTIALS = {
  name: 'nabakooza@admin.com',
  phone: '0700000000',
  password: 'nabakooza123stanley',
};
