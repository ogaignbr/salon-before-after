import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppFrame } from '../components/AppFrame';
import pitacameLogo from '../../ぴたカメロゴ.png';

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
    <AppFrame>
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center animate-slide-up">
        <div className="mb-7 text-center">
          <div className="mx-auto w-fit rounded-[16px] border border-white/70 bg-white/82 p-3 shadow-[0_20px_45px_-30px_rgba(86,92,255,0.65)] backdrop-blur-xl dark:border-indigo-300/15 dark:bg-slate-900/62 dark:shadow-[0_25px_45px_-30px_rgba(120,119,255,0.55)]">
            <img
              src={pitacameLogo}
              alt="ぴたカメ"
              className="mx-auto h-auto w-full max-w-[240px] rounded-[10px]"
            />
          </div>
        </div>

        <div className="rounded-[16px] border border-white/65 bg-white/75 p-6 shadow-[0_18px_36px_-28px_rgba(68,82,147,0.75)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45 dark:shadow-[0_20px_42px_-30px_rgba(30,46,105,0.9)]">
          {!needsPinChange && !showPinChange ? (
            <form className="space-y-4" onSubmit={onLogin}>
              <label className="block">
                <span className="text-xs font-semibold tracking-[0.08em] text-slate-500 dark:text-slate-300">メールアドレス</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1.5 w-full rounded-[12px] border border-slate-200/80 bg-white/85 px-4 py-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-100 dark:placeholder:text-slate-500"
                  placeholder="example@salon.com"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold tracking-[0.08em] text-slate-500 dark:text-slate-300">PIN（4桁）</span>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  required
                  className="mt-1.5 w-full rounded-[12px] border border-slate-200/80 bg-white/85 px-4 py-3 text-center text-base font-semibold tracking-[0.3em] text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-100 dark:placeholder:text-slate-500"
                  placeholder="----"
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="sheen-wrap w-full rounded-[12px] border border-indigo-300/30 bg-[linear-gradient(135deg,#5f7bff_0%,#6a60ff_48%,#8a49ff_100%)] py-3 text-base font-bold text-white shadow-[0_16px_30px_-20px_rgba(86,89,255,0.95)] transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
              >
                {submitting ? 'ログイン中...' : 'ログイン'}
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={onChangeInitialPin}>
              <div className="rounded-[12px] border border-amber-300/70 bg-amber-50/90 p-3 dark:border-amber-300/25 dark:bg-amber-500/10">
                <p className="text-center text-xs font-medium text-amber-700 dark:text-amber-200">
                  初回ログインのためPIN変更が必要です
                </p>
              </div>
              <label className="block">
                <span className="text-xs font-semibold tracking-[0.08em] text-slate-500 dark:text-slate-300">新しいPIN（4桁）</span>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  required
                  className="mt-1.5 w-full rounded-[12px] border border-slate-200/80 bg-white/85 px-4 py-3 text-center text-base font-semibold tracking-[0.3em] text-slate-800 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-100"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold tracking-[0.08em] text-slate-500 dark:text-slate-300">新しいPIN（確認）</span>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  value={newPinConfirm}
                  onChange={(e) => setNewPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  required
                  className="mt-1.5 w-full rounded-[12px] border border-slate-200/80 bg-white/85 px-4 py-3 text-center text-base font-semibold tracking-[0.3em] text-slate-800 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-100"
                />
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="sheen-wrap w-full rounded-[12px] border border-indigo-300/30 bg-[linear-gradient(135deg,#5f7bff_0%,#6a60ff_48%,#8a49ff_100%)] py-3 font-bold text-white shadow-[0_16px_30px_-20px_rgba(86,89,255,0.95)] transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
              >
                {submitting ? '更新中...' : 'PINを更新して続行'}
              </button>
            </form>
          )}

          {message && (
            <p className="mt-3 text-center text-xs font-medium text-rose-500">{message}</p>
          )}
        </div>

        <div className="mt-6 space-y-3 text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => navigate('/signup')}
            className="w-full rounded-[12px] border border-indigo-200/60 bg-white/72 py-3 font-semibold text-indigo-600 shadow-[0_14px_30px_-24px_rgba(84,96,168,0.65)] backdrop-blur-xl transition-all hover:border-indigo-300/70 hover:bg-white/85 active:scale-[0.99] dark:border-indigo-300/20 dark:bg-slate-900/45 dark:text-indigo-300"
          >
            新規登録
          </button>
          <div className="mx-auto flex w-fit items-center gap-3 rounded-full border border-white/55 bg-white/55 px-4 py-1.5 text-xs text-slate-500 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-400">
            <button onClick={() => navigate('/terms')} className="transition-colors hover:text-slate-700 dark:hover:text-slate-200">利用規約</button>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <button onClick={() => navigate('/privacy')} className="transition-colors hover:text-slate-700 dark:hover:text-slate-200">プライバシー</button>
          </div>
        </div>
      </div>
    </AppFrame>
  );
}
