import { supabase } from '@/lib/supabase';
import {
  User,
  UserProduct,
  Withdrawal,
  Recharge,
  Wallet,
  RedeemCode,
  Notification,
} from '@/types';

// ─── Current User Session (localStorage only — per device session) ────────────
const SESSION_KEY = 'huawei_current_user';
const ADMIN_SESSION_KEY = 'Huawei mobile earning_admin_session';

export const getCurrentUser = (): User | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
};

export const setCurrentUser = (user: User | null): void => {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
};

/**
 * Fetch latest user data from Supabase and sync the local session.
 */
export async function refreshCurrentUser(): Promise<User | null> {
  const cached = getCurrentUser();
  if (!cached) return null;

  const fresh = await getUserById(cached.id);
  if (fresh) setCurrentUser(fresh);

  return fresh;
}

export const getAdminSession = (): boolean =>
  localStorage.getItem(ADMIN_SESSION_KEY) === 'true';

export const setAdminSession = (value: boolean): void => {
  if (value) localStorage.setItem(ADMIN_SESSION_KEY, 'true');
  else localStorage.removeItem(ADMIN_SESSION_KEY);
};

// ─── Type Mappers (DB snake_case ↔ App camelCase) ────────────────────────────
function dbToUser(r: Record<string, unknown>): User {
  return {
    id: r.id as string,
    name: r.name as string,
    phone: r.phone as string,
    password: r.password as string,
    balance: Number(r.balance),
    totalEarnings: Number(r.total_earnings),
    dailyEarnings: Number(r.daily_earnings),
    referralEarnings: Number(r.referral_earnings),
    totalWithdrawal: Number(r.total_withdrawal),
    registrationBonus: Number(r.registration_bonus ?? 9000),
    referralCode: r.referral_code as string,
    referredBy: (r.referred_by as string | null) ?? null,
    frozen: Boolean(r.frozen),
    claimedMissions: (r.claimed_missions as string[]) ?? [],
    lastCheckIn: (r.last_check_in as string | null) ?? null,
    createdAt: r.created_at as string,
  };
}

function dbToProduct(r: Record<string, unknown>): UserProduct {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    packageId: r.package_id as string,
    packageName: r.package_name as string,
    packagePrice: Number(r.package_price),
    dailyIncome: Number(r.daily_income),
    duration: Number(r.duration),
    status: r.status as UserProduct['status'],
    buyDate: (r.buy_date as string) ?? new Date().toISOString(),
    expiryDate: (r.expiry_date as string) ?? new Date().toISOString(),
    lastIncomeDate: (r.last_income_date as string | null) ?? null,
    totalIncomeEarned: Number(r.total_income_earned),
    paymentProof: (r.payment_proof as string) ?? '',
  };
}

function dbToWithdrawal(r: Record<string, unknown>): Withdrawal {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    userName: (r.user_name as string) ?? '',
    userPhone: (r.user_phone as string) ?? '',
    amount: Number(r.amount),
    netAmount: Number(r.net_amount),
    walletType: r.wallet_type as Withdrawal['walletType'],
    walletPhone: r.wallet_phone as string,
    walletName: r.wallet_name as string,
    status: r.status as Withdrawal['status'],
    createdAt: r.created_at as string,
    processedAt: (r.processed_at as string | null) ?? null,
  };
}

function dbToRecharge(r: Record<string, unknown>): Recharge {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    userName: (r.user_name as string) ?? '',
    userPhone: (r.user_phone as string) ?? '',
    amount: Number(r.amount),
    network: r.network as Recharge['network'],
    senderPhone: r.sender_phone as string,
    senderName: (r.sender_name as string) ?? '',
    proof: (r.proof as string) ?? '',
    status: r.status as Recharge['status'],
    createdAt: r.created_at as string,
    processedAt: (r.processed_at as string | null) ?? null,
  };
}

function dbToWallet(r: Record<string, unknown>): Wallet {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    type: r.type as Wallet['type'],
    phone: r.phone as string,
    name: r.name as string,
    createdAt: r.created_at as string,
  };
}

function dbToRedeemCode(r: Record<string, unknown>): RedeemCode {
  return {
    id: r.id as string,
    code: r.code as string,
    amount: Number(r.amount),
    createdAt: r.created_at as string,
    expiresAt: r.expires_at as string,
    usedBy: (r.used_by as string[]) ?? [],
    isActive: Boolean(r.is_active),
  };
}

