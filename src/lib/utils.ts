import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { getCurrentUser, startRechargePayment } from '@/lib/storage';
import { formatUGX } from '@/lib/utils';
import { MIN_DEPOSIT } from '@/constants/packages';
import type { User } from '@/types';

type Network = 'mtn' | 'airtel';

const Recharge = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [amount, setAmount] = useState('');
  const [network, setNetwork] = useState<Network>('mtn');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderName, setSenderName] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState('');
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      navigate('/login');
      return;
    }

    setUser(currentUser);
    setSenderPhone(currentUser.phone ?? '');
    setSenderName(currentUser.name ?? '');
  }, [navigate]);

  const handleContinue = () => {
    const parsedAmount = Number(amount);

    if (!Number.isSafeInteger(parsedAmount) || parsedAmount < MIN_DEPOSIT) {
      toast.error(`Minimum deposit is ${formatUGX(MIN_DEPOSIT)}`);
      return;
    }

    setStep(2);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please log in again.');
      navigate('/login');
      return;
    }

    if (!senderPhone.trim() || !senderName.trim()) {
      toast.error('Enter the mobile money phone number and account name.');
      return;
    }

    setSubmitting(true);

    try {
      const result = await startRechargePayment({
        amount: Number(amount),
        network,
        senderPhone: senderPhone.trim(),
        senderName: senderName.trim(),
        userId: user.id,
        userName: user.name,
        userPhone: user.phone,
      });

      setReference(result.reference);
      setPaymentUrl(result.paymentUrl);
      setStep(3);
      toast.success('Payment request started.');
    } catch (error) {
      console.error('Unable to start recharge:', error);
      toast.error(
        error instanceof Error ? error.message : 'Unable to start payment.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openPayment = () => {
    if (!paymentUrl) {
      toast.error('No payment link was returned. Please contact support.');
      return;
    }

    window.location.assign(paymentUrl);
  };

  return (
    <div className="app-container min-h-screen bg-gray-50">
      <header className="flex items-center border-b border-gray-100 bg-white px-4 py-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mr-3"
          aria-label="Go back"
        >
          <ArrowLeft className="h-6 w-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Recharge</h1>
      </header>

      {step === 1 && (
        <main className="space-y-4 px-4 py-5">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-700">
              Minimum deposit: {formatUGX(MIN_DEPOSIT)}
            </p>
            <p className="mt-1 text-xs text-amber-600">
              Choose a payment network and amount to continue.
            </p>
          </div>

          <div>
            <label
              htmlFor="amount"
              className="mb-2 block text-sm font-medium text-gray-600"
            >
              Amount (UGX)
            </label>
            <input
              id="amount"
              type="number"
              min={MIN_DEPOSIT}
              step="1"
              inputMode="numeric"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder={`Minimum ${formatUGX(MIN_DEPOSIT)}`}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-800 outline-none"
            />
          </div>

          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-gray-600">
              Mobile money network
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {(['mtn', 'airtel'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={network === option}
                  onClick={() => setNetwork(option)}
                  className={`rounded-xl border-2 py-3 text-sm font-semibold transition-colors ${
                    network === option
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  {option === 'mtn' ? 'MTN MoMo' : 'Airtel Money'}
                </button>
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={handleContinue}
            className="w-full rounded-xl py-4 text-base font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
            }}
          >
            Continue
          </button>
        </main>
      )}

      {step === 2 && (
        <main className="space-y-4 px-4 py-5">
          <div className="rounded-2xl p-5 text-white" style={{
            background: 'linear-gradient(135deg, #0a0f2e, #1d4ed8)',
          }}>
            <p className="text-sm text-white/75">Recharge amount</p>
            <p className="mt-1 text-2xl font-bold">
              {formatUGX(Number(amount))}
            </p>
            <p className="mt-2 text-sm text-blue-100">
              {network === 'mtn' ? 'MTN MoMo' : 'Airtel Money'} via PesaJet
            </p>
          </div>

          <div>
            <label
              htmlFor="sender-phone"
              className="mb-2 block text-sm font-medium text-gray-600"
            >
              Mobile money phone number
            </label>
            <input
              id="sender-phone"
              type="tel"
              autoComplete="tel"
              value={senderPhone}
              onChange={(event) => setSenderPhone(event.target.value)}
              placeholder="07XXXXXXXX"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-800 outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="sender-name"
              className="mb-2 block text-sm font-medium text-gray-600"
            >
              Account name
            </label>
            <input
              id="sender-name"
              type="text"
              autoComplete="name"
              value={senderName}
              onChange={(event) => setSenderName(event.target.value)}
              placeholder="Name on the mobile money account"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-800 outline-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={submitting}
              className="flex-1 rounded-xl border border-gray-200 py-4 font-semibold text-gray-600 disabled:opacity-60"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-4 font-bold text-white disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
              }}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Starting payment…' : 'Pay with PesaJet'}
            </button>
          </div>
        </main>
      )}

      {step === 3 && (
        <main className="flex flex-col items-center px-4 py-8">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
            <span className="text-4xl" aria-hidden="true">⏳</span>
          </div>

          <h2 className="mb-2 text-xl font-bold text-gray-800">
            Payment request started
          </h2>
          <p className="mb-6 text-center text-sm leading-relaxed text-gray-500">
            Complete the payment with your mobile money account. Your recharge
            should only be credited after the payment is confirmed.
          </p>

          <div className="mb-4 w-full space-y-3 rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-gray-400">Amount</span>
              <span className="font-bold text-gray-800">
                {formatUGX(Number(amount))}
              </span>
            </div>
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-gray-400">Network</span>
              <span className="font-medium text-gray-800">
                {network === 'mtn' ? 'MTN MoMo' : 'Airtel Money'}
              </span>
            </div>
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-gray-400">Phone</span>
              <span className="font-medium text-gray-800">{senderPhone}</span>
            </div>
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-gray-400">Reference</span>
              <span className="break-all text-right font-medium text-gray-800">
                {reference}
              </span>
            </div>
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-gray-400">Status</span>
              <span className="font-bold text-amber-700">Pending</span>
            </div>
          </div>

          <div className="w-full space-y-2">
            {paymentUrl && (
              <button
                type="button"
                onClick={openPayment}
                className="w-full rounded-xl py-4 text-base font-bold text-white"
                style={{
                  background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                }}
              >
                Continue to payment
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/records')}
              className="w-full rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600"
            >
              Check recharge status
            </button>
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="w-full py-3 text-sm font-semibold text-gray-600"
            >
              Back to Home
            </button>
          </div>
        </main>
      )}
    </div>
  );
};

export default Recharge;
