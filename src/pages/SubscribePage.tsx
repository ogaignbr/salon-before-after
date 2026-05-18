import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SIGNUP_CHECKOUT_EMAIL_KEY = 'signup:checkout-email';

function clearCheckoutEmail() {
  try {
    localStorage.removeItem(SIGNUP_CHECKOUT_EMAIL_KEY);
  } catch {
    // ignore storage failures
  }
}

function checkoutStageLabel(progress: number) {
  if (progress < 35) return '通信確認中';
  if (progress < 75) return '決済ページ作成中';
  return '決済ページへ移動中';
}

export default function SubscribePage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const {
    subscription,
    signOut,
    refreshSubscription,
    startCheckout,
  } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [checkoutProgress, setCheckoutProgress] = useState(0);
  const [message, setMessage] = useState('');
  const result = params.get('result');
  const isSuccess = result === 'success';
  const checkoutStatusLabel = checkoutStageLabel(checkoutProgress);

  useEffect(() => {
    if (!submitting) {
      setCheckoutProgress(0);
      return;
    }
    setCheckoutProgress(12);
    const timer = window.setInterval(() => {
      setCheckoutProgress((current) => {
        if (current >= 92) return current;
        if (current < 50) return Math.min(92, current + 8);
        if (current < 80) return Math.min(92, current + 4);
        return Math.min(92, current + 2);
      });
    }, 280);
    return () => window.clearInterval(timer);
  }, [submitting]);

  const handleSubscribe = async () => {
    setMessage('');
    setSubmitting(true);
    try {
      const { error } = await startCheckout();
      if (error) {
        setMessage(error);
        setCheckoutProgress(0);
      }
    } catch {
      setMessage('通信に失敗しました。時間をおいてもう一度お試しください。');
      setCheckoutProgress(0);
    } finally {
      setSubmitting(false);
    }
  };

  const goToLogin = async () => {
    clearCheckoutEmail();
    setParams({}, { replace: true });
    await signOut();
    navigate('/');
  };

  // ===== Stripe決済完了画面（シンプル表示） =====
  if (isSuccess) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-pink-100 via-pink-50 to-white flex items-center justify-center px-6">
        <div className="w-full max-w-sm bg-white/90 rounded-3xl shadow-xl border border-pink-100 p-6 relative">
          <div className="text-center mb-3">
            <div className="text-4xl mb-1">&#127881;</div>
            <h1 className="text-2xl font-black text-pink-500">登録が完了しました！</h1>
          </div>

          <p className="text-xs text-pink-400 text-center leading-relaxed">
            7日間は0円、8日目から月額980円が自動で発生します。<br />
            期間内に解約すれば請求は発生しません。
          </p>

          <div className="mt-5 bg-pink-50 rounded-2xl p-4 border-2 border-pink-200 text-center">
            <p className="text-xs font-bold text-pink-500">ログイン情報</p>
            <p className="mt-2 text-sm font-bold text-rose-500">
              登録メールアドレス ＋ 暗証番号「0000」
            </p>
            <p className="mt-2 text-[11px] text-pink-400 leading-relaxed">
              初回ログイン後、お好みの暗証番号に変更してください。
            </p>
          </div>

          <button
            onClick={goToLogin}
            className="mt-6 w-full py-3 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black rounded-2xl shadow-md active:scale-95 transition-transform"
          >
            ログイン画面へ進む
          </button>
        </div>
      </div>
    );
  }

  // ===== サブスク未登録の場合のカード登録画面 =====
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
          {submitting ? `${checkoutStatusLabel}... ${checkoutProgress}%` : 'カードを登録する'}
        </button>
        {submitting ? (
          <>
            <div className="mt-2 w-full bg-pink-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-400 to-rose-400 transition-all duration-300"
                style={{ width: `${checkoutProgress}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-pink-400 font-bold text-center">{checkoutStatusLabel}</p>
          </>
        ) : null}

        <button
          onClick={async () => {
            setSubmitting(true);
            try {
              await refreshSubscription();
            } catch {
              // ignore
            } finally {
              setSubmitting(false);
            }
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
            navigate('/');
          }}
          className="mt-3 text-xs text-pink-300 underline"
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}
