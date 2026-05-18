import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const {
    signIn,
    needsPinChange,
    completeInitialPinChange,
  } = useAuth();
  const [loginId, setLoginId] = useState('');
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [newPinConfirm, setNewPinConfirm] = useState('');

  const isFourDigits = (value: string) => /^\d{4}$/.test(value);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    const { error } = await signIn(loginId, pin);
    setSubmitting(false);

    if (error) {
      setMessage('IDまたはPINが違います。');
      return;
    }

    if (needsPinChange || pin === '0000') {
      setMessage('初期PINのため、先にPIN変更を行ってください。');
      return;
    }

    navigate('/', { replace: true });
  };

  const onChangeInitialPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (!isFourDigits(newPin) || !isFourDigits(newPinConfirm)) {
      setMessage('PINは4桁の数字で入力してください。');
      return;
    }
    if (newPin !== newPinConfirm) {
      setMessage('新しいPINが一致しません。');
      return;
    }

    setSubmitting(true);
    const { error } = await completeInitialPinChange('0000', newPin);
    setSubmitting(false);
    if (error) {
      setMessage(error);
      return;
    }
    setMessage('');
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-pink-100 via-pink-50 to-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white/90 rounded-3xl shadow-xl border border-pink-100 p-6">
        <h1 className="text-2xl font-black text-pink-500 text-center">ログイン</h1>
        <p className="text-xs text-pink-300 text-center mt-2">4桁IDと4桁PINでログインしてください</p>

        {!needsPinChange ? (
          <form className="mt-6 space-y-3" onSubmit={onLogin}>
            <label className="block">
              <span className="text-xs font-bold text-pink-400">ID（4桁）</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                value={loginId}
                onChange={(e) => setLoginId(e.target.value.replace(/\D/g, '').slice(0, 4))}
                required
                className="mt-1 w-full rounded-xl border border-pink-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
                placeholder="例: 4826"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-pink-400">PIN（4桁）</span>
              <input
                type="password"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                required
                className="mt-1 w-full rounded-xl border border-pink-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
                placeholder="0000"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black rounded-2xl shadow-md active:scale-95 transition-transform disabled:opacity-50"
            >
              {submitting ? 'ログイン中...' : 'ログインする'}
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-3" onSubmit={onChangeInitialPin}>
            <p className="text-xs text-rose-500 font-bold text-center">
              初回ログインのためPIN変更が必要です
            </p>
            <label className="block">
              <span className="text-xs font-bold text-pink-400">新しいPIN（4桁）</span>
              <input
                type="password"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                required
                className="mt-1 w-full rounded-xl border border-pink-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-pink-400">新しいPIN（確認）</span>
              <input
                type="password"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                value={newPinConfirm}
                onChange={(e) => setNewPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                required
                className="mt-1 w-full rounded-xl border border-pink-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black rounded-2xl shadow-md active:scale-95 transition-transform disabled:opacity-50"
            >
              {submitting ? '変更中...' : 'PINを変更して続行'}
            </button>
          </form>
        )}

        {message && (
          <p className="mt-4 text-center text-xs font-bold text-rose-500">{message}</p>
        )}

        <div className="mt-4 flex flex-col items-center gap-2">
          <button onClick={() => navigate('/signup')} className="text-xs text-pink-400 underline">
            新規登録ページへ
          </button>
          <button onClick={() => navigate('/')} className="text-xs text-pink-300 underline">
            表紙に戻る
          </button>
        </div>
      </div>
    </div>
  );
}
