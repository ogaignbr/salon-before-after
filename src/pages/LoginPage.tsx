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
    resetPinByEmail,
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
  const [showForgotPin, setShowForgotPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [newPinConfirm, setNewPinConfirm] = useState('');
  const [resetPin, setResetPin] = useState('');
  const [resetPinConfirm, setResetPinConfirm] = useState('');

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

  const onResetForgottenPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (!email.trim()) {
      setMessage('メールアドレスを入力してください。');
      return;
    }
    if (!isFourDigits(resetPin) || !isFourDigits(resetPinConfirm)) {
      setMessage('新しいPINは4桁の数字で入力してください。');
      return;
    }
    if (resetPin !== resetPinConfirm) {
      setMessage('PINが一致しません。');
      return;
    }

    setSubmitting(true);
    try {
      const { error, message: successMessage } = await resetPinByEmail(email, resetPin);
      if (error) {
        setMessage(error);
        return;
      }
      setPin(resetPin);
      setResetPin('');
      setResetPinConfirm('');
      setShowForgotPin(false);
      setMessage(successMessage ?? 'PINを更新しました。新しいPINでログインしてください。');
    } catch {
      setMessage('通信に失敗しました。時間をおいてもう一度お試しください。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppFrame>
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center animate-slide-up">
        {/* Logo card */}
        <div className="mb-7 text-center">
          <div className="mx-auto w-fit rounded-[20px] border border-[#B9A7FF]/35 bg-[rgba(255,255,255,0.94)] p-3 shadow-[0_12px_32px_rgba(85,70,180,0.12)] backdrop-blur-xl dark:border-indigo-300/15 dark:bg-slate-900/62 dark:shadow-[0_25px_45px_-30px_rgba(120,119,255,0.55)]">
            <img
              src={pitacameLogo}
              alt="ぴたカメ"
              className="mx-auto h-auto w-full max-w-[240px] rounded-[10px]"
            />
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-[20px] border border-[#B9A7FF]/35 bg-[rgba(255,255,255,0.94)] p-6 shadow-[0_12px_32px_rgba(85,70,180,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45 dark:shadow-[0_20px_42px_-30px_rgba(30,46,105,0.9)]">
          {showForgotPin ? (
            <form className="space-y-4" onSubmit={onResetForgottenPin}>
              <div className="rounded-[10px] border border-[#B9A7FF]/40 bg-[#F4F2FF]/80 p-3 dark:border-indigo-300/20 dark:bg-indigo-500/10">
                <p className="text-center text-xs font-medium text-[#161B5C] dark:text-indigo-100">
                  契約中のメールアドレスのみPINを更新できます
                </p>
              </div>
              <label className="block">
                <span className="text-xs font-semibold tracking-[0.08em] text-[#161B5C] dark:text-slate-300">メールアドレス</span>
                <div className="relative mt-1.5">
                  <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B4CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-[10px] border border-[#B8A8F8] bg-white py-3 pl-10 pr-4 text-sm text-[#161B5C] outline-none transition-all placeholder:text-[#9A9AB0] focus:border-[#6B4CFF] focus:ring-2 focus:ring-[#6B4CFF]/20 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-100 dark:placeholder:text-slate-500"
                    placeholder="example@pitacame.com"
                  />
                </div>
              </label>
              <label className="block">
                <span className="text-xs font-semibold tracking-[0.08em] text-[#161B5C] dark:text-slate-300">新しいPIN（4桁）</span>
                <div className="relative mt-1.5">
                  <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B4CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="\d{4}"
                    maxLength={4}
                    value={resetPin}
                    onChange={(e) => setResetPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    required
                    className="w-full rounded-[10px] border border-[#B8A8F8] bg-white py-3 pl-10 pr-4 text-center text-base font-semibold tracking-[0.3em] text-[#161B5C] outline-none transition-all focus:border-[#6B4CFF] focus:ring-2 focus:ring-[#6B4CFF]/20 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-100"
                  />
                </div>
              </label>
              <label className="block">
                <span className="text-xs font-semibold tracking-[0.08em] text-[#161B5C] dark:text-slate-300">新しいPIN（確認）</span>
                <div className="relative mt-1.5">
                  <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B4CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="\d{4}"
                    maxLength={4}
                    value={resetPinConfirm}
                    onChange={(e) => setResetPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    required
                    className="w-full rounded-[10px] border border-[#B8A8F8] bg-white py-3 pl-10 pr-4 text-center text-base font-semibold tracking-[0.3em] text-[#161B5C] outline-none transition-all focus:border-[#6B4CFF] focus:ring-2 focus:ring-[#6B4CFF]/20 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-100"
                  />
                </div>
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="sheen-wrap w-full rounded-[10px] border border-[#8B5CFF]/30 bg-[linear-gradient(135deg,#6B4CFF_0%,#7B54FF_48%,#8B5CFF_100%)] py-3 font-bold text-white shadow-[0_8px_18px_rgba(90,65,230,0.24)] transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
              >
                {submitting ? '更新中...' : 'PINを更新する'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMessage('');
                  setShowForgotPin(false);
                }}
                className="w-full py-1 text-xs font-semibold text-[#6B4CFF] transition-colors hover:text-[#8B5CFF] dark:text-indigo-300 dark:hover:text-indigo-200"
              >
                ログインに戻る
              </button>
            </form>
          ) : !needsPinChange && !showPinChange ? (
            <form className="space-y-4" onSubmit={onLogin}>
              <label className="block">
                <span className="text-xs font-semibold tracking-[0.08em] text-[#161B5C] dark:text-slate-300">メールアドレス</span>
                <div className="relative mt-1.5">
                  <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B4CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-[10px] border border-[#B8A8F8] bg-white py-3 pl-10 pr-4 text-sm text-[#161B5C] outline-none transition-all placeholder:text-[#9A9AB0] focus:border-[#6B4CFF] focus:ring-2 focus:ring-[#6B4CFF]/20 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-100 dark:placeholder:text-slate-500"
                    placeholder="example@salon.com"
                  />
                </div>
              </label>
              <label className="block">
                <span className="text-xs font-semibold tracking-[0.08em] text-[#161B5C] dark:text-slate-300">PIN（4桁）</span>
                <div className="relative mt-1.5">
                  <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B4CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="\d{4}"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    required
                    className="w-full rounded-[10px] border border-[#B8A8F8] bg-white py-3 pl-10 pr-4 text-center text-base font-semibold tracking-[0.3em] text-[#161B5C] outline-none transition-all placeholder:text-[#9A9AB0] focus:border-[#6B4CFF] focus:ring-2 focus:ring-[#6B4CFF]/20 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-100 dark:placeholder:text-slate-500"
                    placeholder="----"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="sheen-wrap w-full rounded-[10px] border border-[#8B5CFF]/30 bg-[linear-gradient(135deg,#6B4CFF_0%,#7B54FF_48%,#8B5CFF_100%)] py-3 text-base font-bold text-white shadow-[0_8px_18px_rgba(90,65,230,0.24)] transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
              >
                {submitting ? 'ログイン中...' : 'ログイン'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMessage('');
                  setShowForgotPin(true);
                }}
                className="w-full py-1 text-xs font-semibold text-[#6B4CFF] transition-colors hover:text-[#8B5CFF] dark:text-indigo-300 dark:hover:text-indigo-200"
              >
                PINを忘れた場合
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={onChangeInitialPin}>
              <div className="rounded-[10px] border border-amber-300/70 bg-amber-50/90 p-3 dark:border-amber-300/25 dark:bg-amber-500/10">
                <p className="text-center text-xs font-medium text-amber-700 dark:text-amber-200">
                  初回ログインのためPIN変更が必要です
                </p>
              </div>
              <label className="block">
                <span className="text-xs font-semibold tracking-[0.08em] text-[#161B5C] dark:text-slate-300">新しいPIN（4桁）</span>
                <div className="relative mt-1.5">
                  <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B4CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="\d{4}"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    required
                    className="w-full rounded-[10px] border border-[#B8A8F8] bg-white py-3 pl-10 pr-4 text-center text-base font-semibold tracking-[0.3em] text-[#161B5C] outline-none transition-all focus:border-[#6B4CFF] focus:ring-2 focus:ring-[#6B4CFF]/20 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-100"
                  />
                </div>
              </label>
              <label className="block">
                <span className="text-xs font-semibold tracking-[0.08em] text-[#161B5C] dark:text-slate-300">新しいPIN（確認）</span>
                <div className="relative mt-1.5">
                  <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B4CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="\d{4}"
                    maxLength={4}
                    value={newPinConfirm}
                    onChange={(e) => setNewPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    required
                    className="w-full rounded-[10px] border border-[#B8A8F8] bg-white py-3 pl-10 pr-4 text-center text-base font-semibold tracking-[0.3em] text-[#161B5C] outline-none transition-all focus:border-[#6B4CFF] focus:ring-2 focus:ring-[#6B4CFF]/20 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-100"
                  />
                </div>
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="sheen-wrap w-full rounded-[10px] border border-[#8B5CFF]/30 bg-[linear-gradient(135deg,#6B4CFF_0%,#7B54FF_48%,#8B5CFF_100%)] py-3 font-bold text-white shadow-[0_8px_18px_rgba(90,65,230,0.24)] transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
              >
                {submitting ? '更新中...' : 'PINを更新して続行'}
              </button>
            </form>
          )}

          {message && (
            <p className="mt-3 text-center text-xs font-medium text-[#E5486D]">{message}</p>
          )}
        </div>

        {/* Bottom actions */}
        <div className="mt-6 space-y-3 text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => navigate('/signup')}
            className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-[#6B4CFF] bg-white py-3 font-semibold text-[#6B4CFF] shadow-[0_12px_32px_rgba(85,70,180,0.12)] transition-all hover:bg-[#F4F2FF] active:scale-[0.99] dark:border-indigo-300/20 dark:bg-slate-900/45 dark:text-indigo-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            新規登録
          </button>
          <div className="mx-auto flex w-fit items-center gap-3 rounded-[16px] border border-[#DCD7FF] bg-white px-4 py-1.5 text-xs text-[#6B6F8A] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-400">
            <button onClick={() => navigate('/terms')} className="transition-colors hover:text-[#161B5C] dark:hover:text-slate-200">利用規約</button>
            <span className="text-[#DCD7FF] dark:text-slate-600">|</span>
            <button onClick={() => navigate('/privacy')} className="transition-colors hover:text-[#161B5C] dark:hover:text-slate-200">プライバシー</button>
          </div>
        </div>
      </div>
    </AppFrame>
  );
}
