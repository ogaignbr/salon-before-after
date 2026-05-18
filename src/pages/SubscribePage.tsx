import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function SubscribePage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const {
    user,
    loginId,
    subscription,
    hasStripeSubscription,
    signOut,
    refreshSubscription,
    startCheckout,
  } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const result = params.get('result');

  useEffect(() => {
    if (result !== 'success' || !user) return;
    let cancelled = false;
    const tryRefresh = async () => {
      for (let i = 0; i < 5; i += 1) {
        if (cancelled) return;
        await refreshSubscription();
        if (cancelled) return;
        if (hasStripeSubscription) {
          setParams({}, { replace: true });
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    };
    void tryRefresh();
    return () => {
      cancelled = true;
    };
  }, [result, user, hasStripeSubscription, refreshSubscription, setParams]);

  const handleSubscribe = async () => {
    setMessage('');
    setSubmitting(true);
    const { error } = await startCheckout();
    setSubmitting(false);
    if (error) setMessage(error);
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-pink-100 via-pink-50 to-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white/90 rounded-3xl shadow-xl border border-pink-100 p-6 text-center">
        <div className="text-5xl mb-4">&#128247;</div>
        <h1 className="text-2xl font-black text-pink-500">ぴたカメ</h1>

        {result === 'success' && hasStripeSubscription ? (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-pink-500 font-bold">登録が完了しました</p>
            <p className="text-xs text-pink-400">
              7日間は無料、8日目から月額980円が自動で発生します。
            </p>
            {loginId ? (
              <div className="mt-4 rounded-2xl bg-pink-50 border border-pink-200 p-3">
                <p className="text-xs font-bold text-pink-500">あなたのログインID</p>
                <p className="text-3xl font-black text-rose-500 tracking-widest">{loginId}</p>
                <p className="text-[11px] text-pink-400">初期PINは 0000 です</p>
              </div>
            ) : null}
            <button
              onClick={() => navigate('/login')}
              className="mt-4 w-full py-3 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black rounded-2xl shadow-md"
            >
              ログインへ進む
            </button>
          </div>
        ) : (
          <>
            {subscription === 'expired'
              || subscription === 'canceled'
              || subscription === 'past_due' ? (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-pink-500 font-bold">サブスクリプションが無効です</p>
                <p className="text-xs text-pink-400">引き続きご利用いただくにはカード登録が必要です。</p>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-pink-500 font-bold">カード登録（7日間無料）</p>
                <p className="text-xs text-pink-400">8日目から月額980円が自動で発生します。</p>
              </div>
            )}

            <div className="mt-6 bg-pink-50 rounded-2xl p-4 border border-pink-100">
              <p className="text-lg font-black text-pink-500">
                月額 980円<span className="text-xs font-bold">（税込）</span>
              </p>
              <ul className="mt-3 text-xs text-pink-400 space-y-1 text-left">
                <li>&#10003; 7日間は0円。期間内に解約すれば請求は発生しません。</li>
                <li>&#10003; ビフォーアフター撮影し放題</li>
                <li>&#10003; ゴースト重ね撮影</li>
                <li>&#10003; モザイク加工（AI顔検出）</li>
                <li>&#10003; 比較画像の書き出し・共有</li>
              </ul>
            </div>

            <button
              onClick={handleSubscribe}
              disabled={submitting}
              className="mt-6 w-full py-3 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black rounded-2xl shadow-md active:scale-95 transition-transform disabled:opacity-50"
            >
              {submitting ? '遷移中...' : 'カードを登録する'}
            </button>

            <button
              onClick={async () => {
                setSubmitting(true);
                await refreshSubscription();
                setSubmitting(false);
              }}
              className="mt-3 w-full py-2 text-xs text-pink-400 font-bold underline"
            >
              すでに登録済みの方はここをタップ
            </button>

            {message ? (
              <p className="mt-3 text-xs font-bold text-rose-500">{message}</p>
            ) : null}
          </>
        )}

        <div className="mt-4 flex justify-center gap-4">
          <button onClick={() => navigate('/terms')} className="text-[10px] text-pink-300 underline">
            利用規約
          </button>
          <button onClick={() => navigate('/privacy')} className="text-[10px] text-pink-300 underline">
            プライバシーポリシー
          </button>
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
