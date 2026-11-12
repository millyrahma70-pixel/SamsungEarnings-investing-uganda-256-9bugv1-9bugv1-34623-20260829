import { supabase } from '@/lib/supabase';
import type { User, UserProduct, Recharge, Withdrawal, Wallet, RedeemCode, Notification } from '@/types';
export { startRechargePayment } from '@/lib/recharge';

// ─── Session helpers ────────────────────────────────────────────────────────

const USER_KEY = 'samsung_current_user';
const ADMIN_KEY = 'samsung_admin_session';

export function getCurrentUser(): User | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  if (user) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(USER_KEY);
  }
}

export async function refreshCurrentUser(): Promise<User | null> {
  const cached = getCurrentUser();
  if (!cached) return null;
  const fresh = await getUserById(cached.id);
  if (fresh) setCurrentUser(fresh);
  return fresh;
}

export function getAdminSession(): boolean {
  return sessionStorage.getItem(ADMIN_KEY) === 'true';
}

export function setAdminSession(value: boolean): void {
  if (value) {
    sessionStorage.setItem(ADMIN_KEY, 'true');
  } else {
    sessionStorage.removeItem(ADMIN_KEY);
  }
}

// ─── Row mapper helpers ─────────────────────────────────────────────────────

function mapUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    phone: row.phone as string,
    password: row.password as string,
    name: row.name as string,
    referralCode: row.referral_code as string,
    referredBy: (row.referred_by as string) || null,
    balance: Number(row.balance ?? 0),
    totalEarnings: Number(row.total_earnings ?? 0),
    totalWithdrawal: Number(row.total_withdrawal ?? 0),
    referralEarnings: Number(row.referral_earnings ?? 0),
    dailyEarnings: Number(row.daily_earnings ?? 0),
    registrationBonus: Number(row.registration_bonus ?? 7000),
    lastCheckIn: (row.last_check_in as string) || null,
    createdAt: row.created_at as string,
    claimedMissions: (row.claimed_missions as string[]) || [],
    frozen: Boolean(row.frozen),
  };
}

function mapProduct(row: Record<string, unknown>): UserProduct {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    packageId: row.package_id as string,
    packageName: row.package_name as string,
    packagePrice: Number(row.package_price ?? 0),
    dailyIncome: Number(row.daily_income ?? 0),
    duration: Number(row.duration ?? 0),
    buyDate: row.buy_date as string,
    expiryDate: row.expiry_date as string,
    status: row.status as UserProduct['status'],
    lastIncomeDate: (row.last_income_date as string) || null,
    totalIncomeEarned: Number(row.total_income_earned ?? 0),
    paymentProof: (row.payment_proof as string) || '',
  };
}

function mapRecharge(row: Record<string, unknown>): Recharge {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    userName: (row.user_name as string) || '',
    userPhone: (row.user_phone as string) || '',
    amount: Number(row.amount ?? 0),
    network: row.network as Recharge['network'],
    senderPhone: (row.sender_phone as string) || '',
    senderName: (row.sender_name as string) || '',
    proof: (row.proof as string) || '',
    status: row.status as Recharge['status'],
    createdAt: row.created_at as string,
    processedAt: (row.processed_at as string) || null,
  };
}

function mapWithdrawal(row: Record<string, unknown>): Withdrawal {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    userName: (row.user_name as string) || '',
    userPhone: (row.user_phone as string) || '',
    amount: Number(row.amount ?? 0),
    netAmount: Number(row.net_amount ?? 0),
    walletType: row.wallet_type as Withdrawal['walletType'],
    walletPhone: (row.wallet_phone as string) || '',
    walletName: (row.wallet_name as string) || '',
    status: row.status as Withdrawal['status'],
    createdAt: row.created_at as string,
    processedAt: (row.processed_at as string) || null,
  };
}

function mapWallet(row: Record<string, unknown>): Wallet {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as Wallet['type'],
    phone: row.phone as string,
    name: row.name as string,
    createdAt: row.created_at as string,
  };
}

function mapRedeemCode(row: Record<string, unknown>): RedeemCode {
  return {
    id: row.id as string,
    code: row.code as string,
    amount: Number(row.amount ?? 0),
    createdAt: row.created_at as string,
    expiresAt: row.expires_at as string,
    usedBy: (row.used_by as string[]) || [],
    isActive: Boolean(row.is_active),
  };
}

function mapNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as string,
    title: row.title as string,
    message: row.message as string,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at as string,
  };
}

// ─── Users ──────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('samsung_users')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getUsers error:', error); return []; }
  return (data || []).map(mapUser);
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('samsung_users')
    .select('*')
    .eq('id', id)
    .single();
  if (error) { console.error('getUserById error:', error); return null; }
  return data ? mapUser(data) : null;
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('samsung_users')
    .select('*')
    .eq('phone', phone)
    .single();
  if (error && error.code !== 'PGRST116') { console.error('getUserByPhone error:', error); }
  return data ? mapUser(data) : null;
}

