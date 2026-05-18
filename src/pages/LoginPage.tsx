import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const {
    user,
    signIn,
    needsPinChange,
    completeInitialPinChange,
  } = useAuth();
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('signup:checkout-email') ?? '';
    } catch {
      return '';
    }
  });
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPinChange, setShowPinChange] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [newPinConfirm, setNewPinConfirm] = useState('');

  useEffect(() => {
    if (user && !needsPinChange) {
      navigate('/home', { replace: true });
    }
  }, [user, needsPinChange, navigate]);

  const isFourDigits = (value: string) => /^\d{4}$/.test(value);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const { error } = await signIn(email, pin);
      if (error) {
        setSubmitting(false);
        setMessage('Incorrect email or PIN.');
        return;
      }

      if (needsPinChange || pin === '0000') {
        setSubmitting(false);
        setShowPinChange(true);
        setMessage('Please change your initial PIN before continuing.');
        return;
      }

      navigate('/home', { replace: true });
    } catch {
      setMessage('Connection failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const onChangeInitialPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (!isFourDigits(newPin) || !isFourDigits(newPinConfirm)) {
      setMessage('PIN must be 4 digits.');
      return;
    }
    if (newPin !== newPinConfirm) {
      setMessage('PINs do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await completeInitialPinChange('0000', newPin);
      if (error) {
        setMessage(error);
        return;
      }
      setMessage('');
      navigate('/home', { replace: true });
    } catch {
      setMessage('Connection failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">PitaCame</h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">Compare Camera for Business</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6">
          {!needsPinChange && !showPinChange ? (
            <form className="space-y-4" onSubmit={onLogin}>
              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all bg-slate-50"
                  placeholder="example@salon.com"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">PIN (4 digits)</span>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  required
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-base text-center tracking-[0.3em] font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all bg-slate-50"
                  placeholder="----"
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 text-base"
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={onChangeInitialPin}>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700 font-medium text-center">
                  Initial login requires PIN change
                </p>
              </div>
              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New PIN (4 digits)</span>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  required
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-base text-center tracking-[0.3em] font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all bg-slate-50"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirm New PIN</span>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  value={newPinConfirm}
                  onChange={(e) => setNewPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  required
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-base text-center tracking-[0.3em] font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all bg-slate-50"
                />
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Update PIN & Continue'}
              </button>
            </form>
          )}

          {message && (
            <p className="mt-3 text-center text-xs font-medium text-red-500">{message}</p>
          )}
        </div>

        {/* Bottom links */}
        <div className="mt-6 text-center space-y-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => navigate('/signup')}
            className="w-full py-3 bg-white text-indigo-600 font-semibold rounded-xl shadow-sm border border-slate-200 hover:border-indigo-300 active:scale-[0.98] transition-all"
          >
            Create Account
          </button>
          <div className="flex justify-center gap-4 mt-2">
            <button onClick={() => navigate('/terms')} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Terms</button>
            <span className="text-xs text-slate-300">|</span>
            <button onClick={() => navigate('/privacy')} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Privacy</button>
          </div>
        </div>
      </div>
    </div>
  );
}
