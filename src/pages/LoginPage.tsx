import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const {
    user,
    hasStripeSubscription,
    subscription,
    signIn,
    needsPinChange,
    completeInitialPinChange,
  } = useAuth();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPinChange, setShowPinChange] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [newPinConfirm, setNewPinConfirm] = useState('');

  // Already logged in with active subscription → go to home
  if (user && hasStripeSubscription && !needsPinChange
    && subscription !== 'expired' && subscription !== 'canceled' && subscription !== 'past_due' && subscription !== 'none') {
    navigate('/home', { replace: true });
    return null;
  }

  const isFourDigits = (value: string) => /^\d{4}$/.test(value);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const { error } = await signIn(email, pin);
      if (error) {
        setSubmitting(false);
        setMessage('メールアドレスまたは暗証番号が違います。');
        return;
      }

      if (needsPinChange || pin === '0000') {
        setSubmitting(false);
        setShowPinChange(true);
        setMessage('初期暗証番号のため、先に暗証番号変更を行ってください。');
        return;
      }

      navigate('/home', { replace: true });
    } catch {
      setMessage('通信に失敗しました。時間をおいてもう一度お試しください。');
    } finally {
      setSubmitting(false);
    }
  };

  const onChangeInitialPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (!isFourDigits(newPin) || !isFourDigits(newPinConfirm)) {
      setMessage('暗証番号は4桁の数字で入力してください。');
      return;
    }
    if (newPin !== newPinConfirm) {
      setMessage('新しい暗証番号が一致しません。');
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
      setMessage('通信に失敗しました。時間をおいてもう一度お試しください。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-pink-100 via-pink-50 to-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-6 left-6 text-pink-300 text-2xl animate-sparkle">&#10022;</div>
      <div className="absolute top-16 right-8 text-yellow-300 text-xl animate-sparkle" style={{ animationDelay: '1s' }}>&#9733;</div>
      <div className="absolute bottom-32 left-10 text-purple-300 text-lg animate-sparkle" style={{ animationDelay: '0.5s' }}>&#9829;</div>

      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">&#128247;</div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-pink-400 via-pink-500 to-rose-400 bg-clip-text text-transparent">
            ぴたカメ
          </h1>
          <p className="text-xs text-pink-400 font-bold mt-1">ぴたっと撮れる。変化が伝わる。</p>
        </div>

        {/* Card */}
        <div className="bg-white/90 rounded-3xl shadow-xl border border-pink-100 p-6">
          {!needsPinChange && !showPinChange ? (
            <form className="space-y-4" onSubmit={onLogin}>
              <label className="block">
                <span className="text-xs font-bold text-pink-400">メールアドレス</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-pink-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-300"
                  placeholder="example@salon.com"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-pink-400">暗証番号（4桁）</span>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  required
                  className="mt-1 w-full rounded-xl border border-pink-200 px-4 py-3 text-base text-center tracking-[0.3em] font-bold outline-none focus:ring-2 focus:ring-pink-300"
                  placeholder="****"
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black rounded-2xl shadow-md active:scale-95 transition-transform disabled:opacity-50 text-lg"
              >
                {submitting ? 'ログイン中...' : 'ログイン'}
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={onChangeInitialPin}>
              <p className="text-xs text-rose-500 font-bold text-center">
                初回ログインのため暗証番号変更が必要です
              </p>
              <label className="block">
                <span className="text-xs font-bold text-pink-400">新しい暗証番号（4桁）</span>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  required
                  className="mt-1 w-full rounded-xl border border-pink-200 px-4 py-3 text-base text-center tracking-[0.3em] font-bold outline-none focus:ring-2 focus:ring-pink-300"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-pink-400">新しい暗証番号（確認）</span>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  value={newPinConfirm}
                  onChange={(e) => setNewPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  required
                  className="mt-1 w-full rounded-xl border border-pink-200 px-4 py-3 text-base text-center tracking-[0.3em] font-bold outline-none focus:ring-2 focus:ring-pink-300"
                />
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black rounded-2xl shadow-md active:scale-95 transition-transform disabled:opacity-50"
              >
                {submitting ? '変更中...' : '暗証番号を変更して続行'}
              </button>
            </form>
          )}

          {message && (
            <p className="mt-3 text-center text-xs font-bold text-rose-500">{message}</p>
          )}
        </div>

        {/* Bottom links */}
        <div className="mt-6 text-center space-y-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <button
            onClick={() => navigate('/signup')}
            className="w-full py-3 bg-white text-pink-500 font-black rounded-2xl shadow-md border-2 border-pink-200 active:scale-95 transition-transform"
          >
            新規登録はこちら
          </button>
          <div className="flex justify-center gap-3 mt-2">
            <button onClick={() => navigate('/terms')} className="text-[10px] text-pink-300 underline">利用規約</button>
            <button onClick={() => navigate('/privacy')} className="text-[10px] text-pink-300 underline">プライバシーポリシー</button>
          </div>
        </div>
      </div>
    </div>
  );
}
