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

    try {
      // 1. アカウント作成
      const { error } = await signUp(email);
      if (error) {
        setSubmitting(false);
        setMessage(error);
        return;
      }

      // 2. すぐにStripe決済へリダイレクト
      const checkout = await startCheckout();
      if (checkout.error) {
        setSubmitting(false);
        setMessage(checkout.error);
        return;
      }
      // startCheckout が成功すると window.location.assign でStripeへ飛ぶ
    } catch {
      setSubmitting(false);
      setMessage('通信に失敗しました。時間をおいてもう一度お試しください。');
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-pink-100 via-pink-50 to-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white/90 rounded-3xl shadow-xl border border-pink-100 p-6">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">&#128247;</div>
          <h1 className="text-2xl font-black text-pink-500">新規登録</h1>
          <p className="text-xs text-pink-300 mt-2">
            7日間無料トライアル付き
          </p>
        </div>

        <div className="bg-pink-50 rounded-2xl p-4 border border-pink-100 mb-5">
          <p className="text-lg font-black text-pink-500 text-center">
            月額 980円<span className="text-xs font-bold">（税込）</span>
          </p>
          <ul className="mt-3 text-xs text-pink-400 space-y-1 text-left">
            <li>&#10003; 7日間は0円。期間内に解約すれば請求なし</li>
            <li>&#10003; ビフォーアフター撮影し放題</li>
            <li>&#10003; ゴースト重ね撮影・モザイク加工</li>
            <li>&#10003; 比較画像の書き出し・共有</li>
          </ul>
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="block">
            <span className="text-xs font-bold text-pink-400">メールアドレス</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-pink-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-pink-300"
              placeholder="example@salon.com"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black rounded-2xl shadow-md active:scale-95 transition-transform disabled:opacity-50"
          >
            {submitting ? '処理中...' : 'カード登録へ進む（7日間無料）'}
          </button>
          <p className="text-[11px] text-pink-400 leading-relaxed text-center">
            Stripeの安全な決済ページでカード情報を登録します。<br />
            完了後にログインIDが発行されます。
          </p>
        </form>

        {message ? (
          <p className="mt-4 text-center text-xs font-bold text-rose-500">{message}</p>
        ) : null}

        <div className="mt-5 text-center space-y-2">
          <button onClick={() => navigate('/')} className="text-xs text-pink-400 underline font-bold">
            すでに登録済みの方はこちら
          </button>
          <div className="flex justify-center gap-3">
            <button onClick={() => navigate('/terms')} className="text-[10px] text-pink-300 underline">利用規約</button>
            <button onClick={() => navigate('/privacy')} className="text-[10px] text-pink-300 underline">プライバシーポリシー</button>
          </div>
        </div>
      </div>
    </div>
  );
}