function dbToNotification(r: Record<string, unknown>): Notification {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    type: r.type as Notification['type'],
    title: r.title as string,
    message: r.message as string,
    isRead: Boolean(r.is_read),
    createdAt: r.created_at as string,
  };
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('huawei_users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => dbToUser(r as Record<string, unknown>));
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('huawei_users')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (error) throw error;
  return data ? dbToUser(data as Record<string, unknown>) : null;
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('huawei_users')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? dbToUser(data as Record<string, unknown>) : null;
}

export async function getUserByReferralCode(code: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('huawei_users')
    .select('*')
    .ilike('referral_code', code.trim())
    .maybeSingle();

  if (error) throw error;
  return data ? dbToUser(data as Record<string, unknown>) : null;
}

export async function createUser(user: User): Promise<void> {
  const { error } = await supabase.from('huawei_users').insert({
    id: user.id,
    name: user.name,
    phone: user.phone,
    password: user.password,
    balance: user.balance,
    total_earnings: user.totalEarnings,
    daily_earnings: user.dailyEarnings,
    referral_earnings: user.referralEarnings,
    total_withdrawal: user.totalWithdrawal,
    registration_bonus: user.registrationBonus,
    referral_code: user.referralCode,
    referred_by: user.referredBy,
    frozen: user.frozen ?? false,
    claimed_missions: user.claimedMissions ?? [],
    last_check_in: user.lastCheckIn ?? null,
  });

  if (error) throw error;
}

export async function updateUser(user: User): Promise<void> {
  const { error } = await supabase
    .from('huawei_users')
    .update({
      name: user.name,
      phone: user.phone,
      password: user.password,
      balance: user.balance,
      total_earnings: user.totalEarnings,
      daily_earnings: user.dailyEarnings,
      referral_earnings: user.referralEarnings,
      total_withdrawal: user.totalWithdrawal,
      registration_bonus: user.registrationBonus,
      referral_code: user.referralCode,
      referred_by: user.referredBy,
      frozen: user.frozen ?? false,
      claimed_missions: user.claimedMissions ?? [],
      last_check_in: user.lastCheckIn ?? null,
    })
    .eq('id', user.id);

  if (error) throw error;

  const current = getCurrentUser();
  if (current?.id === user.id) setCurrentUser(user);
}

export async function deleteUserById(id: string): Promise<void> {
  const { error } = await supabase.from('huawei_users').delete().eq('id', id);
  if (error) throw error;
}

// ─── Products ─────────────────────────────────────────────────────────────────
export async function getProducts(): Promise<UserProduct[]> {
  const { data, error } = await supabase
    .from('huawei_products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => dbToProduct(r as Record<string, unknown>));
}

export async function getUserProducts(userId: string): Promise<UserProduct[]> {
  const { data, error } = await supabase
    .from('huawei_products')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => dbToProduct(r as Record<string, unknown>));
}

export async function createProduct(product: UserProduct): Promise<void> {
  const { error } = await supabase.from('huawei_products').insert({
    id: product.id,
    user_id: product.userId,
    package_id: product.packageId,
    package_name: product.packageName,
    package_price: product.packagePrice,
    daily_income: product.dailyIncome,
    duration: product.duration,
    status: product.status,
    buy_date: product.buyDate,
    expiry_date: product.expiryDate,
    last_income_date: product.lastIncomeDate,
    total_income_earned: product.totalIncomeEarned,
    payment_proof: product.paymentProof,
  });

  if (error) throw error;
}

export async function updateProduct(product: UserProduct): Promise<void> {
  const { error } = await supabase
    .from('huawei_products')
    .update({
      package_id: product.packageId,
      package_name: product.packageName,
      package_price: product.packagePrice,
      daily_income: product.dailyIncome,
      duration: product.duration,
      status: product.status,
      buy_date: product.buyDate,
      expiry_date: product.expiryDate,
      last_income_date: product.lastIncomeDate,
      total_income_earned: product.totalIncomeEarned,
      payment_proof: product.paymentProof,
    })
    .eq('id', product.id);

  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('huawei_products').delete().eq('id', id);
  if (error) throw error;
}

// ─── Withdrawals ──────────────────────────────────────────────────────────────
export async function getWithdrawals(): Promise<Withdrawal[]> {
  const { data, error } = await supabase
    .from('huawei_withdrawals')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((r) => dbToWithdrawal(r as Record<string, unknown>));
}

