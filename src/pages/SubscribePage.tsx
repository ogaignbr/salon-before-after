import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppFrame } from '../components/AppFrame';

const SIGNUP_CHECKOUT_EMAIL_KEY = 'signup:checkout-email';

function clearCheckoutEmail() {
  try {
    localStorage.removeItem(SIGNUP_CHECKOUT_EMAIL_KEY);
  } catch {
    // ignore storage failures
  }
}

function checkoutStageLabel(progress: number) {
  if (progress < 35) return 'Connecting';
  if (progress < 75) return 'Creating checkout';
  return 'Redirecting';
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
      setMessage('Connection failed. Please try again.');
      setCheckoutProgress(0);
    } finally {
      setSubmitting(false);
    }
  };

  const goToLogin = async () => {
    clearCheckoutEmail();
    setParams({}, { replace: true });
    await signOut();
    navigate('/', { replace: true });
  };

  if (isSuccess) {
    return (
      <AppFrame>
        <div className="mx-auto flex w-full max-w-sm flex-1 items-center">
          <div className="w-full rounded-[20px] border border-[#A8DDE5]/35 bg-[rgba(255,255,255,0.94)] p-6 shadow-[0_12px_32px_rgba(60,140,170,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45 dark:shadow-[0_20px_42px_-30px_rgba(30,46,105,0.9)]">
          <div className="text-center mb-4">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200/70 bg-emerald-50/80 dark:border-emerald-300/20 dark:bg-emerald-400/10">
              <svg className="h-6 w-6 text-emerald-500 dark:text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-[#1B3A5C] dark:text-slate-100">登録が完了しました</h1>
          </div>

          <p className="text-center text-xs leading-relaxed text-[#5B7689] dark:text-slate-400">
            7日間は無料でご利用いただけます。8日目から月額980円が発生します。
            <br />課金開始前の解約は、利用規約ページから可能です。
          </p>

          <div className="mt-5 rounded-[12px] border border-[#A8DDE5]/30 bg-[#F0FBF8]/80 p-4 text-center dark:border-cyan-300/20 dark:bg-cyan-500/10">
            <p className="text-xs font-semibold text-[#3DC4A8] dark:text-cyan-300">ログイン情報</p>
            <p className="mt-2 text-sm font-semibold text-[#1B3A5C] dark:text-slate-100">
              登録メール + PIN: 0000
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-[#5B7689] dark:text-slate-400">
              初回ログイン時にPIN変更が求められます。
            </p>
          </div>

          <button
            onClick={goToLogin}
            className="sheen-wrap mt-6 w-full rounded-[10px] border border-[#5BB5E7]/30 bg-[linear-gradient(135deg,#3DC4A8_0%,#48B8CB_48%,#5BB5E7_100%)] py-3 font-bold text-white shadow-[0_8px_18px_rgba(70,160,200,0.24)] transition-all hover:brightness-105 active:scale-[0.99]"
          >
            ログイン画面へ
          </button>
        </div>
        </div>
      </AppFrame>
    );
  }

  return (
    <AppFrame>
      <div className="mx-auto flex w-full max-w-sm flex-1 items-center">
        <div className="w-full rounded-[20px] border border-[#A8DDE5]/35 bg-[rgba(255,255,255,0.94)] p-6 text-center shadow-[0_12px_32px_rgba(60,140,170,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45 dark:shadow-[0_20px_42px_-30px_rgba(30,46,105,0.9)]">
        <div className="relative mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[12px] border border-[#A8DDE5]/35 bg-[rgba(255,255,255,0.94)] dark:border-cyan-300/20 dark:bg-slate-900/70">
          <svg className="h-6 w-6 text-[#3DC4A8] dark:text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9a2 2 0 012-2h1.1a2 2 0 001.62-.826l.56-.748A2 2 0 0112.88 5h2.24a2 2 0 011.6.8l.56.748A2 2 0 0018.9 7H20a2 2 0 012 2v7.5a2.5 2.5 0 01-2.5 2.5h-15A2.5 2.5 0 012 16.5V9a2 2 0 012-2h2z" />
            <circle cx="12" cy="12.75" r="3.25" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-[#1B3A5C] dark:text-slate-100">ぴたカメ</h1>

        {subscription === 'expired'
          || subscription === 'canceled'
          || subscription === 'past_due' ? (
          <div className="mt-4 space-y-1">
            <p className="text-sm font-semibold text-[#1B3A5C] dark:text-slate-100">サブスクが無効です</p>
            <p className="text-xs text-[#5B7689] dark:text-slate-500">継続利用には支払い設定が必要です。</p>
          </div>
        ) : (
          <div className="mt-4 space-y-1">
            <p className="text-sm font-semibold text-[#1B3A5C] dark:text-slate-100">お支払い設定（7日間無料）</p>
            <p className="text-xs text-[#5B7689] dark:text-slate-500">8日目から月額980円で継続します。</p>
          </div>
        )}

        <div className="mt-5 rounded-[12px] border border-[#A8DDE5]/30 bg-[#F0FBF8]/80 p-4 dark:border-cyan-300/20 dark:bg-cyan-500/10">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl font-bold text-[#1B3A5C] dark:text-slate-100">980</span>
            <span className="text-sm font-medium text-[#5B7689] dark:text-slate-300">円 / 月</span>
          </div>
          <ul className="mt-3 space-y-1.5 text-left text-xs text-[#1B3A5C] dark:text-slate-300">
            <li className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5 shrink-0 text-[#3DC4A8] dark:text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              7日間無料・いつでも解約可
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5 shrink-0 text-[#3DC4A8] dark:text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              ビフォーアフター撮影は回数制限なし
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5 shrink-0 text-[#3DC4A8] dark:text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              ガイド重ね合わせ・AIモザイク
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5 shrink-0 text-[#3DC4A8] dark:text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              比較画像の書き出し・共有
            </li>
          </ul>
        </div>

        <button
          onClick={handleSubscribe}
          disabled={submitting}
          className="sheen-wrap mt-5 w-full rounded-[10px] border border-[#5BB5E7]/30 bg-[linear-gradient(135deg,#3DC4A8_0%,#48B8CB_48%,#5BB5E7_100%)] py-3 font-bold text-white shadow-[0_8px_18px_rgba(70,160,200,0.24)] transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
        >
          {submitting ? `${checkoutStatusLabel}... ${checkoutProgress}%` : '支払いを設定する'}
        </button>
        {submitting ? (
          <>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#F0FBF8] dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-[#3DC4A8] transition-all duration-300 dark:bg-cyan-400"
                style={{ width: `${checkoutProgress}%` }}
              />
            </div>
            <p className="mt-1 text-center text-[10px] font-medium text-[#5B7689] dark:text-slate-500">{checkoutStatusLabel}</p>
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
          className="mt-3 w-full py-2 text-xs font-medium text-[#3DC4A8] transition-colors hover:text-[#5BB5E7] dark:text-cyan-300 dark:hover:text-cyan-200"
        >
          登録済みの方は状態を再読み込み
        </button>

        {message ? (
          <p className="mt-3 text-xs font-medium text-[#E5486D]">{message}</p>
        ) : null}

        <div className="mx-auto mt-4 flex w-fit items-center gap-3 rounded-[16px] border border-[#C9E5E0] bg-white px-4 py-1.5 text-xs text-[#5B7689] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-400">
          <button onClick={() => navigate('/terms')} className="transition-colors hover:text-[#1B3A5C] dark:hover:text-slate-200">利用規約</button>
          <span className="text-[#C9E5E0] dark:text-slate-600">|</span>
          <button onClick={() => navigate('/privacy')} className="transition-colors hover:text-[#1B3A5C] dark:hover:text-slate-200">プライバシー</button>
        </div>

        <button
          onClick={async () => {
            await signOut();
            navigate('/', { replace: true });
          }}
          className="mt-3 text-xs text-[#5B7689] transition-colors hover:text-[#1B3A5C] dark:text-slate-500 dark:hover:text-slate-300"
        >
          ログアウト
        </button>
      </div>
      </div>
    </AppFrame>
  );
}