export async function getUserByReferralCode(code: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('samsung_users')
    .select('*')
    .eq('referral_code', code)
    .single();
  if (error && error.code !== 'PGRST116') { console.error('getUserByReferralCode error:', error); }
  return data ? mapUser(data) : null;
}

export async function createUser(user: Omit<User, 'createdAt'>): Promise<User | null> {
  const { data, error } = await supabase
    .from('samsung_users')
    .insert({
      id: user.id || crypto.randomUUID(),
      phone: user.phone,
      password: user.password,
      name: user.name,
      referral_code: user.referralCode,
      referred_by: user.referredBy || null,
      balance: user.balance,
      total_earnings: user.totalEarnings,
      total_withdrawal: user.totalWithdrawal,
      referral_earnings: user.referralEarnings,
      daily_earnings: user.dailyEarnings,
      registration_bonus: user.registrationBonus,
      last_check_in: user.lastCheckIn || null,
      claimed_missions: user.claimedMissions || [],
      frozen: user.frozen || false,
    })
    .select()
    .single();
  if (error) { console.error('createUser error:', error); return null; }
  return data ? mapUser(data) : null;
}

export async function updateUser(
  userOrId: User | string,
  patch?: Partial<Record<string, unknown>>
): Promise<void> {
  let id: string;
  let updateData: Record<string, unknown>;

  if (typeof userOrId === 'string') {
    id = userOrId;
    const p = patch || {};
    updateData = {};
    if ('balance' in p) updateData.balance = p.balance;
    if ('totalEarnings' in p) updateData.total_earnings = p.totalEarnings;
    if ('totalWithdrawal' in p) updateData.total_withdrawal = p.totalWithdrawal;
    if ('referralEarnings' in p) updateData.referral_earnings = p.referralEarnings;
    if ('dailyEarnings' in p) updateData.daily_earnings = p.dailyEarnings;
    if ('frozen' in p) updateData.frozen = p.frozen;
    if ('password' in p) updateData.password = p.password;
    if ('claimedMissions' in p) updateData.claimed_missions = p.claimedMissions;
    if ('lastCheckIn' in p) updateData.last_check_in = p.lastCheckIn;
    if ('name' in p) updateData.name = p.name;
  } else {
    id = userOrId.id;
    updateData = {
      phone: userOrId.phone,
      password: userOrId.password,
      name: userOrId.name,
      referral_code: userOrId.referralCode,
      referred_by: userOrId.referredBy || null,
      balance: userOrId.balance,
      total_earnings: userOrId.totalEarnings,
      total_withdrawal: userOrId.totalWithdrawal,
      referral_earnings: userOrId.referralEarnings,
      daily_earnings: userOrId.dailyEarnings,
      registration_bonus: userOrId.registrationBonus,
      last_check_in: userOrId.lastCheckIn || null,
      claimed_missions: userOrId.claimedMissions || [],
      frozen: userOrId.frozen || false,
    };
  }

  const { error } = await supabase
    .from('samsung_users')
    .update(updateData)
    .eq('id', id);
  if (error) console.error('updateUser error:', error);
}

export async function deleteUserById(id: string): Promise<void> {
  const { error } = await supabase.from('samsung_users').delete().eq('id', id);
  if (error) console.error('deleteUserById error:', error);
}

// ─── Products ───────────────────────────────────────────────────────────────

export async function getProducts(): Promise<UserProduct[]> {
  const { data, error } = await supabase
    .from('samsung_products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getProducts error:', error); return []; }
  return (data || []).map(mapProduct);
}

export async function getUserProducts(userId: string): Promise<UserProduct[]> {
  const { data, error } = await supabase
    .from('samsung_products')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserProducts error:', error); return []; }
  return (data || []).map(mapProduct);
}

export async function createProduct(product: {
  user_id: string;
  package_id: string;
  package_name: string;
  package_price: number;
  daily_income: number;
  duration: number;
  status: string;
  buy_date: string;
  expiry_date: string;
  last_income_date: string;
  total_income_earned: number;
  payment_proof: string;
}): Promise<void> {
  const { error } = await supabase.from('samsung_products').insert(product);
  if (error) console.error('createProduct error:', error);
}

// ─── Recharges ──────────────────────────────────────────────────────────────

export async function getRecharges(): Promise<Recharge[]> {
  const { data, error } = await supabase
    .from('samsung_recharges')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getRecharges error:', error); return []; }
  return (data || []).map(mapRecharge);
}

export async function getUserRecharges(userId: string): Promise<Recharge[]> {
  const { data, error } = await supabase
    .from('samsung_recharges')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserRecharges error:', error); return []; }
  return (data || []).map(mapRecharge);
}