export async function getUserWithdrawals(userId: string): Promise<Withdrawal[]> {
  const { data, error } = await supabase
    .from('huawei_withdrawals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => dbToWithdrawal(r as Record<string, unknown>));
}

export async function createWithdrawal(withdrawal: Withdrawal): Promise<void> {
  const { error } = await supabase.from('huawei_withdrawals').insert({
    id: withdrawal.id,
    user_id: withdrawal.userId,
    user_name: withdrawal.userName,
    user_phone: withdrawal.userPhone,
    amount: withdrawal.amount,
    net_amount: withdrawal.netAmount,
    wallet_type: withdrawal.walletType,
    wallet_phone: withdrawal.walletPhone,
    wallet_name: withdrawal.walletName,
    status: withdrawal.status,
  });

  if (error) throw error;
}

export async function updateWithdrawal(withdrawal: Withdrawal): Promise<void> {
  const { error } = await supabase
    .from('huawei_withdrawals')
    .update({
      status: withdrawal.status,
      processed_at: withdrawal.processedAt,
    })
    .eq('id', withdrawal.id);

  if (error) throw error;
}

// ─── Recharges ────────────────────────────────────────────────────────────────
export async function getRecharges(): Promise<Recharge[]> {
  const { data, error } = await supabase
    .from('huawei_recharges')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => dbToRecharge(r as Record<string, unknown>));
}

export async function getUserRecharges(userId: string): Promise<Recharge[]> {
  const { data, error } = await supabase
    .from('huawei_recharges')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => dbToRecharge(r as Record<string, unknown>));
}

/**
 * Calls your backend route. It does not call a Supabase Edge Function.
 *
 * The backend route must validate the request, call PesaJet using the
 * server-side API key, and return { reference, paymentUrl }.
 */
export async function startRechargePayment(input: {
  amount: number;
  network: 'mtn' | 'airtel';
  senderPhone: string;
  senderName: string;
  userId: string;
  userName: string;
  userPhone: string;
}): Promise<{ reference: string; paymentUrl: string | null }> {
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) {
    throw new Error('Enter a valid recharge amount.');
  }

  if (input.network !== 'mtn' && input.network !== 'airtel') {
    throw new Error('Choose a valid mobile money network.');
  }

  if (!input.senderPhone.trim() || !input.senderName.trim()) {
    throw new Error('Enter the sender phone number and name.');
  }

  const response = await fetch('/api/recharge/initiate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Could not start the recharge.');
  }

  if (!data?.reference) {
    throw new Error('Payment service did not return a reference.');
  }

  return {
    reference: String(data.reference),
    paymentUrl: data.paymentUrl ? String(data.paymentUrl) : null,
  };
}

/**
 * Inserts a recharge directly into Supabase.
 * For PesaJet payments, use startRechargePayment() to initiate the payment.
 */
export async function createRecharge(recharge: Recharge): Promise<void> {
  const { error } = await supabase.from('huawei_recharges').insert({
    id: recharge.id,
    user_id: recharge.userId,
    user_name: recharge.userName,
    user_phone: recharge.userPhone,
    amount: recharge.amount,
    network: recharge.network,
    sender_phone: recharge.senderPhone,
    sender_name: recharge.senderName,
    proof: recharge.proof,
    status: recharge.status,
  });

  if (error) throw error;
}

export async function updateRecharge(recharge: Recharge): Promise<void> {
  const { error } = await supabase
    .from('huawei_recharges')
    .update({
      status: recharge.status,
      processed_at: recharge.processedAt,
    })
    .eq('id', recharge.id);

  if (error) throw error;
}

// ─── Wallets ──────────────────────────────────────────────────────────────────
export async function getWallets(): Promise<Wallet[]> {
  const { data, error } = await supabase.from('huawei_wallets').select('*');

  if (error) throw error;
  return (data ?? []).map((r) => dbToWallet(r as Record<string, unknown>));
}

export async function getUserWallets(userId: string): Promise<Wallet[]> {
  const { data, error } = await supabase
    .from('huawei_wallets')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return (data ?? []).map((r) => dbToWallet(r as Record<string, unknown>));
}

export async function saveWallet(wallet: Wallet): Promise<void> {
  const { error } = await supabase.from('huawei_wallets').upsert({
    id: wallet.id,
    user_id: wallet.userId,
    type: wallet.type,
    phone: wallet.phone,
    name: wallet.name,
  });

  if (error) throw error;
}

export async function deleteWalletsByUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from('huawei_wallets')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
}

