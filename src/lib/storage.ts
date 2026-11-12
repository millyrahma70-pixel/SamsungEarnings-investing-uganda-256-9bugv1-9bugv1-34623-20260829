import { supabase } from '@/lib/supabase';
import type { User, UserProduct, Recharge, Withdrawal, Wallet, RedeemCode, Notification } from '@/types';

const USER_KEY = 'huawei_current_user';
const ADMIN_KEY = 'huawei_mobile_earning_admin_session';

export function getCurrentUser(): User | null {
  try { const raw = localStorage.getItem(USER_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function setCurrentUser(user: User | null): void {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user)); else localStorage.removeItem(USER_KEY);
}
export async function refreshCurrentUser(): Promise<User | null> {
  const cached = getCurrentUser(); if (!cached) return null;
  const fresh = await getUserById(cached.id); if (fresh) setCurrentUser(fresh); return fresh;
}
export function getAdminSession(): boolean { return localStorage.getItem(ADMIN_KEY) === 'true'; }
export function setAdminSession(v: boolean): void { if (v) localStorage.setItem(ADMIN_KEY, 'true'); else localStorage.removeItem(ADMIN_KEY); }

export async function startRechargePayment(params: { userId: string; userName?: string; userPhone?: string; amount: number; network?: string; senderPhone?: string; senderName?: string; }): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase.from('huawei_recharges').insert({
      id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `rc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      user_id: params.userId, user_name: params.userName ?? '', user_phone: params.userPhone ?? params.senderPhone ?? '',
      amount: params.amount, network: params.network ?? 'MTN', sender_phone: params.senderPhone ?? params.userPhone ?? '',
      sender_name: params.senderName ?? params.userName ?? '', proof: 'WAITING-ADMIN', status: 'pending',
    });
    if (error) throw error;
    return { success: true, message: 'Recharge request sent. Admin will send you a payment prompt. Enter your PIN to complete.' };
  } catch (e) { console.error(e); return { success: false, message: 'Failed to create recharge request. Try again.' }; }
}

function mapUser(r: Record<string, unknown>): User {
  return { id: r.id as string, phone: r.phone as string, password: r.password as string, name: r.name as string, referralCode: r.referral_code as string, referredBy: (r.referred_by as string) || null, balance: Number(r.balance ?? 0), totalEarnings: Number(r.total_earnings ?? 0), totalWithdrawal: Number(r.total_withdrawal ?? 0), referralEarnings: Number(r.referral_earnings ?? 0), dailyEarnings: Number(r.daily_earnings ?? 0), registrationBonus: Number(r.registration_bonus ?? 9000), lastCheckIn: (r.last_check_in as string) || null, createdAt: r.created_at as string, claimedMissions: (r.claimed_missions as string[]) || [], frozen: Boolean(r.frozen) };
}
function mapProduct(r: Record<string, unknown>): UserProduct {
  return { id: r.id as string, userId: r.user_id as string, packageId: r.package_id as string, packageName: r.package_name as string, packagePrice: Number(r.package_price ?? 0), dailyIncome: Number(r.daily_income ?? 0), duration: Number(r.duration ?? 0), buyDate: r.buy_date as string, expiryDate: r.expiry_date as string, status: r.status as UserProduct['status'], lastIncomeDate: (r.last_income_date as string) || null, totalIncomeEarned: Number(r.total_income_earned ?? 0), paymentProof: (r.payment_proof as string) || '' };
}
function mapRecharge(r: Record<string, unknown>): Recharge {
  return { id: r.id as string, userId: r.user_id as string, userName: (r.user_name as string) || '', userPhone: (r.user_phone as string) || '', amount: Number(r.amount ?? 0), network: r.network as Recharge['network'], senderPhone: (r.sender_phone as string) || '', senderName: (r.sender_name as string) || '', proof: (r.proof as string) || '', status: r.status as Recharge['status'], createdAt: r.created_at as string, processedAt: (r.processed_at as string) || null };
}
function mapWithdrawal(r: Record<string, unknown>): Withdrawal {
  return { id: r.id as string, userId: r.user_id as string, userName: (r.user_name as string) || '', userPhone: (r.user_phone as string) || '', amount: Number(r.amount ?? 0), netAmount: Number(r.net_amount ?? 0), walletType: r.wallet_type as Withdrawal['walletType'], walletPhone: (r.wallet_phone as string) || '', walletName: (r.wallet_name as string) || '', status: r.status as Withdrawal['status'], createdAt: r.created_at as string, processedAt: (r.processed_at as string) || null };
}
function mapWallet(r: Record<string, unknown>): Wallet {
  return { id: r.id as string, userId: r.user_id as string, type: r.type as Wallet['type'], phone: r.phone as string, name: r.name as string, createdAt: r.created_at as string };
}
function mapRedeemCode(r: Record<string, unknown>): RedeemCode {
  return { id: r.id as string, code: r.code as string, amount: Number(r.amount ?? 0), createdAt: r.created_at as string, expiresAt: r.expires_at as string, usedBy: (r.used_by as string[]) || [], isActive: Boolean(r.is_active) };
}
function mapNotification(r: Record<string, unknown>): Notification {
  return { id: r.id as string, userId: r.user_id as string, type: r.type as string, title: r.title as string, message: r.message as string, isRead: Boolean(r.is_read), createdAt: r.created_at as string };
}

// USERS
export async function getUsers(): Promise<User[]> { const { data, error } = await supabase.from('huawei_users').select('*').order('created_at', { ascending: false }); if (error) { console.error(error); return []; } return (data || []).map(mapUser); }
export async function getUserById(id: string): Promise<User | null> { const { data, error } = await supabase.from('huawei_users').select('*').eq('id', id).single(); if (error) return null; return data ? mapUser(data) : null; }
export async function getUserByPhone(phone: string): Promise<User | null> { const { data, error } = await supabase.from('huawei_users').select('*').eq('phone', phone).single(); if (error && error.code !== 'PGRST116') console.error(error); return data ? mapUser(data) : null; }
export async function getUserByReferralCode(code: string): Promise<User | null> { const { data, error } = await supabase.from('huawei_users').select('*').eq('referral_code', code).single(); if (error && error.code !== 'PGRST116') console.error(error); return data ? mapUser(data) : null; }
export async function createUser(user: Omit<User, 'createdAt'>): Promise<User | null> {
  const { data, error } = await supabase.from('huawei_users').insert({ id: user.id || crypto.randomUUID(), phone: user.phone, password: user.password, name: user.name, referral_code: user.referralCode, referred_by: user.referredBy || null, balance: user.balance, total_earnings: user.totalEarnings, total_withdrawal: user.totalWithdrawal, referral_earnings: user.referralEarnings, daily_earnings: user.dailyEarnings, registration_bonus: user.registrationBonus, last_check_in: user.lastCheckIn || null, claimed_missions: user.claimedMissions || [], frozen: user.frozen || false }).select().single();
  if (error) { console.error('createUser error:', error); return null; } return data ? mapUser(data) : null;
}
export async function updateUser(userOrId: User | string, patch?: Partial<Record<string, unknown>>): Promise<void> {
  let id: string; let updateData: Record<string, unknown>;
  if (typeof userOrId === 'string') { id = userOrId; const p = patch || {}; updateData = {}; if ('balance' in p) updateData.balance = p.balance; if ('totalEarnings' in p) updateData.total_earnings = p.totalEarnings; if ('totalWithdrawal' in p) updateData.total_withdrawal = p.totalWithdrawal; if ('referralEarnings' in p) updateData.referral_earnings = p.referralEarnings; if ('dailyEarnings' in p) updateData.daily_earnings = p.dailyEarnings; if ('frozen' in p) updateData.frozen = p.frozen; if ('password' in p) updateData.password = p.password; if ('claimedMissions' in p) updateData.claimed_missions = p.claimedMissions; if ('lastCheckIn' in p) updateData.last_check_in = p.lastCheckIn; if ('name' in p) updateData.name = p.name; }
  else { id = userOrId.id; updateData = { phone: userOrId.phone, password: userOrId.password, name: userOrId.name, referral_code: userOrId.referralCode, referred_by: userOrId.referredBy || null, balance: userOrId.balance, total_earnings: userOrId.totalEarnings, total_withdrawal: userOrId.totalWithdrawal, referral_earnings: userOrId.referralEarnings, daily_earnings: userOrId.dailyEarnings, registration_bonus: userOrId.registrationBonus, last_check_in: userOrId.lastCheckIn || null, claimed_missions: userOrId.claimedMissions || [], frozen: userOrId.frozen || false }; }
  const { error } = await supabase.from('huawei_users').update(updateData).eq('id', id); if (error) console.error(error); else { const c = getCurrentUser(); if (c?.id === id && typeof userOrId !== 'string') setCurrentUser(userOrId); }
}
export async function deleteUserById(id: string): Promise<void> { const { error } = await supabase.from('huawei_users').delete().eq('id', id); if (error) console.error(error); }

// PRODUCTS
export async function getProducts(): Promise<UserProduct[]> { const { data, error } = await supabase.from('huawei_products').select('*').order('created_at', { ascending: false }); if (error) return []; return (data || []).map(mapProduct); }
export async function getUserProducts(userId: string): Promise<UserProduct[]> { const { data, error } = await supabase.from('huawei_products').select('*').eq('user_id', userId).order('created_at', { ascending: false }); if (error) return []; return (data || []).map(mapProduct); }
export async function createProduct(product: { user_id: string; package_id: string; package_name: string; package_price: number; daily_income: number; duration: number; status: string; buy_date: string; expiry_date: string; last_income_date: string; total_income_earned: number; payment_proof: string; }): Promise<void> { const { error } = await supabase.from('huawei_products').insert(product); if (error) console.error(error); }
export async function updateProduct(p: UserProduct): Promise<void> { const { error } = await supabase.from('huawei_products').update({ package_id: p.packageId, package_name: p.packageName, package_price: p.packagePrice, daily_income: p.dailyIncome, duration: p.duration, status: p.status, buy_date: p.buyDate, expiry_date: p.expiryDate, last_income_date: p.lastIncomeDate, total_income_earned: p.totalIncomeEarned, payment_proof: p.paymentProof }).eq('id', p.id); if (error) console.error(error); }
export async function deleteProduct(id: string): Promise<void> { const { error } = await supabase.from('huawei_products').delete().eq('id', id); if (error) console.error(error); }

// RECHARGES
export async function getRecharges(): Promise<Recharge[]> { const { data, error } = await supabase.from('huawei_recharges').select('*').order('created_at', { ascending: false }); if (error) return []; return (data || []).map(mapRecharge); }
export async function getUserRecharges(userId: string): Promise<Recharge[]> { const { data, error } = await supabase.from('huawei_recharges').select('*').eq('user_id', userId).order('created_at', { ascending: false }); if (error) return []; return (data || []).map(mapRecharge); }
export async function createRecharge(recharge: Recharge): Promise<void> { const { error } = await supabase.from('huawei_recharges').insert({ id: recharge.id, user_id: recharge.userId, user_name: recharge.userName, user_phone: recharge.userPhone, amount: recharge.amount, network: recharge.network, sender_phone: recharge.senderPhone, sender_name: recharge.senderName, proof: 'WAITING-ADMIN', status: 'pending', created_at: recharge.createdAt, processed_at: recharge.processedAt }); if (error) console.error(error); }
export async function updateRecharge(id: string, patch: Partial<{ status: string; processedAt: string }>): Promise<void> { const u: Record<string, unknown> = {}; if (patch.status !== undefined) u.status = patch.status; if (patch.processedAt !== undefined) u.processed_at = patch.processedAt; const { error } = await supabase.from('huawei_recharges').update(u).eq('id', id); if (error) console.error(error); }

// WITHDRAWALS
export async function getWithdrawals(): Promise<Withdrawal[]> { const { data, error } = await supabase.from('huawei_withdrawals').select('*').order('created_at', { ascending: false }); if (error) return []; return (data || []).map(mapWithdrawal); }
export async function getUserWithdrawals(userId: string): Promise<Withdrawal[]> { const { data, error } = await supabase.from('huawei_withdrawals').select('*').eq('user_id', userId).order('created_at', { ascending: false }); if (error) return []; return (data || []).map(mapWithdrawal); }
export async function createWithdrawal(w: Withdrawal): Promise<void> { const { error } = await supabase.from('huawei_withdrawals').insert({ id: w.id, user_id: w.userId, user_name: w.userName, user_phone: w.userPhone, amount: w.amount, net_amount: w.netAmount, wallet_type: w.walletType, wallet_phone: w.walletPhone, wallet_name: w.walletName, status: w.status, created_at: w.createdAt, processed_at: w.processedAt }); if (error) console.error(error); }
export async function updateWithdrawal(id: string, patch: Partial<{ status: string; processedAt: string }>): Promise<void> { const u: Record<string, unknown> = {}; if (patch.status !== undefined) u.status = patch.status; if (patch.processedAt !== undefined) u.processed_at = patch.processedAt; const { error } = await supabase.from('huawei_withdrawals').update(u).eq('id', id); if (error) console.error(error); }

// WALLETS
export async function getUserWallets(userId: string): Promise<Wallet[]> { const { data, error } = await supabase.from('huawei_wallets').select('*').eq('user_id', userId).order('created_at', { ascending: false }); if (error) return []; return (data || []).map(mapWallet); }
export async function saveWallet(wallet: Wallet): Promise<void> { const { error } = await supabase.from('huawei_wallets').insert({ id: wallet.id, user_id: wallet.userId, type: wallet.type, phone: wallet.phone, name: wallet.name, created_at: wallet.createdAt }); if (error) console.error(error); }
export async function deleteWalletsByUser(userId: string): Promise<void> { const { error } = await supabase.from('huawei_wallets').delete().eq('user_id', userId); if (error) console.error(error); }

// NOTIFICATIONS
export async function getNotifications(): Promise<Notification[]> { const { data, error } = await supabase.from('huawei_notifications').select('*').order('created_at', { ascending: false }); if (error) return []; return (data || []).map(mapNotification); }
export async function getUserNotifications(userId: string): Promise<Notification[]> { const { data, error } = await supabase.from('huawei_notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }); if (error) return []; return (data || []).map(mapNotification); }
export async function addNotification(userIdOrObj: string | { userId: string; type: string; title: string; message: string; isRead: boolean }, type?: string, title?: string, message?: string): Promise<void> {
  let userId: string; let t: string; let ti: string; let m: string;
  if (typeof userIdOrObj === 'string') { userId = userIdOrObj; t = type!; ti = title!; m = message!; } else { userId = userIdOrObj.userId; t = userIdOrObj.type; ti = userIdOrObj.title; m = userIdOrObj.message; }
  const { error } = await supabase.from('huawei_notifications').insert({ user_id: userId, type: t, title: ti, message: m, is_read: false }); if (error) console.error(error);
}
export async function markNotificationRead(id: string): Promise<void> { const { error } = await supabase.from('huawei_notifications').update({ is_read: true }).eq('id', id); if (error) console.error(error); }
export async function deleteNotificationsByUser(userId: string): Promise<void> { const { error } = await supabase.from('huawei_notifications').delete().eq('user_id', userId); if (error) console.error(error); }

// REDEEM CODES
export async function getRedeemCodes(): Promise<RedeemCode[]> { const { data, error } = await supabase.from('huawei_redeem_codes').select('*').order('created_at', { ascending: false }); if (error) return []; return (data || []).map(mapRedeemCode); }
export async function createRedeemCode(code: RedeemCode): Promise<void> { const { error } = await supabase.from('huawei_redeem_codes').insert({ id: code.id, code: code.code, amount: code.amount, created_at: code.createdAt, expires_at: code.expiresAt, used_by: code.usedBy, is_active: code.isActive }); if (error) console.error(error); }
export async function updateRedeemCode(code: RedeemCode): Promise<void> { const { error } = await supabase.from('huawei_redeem_codes').update({ code: code.code, amount: code.amount, expires_at: code.expiresAt, used_by: code.usedBy, is_active: code.isActive }).eq('id', code.id); if (error) console.error(error); }
export async function deleteRedeemCodeById(id: string): Promise<void> { const { error } = await supabase.from('huawei_redeem_codes').delete().eq('id', id); if (error) console.error(error); }

// DAILY INCOME
export async function processDailyIncome(): Promise<{ processed: number; totalPaid: number }> {
  const now = new Date();
  const { data: activeProducts, error } = await supabase.from('huawei_products').select('*').eq('status', 'active');
  if (error) return { processed: 0, totalPaid: 0 };
  let processed = 0; let totalPaid = 0;
  for (const row of (activeProducts || [])) {
    const product = mapProduct(row);
    const lastPay = product.lastIncomeDate ? new Date(product.lastIncomeDate) : new Date(product.buyDate);
    const hoursSince = (now.getTime() - lastPay.getTime()) / (1000 * 60 * 60);
    if (hoursSince < 24) continue;
    if (new Date(product.expiryDate) < now) { await supabase.from('huawei_products').update({ status: 'expired' }).eq('id', product.id); continue; }
    const income = product.dailyIncome; const newTotal = product.totalIncomeEarned + income;
    await supabase.from('huawei_products').update({ last_income_date: now.toISOString(), total_income_earned: newTotal }).eq('id', product.id);
    const { data: userData } = await supabase.from('huawei_users').select('balance, total_earnings, daily_earnings, referred_by').eq('id', product.userId).single();
    if (userData) {
      await supabase.from('huawei_users').update({ balance: Number(userData.balance) + income, total_earnings: Number(userData.total_earnings) + income, daily_earnings: Number(userData.daily_earnings) + income }).eq('id', product.userId);
      await supabase.from('huawei_notifications').insert({ user_id: product.userId, type: 'income', title: 'Daily Income Credited', message: `UGX ${income.toLocaleString()} daily income from ${product.packageName} has been added to your balance.`, is_read: false });
      if (userData.referred_by) {
        const l1Commission = Math.floor(income * 0.27);
        const { data: l1Data } = await supabase.from('huawei_users').select('balance, total_earnings, referral_earnings, referred_by').eq('id', userData.referred_by).single();
        if (l1Data) {
          await supabase.from('huawei_users').update({ balance: Number(l1Data.balance) + l1Commission, total_earnings: Number(l1Data.total_earnings) + l1Commission, referral_earnings: Number(l1Data.referral_earnings) + l1Commission }).eq('id', userData.referred_by);
          if (l1Data.referred_by) {
            const l2Commission = Math.floor(income * 0.02);
            const { data: l2Data } = await supabase.from('huawei_users').select('balance, total_earnings, referral_earnings, referred_by').eq('id', l1Data.referred_by).single();
            if (l2Data) {
              await supabase.from('huawei_users').update({ balance: Number(l2Data.balance) + l2Commission, total_earnings: Number(l2Data.total_earnings) + l2Commission, referral_earnings: Number(l2Data.referral_earnings) + l2Commission }).eq('id', l1Data.referred_by);
              if (l2Data.referred_by) {
                const l3Commission = Math.floor(income * 0.01);
                const { data: l3Data } = await supabase.from('huawei_users').select('balance, total_earnings, referral_earnings').eq('id', l2Data.referred_by).single();
                if (l3Data) await supabase.from('huawei_users').update({ balance: Number(l3Data.balance) + l3Commission, total_earnings: Number(l3Data.total_earnings) + l3Commission, referral_earnings: Number(l3Data.referral_earnings) + l3Commission }).eq('id', l2Data.referred_by);
              }
            }
          }
        }
      }
    }
    processed++; totalPaid += income;
  }
  return { processed, totalPaid };
}
export async function runDailyIncomeWithStats(): Promise<{ processed: number; totalPaid: number }> { return processDailyIncome(); }
