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
    navigate('/');
  };

  if (isSuccess) {
    return (
      <div className="min-h-dvh bg-slate-50 flex items-center justify-center px-6">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6">
          <div className="text-center mb-4">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800">Registration Complete</h1>
          </div>

          <p className="text-xs text-slate-500 text-center leading-relaxed">
            Free for 7 days. Monthly billing of 980 JPY starts on day 8.
            <br />Cancel before then to avoid charges.
          </p>

          <div className="mt-5 bg-indigo-50 rounded-xl p-4 border border-indigo-100 text-center">
            <p className="text-xs font-semibold text-indigo-600">Login Credentials</p>
            <p className="mt-2 text-sm font-semibold text-slate-700">
              Your email + PIN: 0000
            </p>
            <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
              You will be asked to change your PIN on first login.
            </p>
          </div>

          <button
            onClick={goToLogin}
            className="mt-6 w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50 flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-4 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-800">PitaCame</h1>

        {subscription === 'expired'
          || subscription === 'canceled'
          || subscription === 'past_due' ? (
          <div className="mt-4 space-y-1">
            <p className="text-sm text-slate-700 font-semibold">Subscription Inactive</p>
            <p className="text-xs text-slate-400">Please register a payment method to continue.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-1">
            <p className="text-sm text-slate-700 font-semibold">Payment Setup (7-day free trial)</p>
            <p className="text-xs text-slate-400">Monthly billing of 980 JPY starts on day 8.</p>
          </div>
        )}

        <div className="mt-5 bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl font-bold text-slate-800">980</span>
            <span className="text-sm font-medium text-slate-500">JPY / mo</span>
          </div>
          <ul className="mt-3 text-xs text-slate-500 space-y-1.5 text-left">
            <li className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              7 days free - cancel anytime
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Unlimited before/after captures
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Ghost overlay & AI mosaic
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Export & share comparisons
            </li>
          </ul>
        </div>

        <button
          onClick={handleSubscribe}
          disabled={submitting}
          className="mt-5 w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {submitting ? `${checkoutStatusLabel}... ${checkoutProgress}%` : 'Set Up Payment'}
        </button>
        {submitting ? (
          <>
            <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                style={{ width: `${checkoutProgress}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-400 font-medium text-center">{checkoutStatusLabel}</p>
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
          className="mt-3 w-full py-2 text-xs text-indigo-500 font-medium hover:text-indigo-700 transition-colors"
        >
          Already registered? Tap to refresh
        </button>

        {message ? (
          <p className="mt-3 text-xs font-medium text-red-500">{message}</p>
        ) : null}

        <div className="mt-4 flex justify-center gap-4">
          <button onClick={() => navigate('/terms')} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
            Terms
          </button>
          <span className="text-xs text-slate-300">|</span>
          <button onClick={() => navigate('/privacy')} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
            Privacy
          </button>
        </div>

        <button
          onClick={async () => {
            await signOut();
            navigate('/');
          }}
          className="mt-3 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