// ─── Redeem Codes ────────────────────────────────────────────────────────────
export async function getRedeemCodes(): Promise<RedeemCode[]> {
  const { data, error } = await supabase
    .from('huawei_redeem_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => dbToRedeemCode(r as Record<string, unknown>));
}

export async function createRedeemCode(code: RedeemCode): Promise<void> {
  const { error } = await supabase.from('huawei_redeem_codes').insert({
    id: code.id,
    code: code.code,
    amount: code.amount,
    expires_at: code.expiresAt,
    used_by: code.usedBy,
    is_active: code.isActive,
  });

  if (error) throw error;
}

export async function updateRedeemCode(code: RedeemCode): Promise<void> {
  const { error } = await supabase
    .from('huawei_redeem_codes')
    .update({
      used_by: code.usedBy,
      is_active: code.isActive,
    })
    .eq('id', code.id);

  if (error) throw error;
}

export async function deleteRedeemCodeById(id: string): Promise<void> {
  const { error } = await supabase
    .from('huawei_redeem_codes')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function getNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('huawei_notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => dbToNotification(r as Record<string, unknown>));
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('huawei_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => dbToNotification(r as Record<string, unknown>));
}

export async function addNotification(
  notification: Omit<Notification, 'id' | 'createdAt'>,
): Promise<void> {
  const { error } = await supabase.from('huawei_notifications').insert({
    user_id: notification.userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    is_read: notification.isRead ?? false,
  });

  if (error) throw error;
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('huawei_notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteNotificationsByUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from('huawei_notifications')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
}

// ─── Daily Income Engine ──────────────────────────────────────────────────────
export async function runDailyIncomeWithStats(): Promise<{
  credited: number;
  total: number;
}> {
  const products = await getProducts();
  const now = new Date();
  let credited = 0;
  let total = 0;

  for (const product of products) {
    if (product.status !== 'active') continue;

    const expiry = new Date(product.expiryDate);
    if (now > expiry) {
      await updateProduct({ ...product, status: 'expired' });
      continue;
    }

    const lastIncome = product.lastIncomeDate
      ? new Date(product.lastIncomeDate)
      : null;

    const hoursSinceLast = lastIncome
      ? (now.getTime() - lastIncome.getTime()) / (1000 * 60 * 60)
      : 25;

    if (hoursSinceLast >= 24) {
      const user = await getUserById(product.userId);
      if (!user) continue;

      await updateUser({
        ...user,
        balance: user.balance + product.dailyIncome,
        totalEarnings: user.totalEarnings + product.dailyIncome,
        dailyEarnings: user.dailyEarnings + product.dailyIncome,
      });

      await updateProduct({
        ...product,
        lastIncomeDate: now.toISOString(),
      totalIncomeEarned: product.totalIncomeEarned + product.dailyIncome,
      });

      await ({
       addNotification userId: product.userId,
        type: 'daily_income',
        title: 'Daily Income Received',
        message: `You earned UGX ${product.dailyIncome.toLocaleString()} from ${product.packageName}`,
        isRead: false,
      });

      credited += 1;
      total += product.dailyIncome;
    }
  }

  return { credited, total };
}

export async function processDailyIncome(): Promise<void> {
  const products = await getProducts();
  const now = new Date();

  for (const product of products) {
    if (product.status !== 'active') continue;

    const expiry = new Date(product.expiryDate);
    if (now > expiry) {
      await updateProduct({ ...product, status: 'expired' });
      continue;
    }

    const lastIncome = product.lastIncomeDate
      ? new Date(product.lastIncomeDate)
      : null;

    const hoursSinceLast = lastIncome
      ? (now.getTime() - lastIncome.getTime()) / (1000 * 60 * 60)
      : 25;

    if (hoursSinceLast >= 24) {
      const user = await getUserById(product.userId);
      if (!user) continue;

      await updateUser({
        ...user,
        balance: user.balance + product.dailyIncome,
        totalEarnings: user.totalEarnings + product.dailyIncome,
        dailyEarnings: user.dailyEarnings + product.dailyIncome,
      });

      await updateProduct({
        ...product,
        lastIncomeDate: now.toISOString(),
        totalIncomeEarned: product.totalIncomeEarned + product.dailyIncome,
      });

      await addNotification({
        userId: product.userId,
        type: 'daily_income',
        title: 'Daily Income Received',
        message: `You earned UGX ${product.dailyIncome.toLocaleString()} from ${product.packageName}`,
        isRead: false,
      });
    }
  }
          }