export async function createRecharge(recharge: Recharge): Promise<void> {
  const { error } = await supabase.from('samsung_recharges').insert({
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
    created_at: recharge.createdAt,
    processed_at: recharge.processedAt,
  });
  if (error) console.error('createRecharge error:', error);
}

export async function updateRecharge(
  id: string,
  patch: Partial<{ status: string; processedAt: string }>
): Promise<void> {
  const updateData: Record<string, unknown> = {};
  if (patch.status !== undefined) updateData.status = patch.status;
  if (patch.processedAt !== undefined) updateData.processed_at = patch.processedAt;
  const { error } = await supabase.from('samsung_recharges').update(updateData).eq('id', id);
  if (error) console.error('updateRecharge error:', error);
}

// ─── Withdrawals ─────────────────────────────────────────────────────────────

export async function getWithdrawals(): Promise<Withdrawal[]> {
  const { data, error } = await supabase
    .from('samsung_withdrawals')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getWithdrawals error:', error); return []; }
  return (data || []).map(mapWithdrawal);
}

export async function getUserWithdrawals(userId: string): Promise<Withdrawal[]> {
  const { data, error } = await supabase
    .from('samsung_withdrawals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserWithdrawals error:', error); return []; }
  return (data || []).map(mapWithdrawal);
}

export async function createWithdrawal(withdrawal: Withdrawal): Promise<void> {
  const { error } = await supabase.from('samsung_withdrawals').insert({
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
    created_at: withdrawal.createdAt,
    processed_at: withdrawal.processedAt,
  });
  if (error) console.error('createWithdrawal error:', error);
}

export async function updateWithdrawal(
  id: string,
  patch: Partial<{ status: string; processedAt: string }>
): Promise<void> {
  const updateData: Record<string, unknown> = {};
  if (patch.status !== undefined) updateData.status = patch.status;
  if (patch.processedAt !== undefined) updateData.processed_at = patch.processedAt;
  const { error } = await supabase.from('samsung_withdrawals').update(updateData).eq('id', id);
  if (error) console.error('updateWithdrawal error:', error);
}

// ─── Wallets ─────────────────────────────────────────────────────────────────

export async function getUserWallets(userId: string): Promise<Wallet[]> {
  const { data, error } = await supabase
    .from('samsung_wallets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserWallets error:', error); return []; }
  return (data || []).map(mapWallet);
}

export async function saveWallet(wallet: Wallet): Promise<void> {
  const { error } = await supabase.from('samsung_wallets').insert({
    id: wallet.id,
    user_id: wallet.userId,
    type: wallet.type,
    phone: wallet.phone,
    name: wallet.name,
    created_at: wallet.createdAt,
  });
  if (error) console.error('saveWallet error:', error);
}

export async function deleteWalletsByUser(userId: string): Promise<void> {
  const { error } = await supabase.from('samsung_wallets').delete().eq('user_id', userId);
  if (error) console.error('deleteWalletsByUser error:', error);
}

// ─── Notifications ───────────────────────────────────────────────────────────

export async function getNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('samsung_notifications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getNotifications error:', error); return []; }
  return (data || []).map(mapNotification);
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('samsung_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserNotifications error:', error); return []; }
  return (data || []).map(mapNotification);
}

export async function addNotification(
  userIdOrObj: string | { userId: string; type: string; title: string; message: string; isRead: boolean },
  type?: string,
  title?: string,
  message?: string
): Promise<void> {
  let userId: string;
  let notifType: string;
  let notifTitle: string;
  let notifMessage: string;

  if (typeof userIdOrObj === 'string') {
    userId = userIdOrObj;
    notifType = type!;
    notifTitle = title!;
    notifMessage = message!;
  } else {
    userId = userIdOrObj.userId;
    notifType = userIdOrObj.type;
    notifTitle = userIdOrObj.title;
    notifMessage = userIdOrObj.message;
  }

  const { error } = await supabase.from('samsung_notifications').insert({
    user_id: userId,
    type: notifType,
    title: notifTitle,
    message: notifMessage,
    is_read: false,
  });
  if (error) console.error('addNotification error:', error);
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('samsung_notifications')
    .update({ is_read: true })
    .eq('id', id);
  if (error) console.error('markNotificationRead error:', error);
}

// ─── Redeem Codes ─────────────────────────────────────────────────────────────

export async function getRedeemCodes(): Promise<RedeemCode[]> {
  const { data, error } = await supabase
    .from('samsung_redeem_codes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getRedeemCodes error:', error); return []; }
  return (data || []).map(mapRedeemCode);
}

export async function createRedeemCode(code: RedeemCode): Promise<void> {
  const { error } = await supabase.from('samsung_redeem_codes').insert({
    id: code.id,
    code: code.code,
    amount: code.amount,
    created_at: code.createdAt,
    expires_at: code.expiresAt,
    used_by: code.usedBy,
    is_active: code.isActive,
  });
  if (error) console.error('createRedeemCode error:', error);
}

