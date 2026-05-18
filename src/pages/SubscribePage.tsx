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
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const result = params.get('result');
  const isSuccess = result === 'success';

  useEffect(() => {
    if (!isSuccess || !user) return;
    let cancelled = false;
    const tryRefresh = async () => {
      for (let i = 0; i < 8; i += 1) {
        if (cancelled) return;
        await refreshSubscription();
        if (cancelled) return;
        if (hasStripeSubscription) return;
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    };
    void tryRefresh();
    return () => {
      cancelled = true;
    };
  }, [isSuccess, user, hasStripeSubscription, refreshSubscription]);

  const handleSubscribe = async () => {
    setMessage('');
    setSubmitting(true);
    const { error } = await startCheckout();
    setSubmitting(false);
    if (error) setMessage(error);
  };

  const onConfirmClose = async () => {
    setShowCloseConfirm(false);
    setParams({}, { replace: true });
    await signOut();
    navigate('/login');
  };

  if (isSuccess) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-pink-100 via-pink-50 to-white flex items-center justify-center px-6">
        <div className="w-full max-w-sm bg-white/90 rounded-3xl shadow-xl border border-pink-100 p-6 relative">
          <h1 className="text-2xl font-black text-pink-500 text-center">登録が完了しました</h1>
          <p className="text-xs text-pink-400 text-center mt-2 leading-relaxed">
            7日間は0円、8日目から月額980円が自動で発生します。<br />
            期間内に解約すれば請求は発生しません。
          </p>

          {loginId ? (
            <div className="mt-6 rounded-2xl bg-pink-50 border-2 border-pink-300 p-5 text-center">
              <p className="text-[11px] font-bold text-pink-500">あなたのログインID</p>
              <p className="text-5xl font-black text-rose-500 tracking-[0.4em] mt-2">{loginId}</p>
              <p className="text-[11px] text-pink-400 mt-2">初期PINは 0000 です</p>
            </div>
          ) : (
            <p className="mt-4 text-center text-xs text-pink-400">
              ログインIDを取得中です...しばらくお待ちください。
            </p>
          )}

          {!hasStripeSubscription ? (
            <p className="mt-3 text-center text-[11px] text-pink-400">
              サブスクリプションの反映に少し時間がかかる場合があります。
            </p>
          ) : null}

          <p className="text-[11px] text-rose-500 font-bold text-center mt-4 leading-relaxed">
            このIDは再表示されません。<br />
            必ずメモやスクリーンショットで保存してください。
          </p>

          <button
            onClick={() => setShowCloseConfirm(true)}
            className="mt-6 w-full py-3 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black rounded-2xl shadow-md active:scale-95 transition-transform"
          >
            閉じる
          </button>

          {showCloseConfirm ? (
            <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center px-4">
              <div className="bg-white rounded-2xl p-5 w-full max-w-xs shadow-2xl">
                <p className="text-sm font-bold text-pink-600 text-center leading-relaxed">
                  ログインに必要なIDになります。
                  <br />
                  メモやスクリーンショットは撮りましたか？
                </p>
                <div className="mt-5 flex gap-2">
                  <button
                    onClick={() => setShowCloseConfirm(false)}
                    className="flex-1 py-2 bg-white border border-pink-300 text-pink-400 text-sm font-black rounded-xl"
                  >
                    いいえ
                  </button>
                  <button
                    onClick={onConfirmClose}
                    className="flex-1 py-2 bg-gradient-to-r from-pink-400 to-rose-400 text-white text-sm font-black rounded-xl"
                  >
                    はい
                  </button>
                </div>
                <p className="text-[10px] text-pink-400 text-center mt-3">
                  「はい」を押すとログイン画面に進みます。
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-pink-100 via-pink-50 to-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white/90 rounded-3xl shadow-xl border border-pink-100 p-6 text-center">
        <div className="text-5xl mb-4">&#128247;</div>
        <h1 className="text-2xl font-black text-pink-500">ぴたカメ</h1>

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
