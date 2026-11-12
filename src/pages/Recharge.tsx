import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentUser, createRecharge } from '@/lib/storage';
import { generateId, formatUGX } from '@/lib/utils';
import { MIN_DEPOSIT } from '@/constants/packages';

const Recharge = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [network, setNetwork] = useState<'mtn' | 'airtel'>('mtn');
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) navigate('/login');
    else {
      setUser(u);
      setPhone(u.phone || '');
    }
  }, [navigate]);

  const handleRequestRecharge = async () => {
    if (!amount || parseInt(amount) < MIN_DEPOSIT) {
      toast.error(`Minimum deposit is ${formatUGX(MIN_DEPOSIT)}`);
      return;
    }
    if (!phone || phone.length < 10) {
      toast.error('Enter a valid phone number like 07XXXXXXXX');
      return;
    }

    // Just save as pending - Admin will send prompt from PesaJet app
    await createRecharge({
      id: generateId(),
      userId: user.id,
      userName: user.name,
      userPhone: phone,
      amount: parseInt(amount),
      network,
      senderPhone: phone,
      senderName: user.name,
      proof: 'WAITING-ADMIN',
      status: 'pending',
      createdAt: new Date().toISOString(),
      processedAt: null,
    });

    toast.success('Request sent! Admin will send you a payment prompt.');
    setStep(2);
  };

  return (
    <div className="app-container min-h-screen bg-gray-50">
      <div className="flex items-center px-4 py-4 bg-white border-b">
        <button onClick={() => navigate(-1)} className="mr-3"><ArrowLeft className="w-6 h-6" /></button>
        <h1 className="font-bold text-lg">Recharge</h1>
      </div>

      {step === 1 && (
        <div className="px-4 py-5 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <p className="text-blue-700 text-sm font-medium">📌 Minimum Deposit: {formatUGX(MIN_DEPOSIT)}</p>
            <p className="text-blue-600 text-xs mt-1">Enter number and amount. Admin will send you a PIN prompt on your phone. No proof needed.</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Amount (UGX)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount (min 25,000)" className="w-full border rounded-xl px-4 py-3 bg-white" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Phone Number to Pay From</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" className="w-full border rounded-xl px-4 py-3 bg-white" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Network</label>
            <div className="grid grid-cols-2 gap-3">
              {(['mtn', 'airtel'] as const).map((n) => (
                <button key={n} onClick={() => setNetwork(n)} className={`py-3 rounded-xl border-2 font-semibold text-sm ${network === n ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}>
                  {n === 'mtn' ? '📲 MTN MoMo' : '📱 Airtel Money'}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleRequestRecharge} className="w-full py-4 rounded-xl text-white font-bold" style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}>
            Request Recharge
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="px-4 py-8 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-4"><span className="text-4xl">📲</span></div>
          <h2 className="font-bold text-xl mb-2">Request Sent!</h2>
          <p className="text-gray-500 text-sm leading-relaxed">Admin will send a payment prompt to <b>{phone}</b> for <b>{formatUGX(parseInt(amount))}</b>.<br/><br/>Wait for the prompt, then enter your Mobile Money PIN to complete.<br/><br/>Your balance will update after Admin approves.</p>
          <button onClick={() => navigate('/records')} className="w-full py-4 rounded-xl text-white font-bold mt-6" style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}>Check Status</button>
          <button onClick={() => navigate('/home')} className="w-full py-3 rounded-xl border mt-2 text-gray-600">Back to Home</button>
        </div>
      )}
    </div>
  );
};

export default Recharge;