export async function updateRedeemCode(code: RedeemCode): Promise<void> {
  const { error } = await supabase
    .from('samsung_redeem_codes')
    .update({
      code: code.code,
      amount: code.amount,
      expires_at: code.expiresAt,
      used_by: code.usedBy,
      is_active: code.isActive,
    })
    .eq('id', code.id);
  if (error) console.error('updateRedeemCode error:', error);
}

export async function deleteRedeemCodeById(id: string): Promise<void> {
  const { error } = await supabase.from('samsung_redeem_codes').delete().eq('id', id);
  if (error) console.error('deleteRedeemCodeById error:', error);
}

// ─── Daily Income Engine ──────────────────────────────────────────────────────

export async function processDailyIncome(): Promise<{ processed: number; totalPaid: number }> {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const { data: activeProducts, error } = await supabase
    .from('samsung_products')
    .select('*')
    .eq('status', 'active');

  if (error) { console.error('processDailyIncome fetch error:', error); return { processed: 0, totalPaid: 0 }; }

  let processed = 0;
  let totalPaid = 0;

  for (const row of (activeProducts || [])) {
    const product = mapProduct(row);
    const lastDate = product.lastIncomeDate?.split('T')[0];

    // Skip if already processed today
    if (lastDate === today) continue;

    // Check if expired
    if (new Date(product.expiryDate) < now) {
      await supabase.from('samsung_products').update({ status: 'expired' }).eq('id', product.id);
      continue;
    }

    // Credit daily income
    const income = product.dailyIncome;
    const newTotal = product.totalIncomeEarned + income;

    await supabase.from('samsung_products').update({
      last_income_date: now.toISOString(),
      total_income_earned: newTotal,
    }).eq('id', product.id);

    // Update user balance
    const { data: userData } = await supabase
      .from('samsung_users')
      .select('balance, total_earnings, daily_earnings, referred_by')
      .eq('id', product.userId)
      .single();

    if (userData) {
      await supabase.from('samsung_users').update({
        balance: Number(userData.balance) + income,
        total_earnings: Number(userData.total_earnings) + income,
        daily_earnings: Number(userData.daily_earnings) + income,
      }).eq('id', product.userId);

      // Send notification
      await supabase.from('samsung_notifications').insert({
        user_id: product.userId,
        type: 'income',
        title: 'Daily Income Credited',
        message: `UGX ${income.toLocaleString()} daily income from ${product.packageName} has been added to your balance.`,
        is_read: false,
      });

      // Referral commissions L1 (30%), L2 (2%), L3 (1%)
      if (userData.referred_by) {
        const l1Commission = Math.floor(income * 0.30);
        const { data: l1Data } = await supabase
          .from('samsung_users')
          .select('balance, total_earnings, referral_earnings, referred_by')
          .eq('id', userData.referred_by)
          .single();
        if (l1Data) {
          await supabase.from('samsung_users').update({
            balance: Number(l1Data.balance) + l1Commission,
            total_earnings: Number(l1Data.total_earnings) + l1Commission,
            referral_earnings: Number(l1Data.referral_earnings) + l1Commission,
          }).eq('id', userData.referred_by);

          if (l1Data.referred_by) {
            const l2Commission = Math.floor(income * 0.02);
            const { data: l2Data } = await supabase
              .from('samsung_users')
              .select('balance, total_earnings, referral_earnings, referred_by')
              .eq('id', l1Data.referred_by)
              .single();
            if (l2Data) {
              await supabase.from('samsung_users').update({
                balance: Number(l2Data.balance) + l2Commission,
                total_earnings: Number(l2Data.total_earnings) + l2Commission,
                referral_earnings: Number(l2Data.referral_earnings) + l2Commission,
              }).eq('id', l1Data.referred_by);

              if (l2Data.referred_by) {
                const l3Commission = Math.floor(income * 0.01);
                const { data: l3Data } = await supabase
                  .from('samsung_users')
                  .select('balance, total_earnings, referral_earnings')
                  .eq('id', l2Data.referred_by)
                  .single();
                if (l3Data) {
                  await supabase.from('samsung_users').update({
                    balance: Number(l3Data.balance) + l3Commission,
                    total_earnings: Number(l3Data.total_earnings) + l3Commission,
                    referral_earnings: Number(l3Data.referral_earnings) + l3Commission,
                  }).eq('id', l2Data.referred_by);
                }
              }
            }
          }
        }
      }
    }

    processed++;
    totalPaid += income;
  }

  return { processed, totalPaid };
}

export async function runDailyIncomeWithStats(): Promise<{ processed: number; totalPaid: number }> {
  return processDailyIncome();
  }
