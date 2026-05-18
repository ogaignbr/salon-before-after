import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signUp, startCheckout } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setSubmitting(true);
    const { error } = await signUp(email);
    if (error) {
      setSubmitting(false);
      setMessage(error);
      return;
    }

    const checkout = await startCheckout();
    if (checkout.error) {
      setSubmitting(false);
      setMessage(checkout.error);
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-pink-100 via-pink-50 to-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white/90 rounded-3xl shadow-xl border border-pink-100 p-6">
        <h1 className="text-2xl font-black text-pink-500 text-center">新規登録</h1>
        <p className="text-xs text-pink-300 text-center mt-2">7日間無料トライアル付き（カード登録必須）</p>

        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <label className="block">
            <span className="text-xs font-bold text-pink-400">メールアドレス</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-pink-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
              placeholder="example@salon.com"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black rounded-2xl shadow-md active:scale-95 transition-transform disabled:opacity-50"
          >
            {submitting ? '遷移中...' : 'カード登録へ進む'}
          </button>
          <p className="text-[11px] text-pink-400 leading-relaxed">
            登録後はStripeの安全な決済ページに遷移します。<br />
            7日間は0円、解約しない場合のみ8日目から月額980円が自動で発生します。
          </p>
        </form>

        {message ? (
          <p className="mt-4 text-center text-xs font-bold text-rose-500">{message}</p>
        ) : null}

        <div className="mt-4 text-center">
          <button onClick={() => navigate('/login')} className="text-xs text-pink-300 underline">
            すでに登録済みの方はこちら
          </button>
        </div>
      </div>
    </div>
  );
}
