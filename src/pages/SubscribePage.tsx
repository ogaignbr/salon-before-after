import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function SubscribePage() {
  const navigate = useNavigate();
  const { user, subscription, signOut, refreshSubscription } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const stripePriceId = import.meta.env.VITE_STRIPE_PRICE_ID as string;
  const baseUrl = window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, '');

  const handleSubscribe = async () => {
    if (!user || !stripePriceId) return;
    setMessage('');
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        customerEmail: user.email,
        userId: user.id,
        priceId: stripePriceId,
        successUrl: `${baseUrl}/subscribe?result=success`,
        cancelUrl: `${baseUrl}/subscribe?result=cancel`,
      },
    });
    setSubmitting(false);
    if (error || !data?.url) {
      setMessage('決済ページの作成に失敗しました。');
      return;
    }
    window.location.href = data.url as string;
  };

  const handleRefresh = async () => {
    await refreshSubscription();
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-pink-100 via-pink-50 to-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white/90 rounded-3xl shadow-xl border border-pink-100 p-6 text-center">
        <div className="text-5xl mb-4">&#128247;</div>
        <h1 className="text-2xl font-black text-pink-500">ぴたカメ</h1>

        {subscription === 'expired' ? (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-pink-500 font-bold">無料トライアル期間が終了しました</p>
            <p className="text-xs text-pink-400">継続利用には月額プランへの登録が必要です。</p>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-pink-500 font-bold">サブスクリプション登録</p>
            <p className="text-xs text-pink-400">お支払い完了後、すぐ利用できます。</p>
          </div>
        )}

        <div className="mt-6 bg-pink-50 rounded-2xl p-4 border border-pink-100">
          <p className="text-lg font-black text-pink-500">月額 980円<span className="text-xs font-bold">（税込）</span></p>
          <ul className="mt-3 text-xs text-pink-400 space-y-1 text-left">
            <li>&#10003; ビフォーアフター撮影し放題</li>
            <li>&#10003; ゴースト重ね撮影</li>
            <li>&#10003; モザイク加工（AI顔検出）</li>
            <li>&#10003; 比較画像の書き出し・共有</li>
          </ul>
        </div>

        <button
          onClick={handleSubscribe}
          disabled={submitting || !stripePriceId}
          className="mt-6 w-full py-3 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black rounded-2xl shadow-md active:scale-95 transition-transform disabled:opacity-50"
        >
          {submitting ? '遷移中...' : '月額980円で申し込む'}
        </button>

        <button
          onClick={handleRefresh}
          className="mt-3 w-full py-2 text-xs text-pink-400 font-bold underline"
        >
          お支払い済みの方はここをタップ
        </button>

        {message ? (
          <p className="mt-3 text-xs font-bold text-rose-500">{message}</p>
        ) : null}

        <div className="mt-4 flex justify-center gap-4">
          <button onClick={() => navigate('/terms')} className="text-[10px] text-pink-300 underline">利用規約</button>
          <button onClick={() => navigate('/privacy')} className="text-[10px] text-pink-300 underline">プライバシーポリシー</button>
        </div>

        <button
          onClick={async () => {
            await signOut();
            navigate('/login');
          }}
          className="mt-3 text-xs text-pink-300 underline"
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}
