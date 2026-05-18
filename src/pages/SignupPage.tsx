import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
    <div className="min-h-dvh bg-slate-50 flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6">
        <div className="text-center mb-5">
          <div className="w-12 h-12 mx-auto mb-3 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800">Create Account</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Start with 7-day free trial
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-5">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl font-bold text-slate-800">980</span>
            <span className="text-sm font-medium text-slate-500">JPY / mo</span>
          </div>
          <ul className="mt-3 text-xs text-slate-500 space-y-2 text-left">
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              7 days free - cancel anytime before charges apply
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Unlimited before/after captures
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Ghost overlay alignment
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              AI face detection & mosaic
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Export & share comparison images
            </li>
          </ul>
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all bg-slate-50"
              placeholder="example@salon.com"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {submitting ? 'Redirecting to Stripe...' : 'Start Free Trial'}
          </button>
          <p className="text-[11px] text-slate-400 leading-relaxed text-center">
            You will be redirected to Stripe for secure payment setup.
          </p>
        </form>

        {message ? (
          <p className="mt-4 text-center text-xs font-medium text-red-500">{message}</p>
        ) : null}

        <div className="mt-5 text-center space-y-2">
          <button onClick={() => navigate('/')} className="text-xs text-indigo-500 font-medium hover:text-indigo-700 transition-colors">
            Already have an account? Sign in
          </button>
          <div className="flex justify-center gap-4">
            <button onClick={() => navigate('/terms')} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Terms</button>
            <span className="text-xs text-slate-300">|</span>
            <button onClick={() => navigate('/privacy')} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Privacy</button>
          </div>
        </div>
      </div>
    </div>
  );
}
