import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AppFrame } from '../components/AppFrame';
import pitacameLogo from '../../ぴたカメロゴ.png';

const SIGNUP_CHECKOUT_EMAIL_KEY = 'signup:checkout-email';

function saveCheckoutEmail(email: string) {
  try {
    localStorage.setItem(SIGNUP_CHECKOUT_EMAIL_KEY, email);
  } catch {
    // ignore storage failures
  }
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { user, needsPinChange, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (needsPinChange) return;
    navigate('/home', { replace: true });
  }, [user, needsPinChange, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setMessage('Server configuration incomplete. Please contact support.');
      return;
    }

    setMessage('');
    setSubmitting(true);

    try {
      const priceId = import.meta.env.VITE_STRIPE_PRICE_ID as string | undefined;
      if (!priceId) {
        setSubmitting(false);
        setMessage('Stripe price ID not configured.');
        return;
      }

      const baseUrl = window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, '');

      const controller = new AbortController();
      const timerId = window.setTimeout(() => controller.abort(), 15000);

      let data: Record<string, unknown> | null = null;
      let error: Error | null = null;
      try {
        const res = await supabase.functions.invoke('signup-and-checkout', {
          body: {
            email,
            priceId,
            successUrl: `${baseUrl}/subscribe?result=success`,
            cancelUrl: `${baseUrl}/signup`,
          },
        });
        data = res.data;
        error = res.error;
      } catch (invokeErr) {
        error = invokeErr instanceof Error ? invokeErr : new Error('invoke failed');
      } finally {
        window.clearTimeout(timerId);
      }

      if (error || !data?.url) {
        setSubmitting(false);
        const msg = (data?.error as string) || 'Registration failed. Please try again.';
        setMessage(msg);
        return;
      }

      saveCheckoutEmail(email.trim().toLowerCase());

      window.location.assign(data.url as string);
    } catch {
      setSubmitting(false);
      setMessage('Connection failed. Please try again.');
    }
  };

  return (
    <AppFrame>
      <div className="mx-auto flex w-full max-w-sm flex-1 items-center">
        <div className="w-full rounded-[20px] border border-[#B9A7FF]/35 bg-[rgba(255,255,255,0.94)] p-6 shadow-[0_12px_32px_rgba(85,70,180,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45 dark:shadow-[0_20px_42px_-30px_rgba(30,46,105,0.9)]">
        <div className="text-center mb-5">
          <div className="mx-auto mb-3 w-fit rounded-[12px] border border-[#B9A7FF]/35 bg-[rgba(255,255,255,0.94)] p-2 dark:border-indigo-300/20 dark:bg-slate-900/70">
            <img
              src={pitacameLogo}
              alt="ぴたカメロゴ"
              className="h-auto w-[128px] rounded-[8px]"
            />
          </div>
          <h1 className="text-xl font-bold text-[#161B5C] dark:text-slate-100">アカウント作成</h1>
          <p className="mt-1 text-xs font-medium text-[#6B6F8A] dark:text-slate-400">
            7日間無料トライアルで開始
          </p>
        </div>

        <div className="mb-5 rounded-[12px] border border-[#B9A7FF]/30 bg-[#F4F2FF]/65 p-4 dark:border-indigo-300/20 dark:bg-indigo-500/10">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl font-bold text-[#161B5C] dark:text-slate-100">980</span>
            <span className="text-sm font-medium text-[#6B6F8A] dark:text-slate-300">円 / 月</span>
          </div>
          <ul className="mt-3 space-y-2 text-left text-xs text-[#161B5C] dark:text-slate-300">
            <li className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#6B4CFF] dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              7日間無料（課金開始前ならいつでも解約可）
            </li>
            <li className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#6B4CFF] dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              ビフォーアフター撮影は回数制限なし
            </li>
            <li className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#6B4CFF] dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              角度を合わせるガイド重ね合わせ
            </li>
            <li className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#6B4CFF] dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              AI顔検出・モザイク編集対応
            </li>
            <li className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#6B4CFF] dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              比較画像の書き出し・共有
            </li>
          </ul>
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
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
          <button
            type="submit"
            disabled={submitting}
            className="sheen-wrap w-full rounded-[10px] border border-[#8B5CFF]/30 bg-[linear-gradient(135deg,#6B4CFF_0%,#7B54FF_48%,#8B5CFF_100%)] py-3 font-bold text-white shadow-[0_8px_18px_rgba(90,65,230,0.24)] transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
          >
            {submitting ? 'Stripeへ接続中...' : '無料トライアルを開始'}
          </button>
          <p className="text-center text-[11px] leading-relaxed text-[#6B6F8A] dark:text-slate-500">
            お支払い設定はStripeの安全な画面で行われます。
          </p>
        </form>

        {message ? (
          <p className="mt-4 text-center text-xs font-medium text-[#E5486D]">{message}</p>
        ) : null}

        <div className="mt-5 text-center space-y-2">
          <button onClick={() => navigate('/')} className="text-xs font-medium text-[#6B4CFF] transition-colors hover:text-[#8B5CFF] dark:text-indigo-300 dark:hover:text-indigo-200">
            すでに登録済みの方はこちら
          </button>
          <div className="mx-auto flex w-fit items-center gap-3 rounded-[16px] border border-[#DCD7FF] bg-white px-4 py-1.5 text-xs text-[#6B6F8A] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-400">
            <button onClick={() => navigate('/terms')} className="transition-colors hover:text-[#161B5C] dark:hover:text-slate-200">利用規約</button>
            <span className="text-[#DCD7FF] dark:text-slate-600">|</span>
            <button onClick={() => navigate('/privacy')} className="transition-colors hover:text-[#161B5C] dark:hover:text-slate-200">プライバシー</button>
          </div>
        </div>
      </div>
      </div>
    </AppFrame>
  );
}
