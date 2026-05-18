import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { hashPin } from '../lib/authPin';
import type { SubscriptionStatus } from '../types';

const NOT_CONFIGURED_MESSAGE =
  'サーバー設定が未完了のため、現在ログインできません。管理者にお問い合わせください。';
const AUTH_BOOT_TIMEOUT_MS = 8000;
const FUNCTION_INVOKE_TIMEOUT_MS = 12000;

function timeoutErrorMessage(error: unknown) {
  if (error instanceof Error && /timeout/i.test(error.message)) {
    return '通信がタイムアウトしました。電波状態を確認して、もう一度お試しください。';
  }
  return '通信に失敗しました。時間をおいてもう一度お試しください。';
}

async function invokeWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: number | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error('invoke timeout'));
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
}

type AuthState = {
  user: User | null;
  loginId: string | null;
  subscription: SubscriptionStatus;
  trialDaysLeft: number;
  hasStripeSubscription: boolean;
  loading: boolean;
  needsPinChange: boolean;
  signIn: (loginId: string, pin: string) => Promise<{ error: string | null }>;
  signUp: (email: string) => Promise<{ error: string | null; loginId: string | null }>;
  signOut: () => Promise<void>;
  completeInitialPinChange: (
    currentPin: string,
    nextPin: string,
  ) => Promise<{ error: string | null }>;
  forceResetPin: (
    loginId: string,
    nextPin: string,
    adminKey: string,
  ) => Promise<{ error: string | null; message: string | null }>;
  refreshSubscription: () => Promise<void>;
  startCheckout: () => Promise<{ error: string | null }>;
  openCustomerPortal: () => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loginId, setLoginId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus>('none');
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [hasStripeSubscription, setHasStripeSubscription] = useState(false);
  const [needsPinChange, setNeedsPinChange] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndSubscription = useCallback(async (userId: string) => {
    const [{ data: profile }, { data: sub }] = await Promise.all([
      supabase
        .from('member_profiles')
        .select('login_id, must_change_pin, pin_hash')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('subscriptions')
        .select('status, trial_end, stripe_subscription_id')
        .eq('user_id', userId)
        .single(),
    ]);

    if (profile) {
      setLoginId(profile.login_id);
      setNeedsPinChange(Boolean(profile.must_change_pin));
    } else {
      setLoginId(null);
      setNeedsPinChange(false);
    }

    if (!sub) {
      setSubscription('none');
      setTrialDaysLeft(0);
      setHasStripeSubscription(false);
      return;
    }

    setHasStripeSubscription(Boolean(sub.stripe_subscription_id));

    const trialEnd = sub.trial_end ? new Date(sub.trial_end) : null;
    const now = new Date();
    if (sub.status === 'trialing' && trialEnd && trialEnd.getTime() <= now.getTime()) {
      await supabase
        .from('subscriptions')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      setSubscription('expired');
      setTrialDaysLeft(0);
      return;
    }

    setSubscription(sub.status as SubscriptionStatus);
    if (sub.status === 'trialing' && trialEnd) {
      const days = Math.max(
        0,
        Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      );
      setTrialDaysLeft(days);
    } else {
      setTrialDaysLeft(0);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const bootTimeoutId = window.setTimeout(() => {
      if (cancelled) return;
      console.warn('[auth] initial session check timed out');
      setLoading(false);
    }, AUTH_BOOT_TIMEOUT_MS);

    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (cancelled) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          try {
            await fetchProfileAndSubscription(currentUser.id);
          } catch (error) {
            console.warn('[auth] failed to load profile/subscription', error);
          }
        }
      })
      .catch((error) => {
        console.warn('[auth] getSession failed', error);
      })
      .finally(() => {
        window.clearTimeout(bootTimeoutId);
        if (!cancelled) setLoading(false);
      });

    const {
      data: { subscription: listener },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        try {
          await fetchProfileAndSubscription(currentUser.id);
        } catch (error) {
          console.warn('[auth] failed to refresh profile/subscription', error);
        }
      } else {
        setLoginId(null);
        setSubscription('none');
        setTrialDaysLeft(0);
        setNeedsPinChange(false);
        setHasStripeSubscription(false);
      }
    });

    return () => {
      cancelled = true;
      window.clearTimeout(bootTimeoutId);
      listener.unsubscribe();
    };
  }, [fetchProfileAndSubscription]);

  const signIn = useCallback(async (lid: string, pin: string) => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_MESSAGE };

    try {
      const { data: resolved, error: resolveError } = await supabase.functions.invoke(
        'resolve-login-id',
        { body: { loginId: lid, pin } },
      );

      if (resolveError || !resolved?.email) {
        return { error: 'IDまたはPINが違います。' };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: resolved.email as string,
        password: `PIN-${pin}`,
      });
      if (error) return { error: 'IDまたはPINが違います。' };

      return { error: null };
    } catch {
      return { error: '通信に失敗しました。時間をおいてもう一度お試しください。' };
    }
  }, []);

  const signUp = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_MESSAGE, loginId: null };

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password: 'PIN-0000',
      });
      if (error) return { error: error.message, loginId: null };

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: 'PIN-0000',
      });
      if (signInError) return { error: null, loginId: null };

      const {
        data: { user: signedInUser },
      } = await supabase.auth.getUser();

      if (!signedInUser) return { error: null, loginId: null };

      const { data: profile } = await supabase
        .from('member_profiles')
        .select('login_id')
        .eq('user_id', signedInUser.id)
        .single();

      return { error: null, loginId: profile?.login_id ?? null };
    } catch {
      return { error: '通信に失敗しました。時間をおいてもう一度お試しください。', loginId: null };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setLoginId(null);
    setSubscription('none');
    setTrialDaysLeft(0);
    setNeedsPinChange(false);
    setHasStripeSubscription(false);
  }, []);

  const completeInitialPinChange = useCallback(async (currentPin: string, nextPin: string) => {
    if (!user || !loginId) return { error: 'ログイン状態が無効です。' };
    if (!/^\d{4}$/.test(nextPin)) return { error: '新しいPINは4桁の数字で入力してください。' };
    if (currentPin === nextPin) return { error: '現在のPINと異なる番号を設定してください。' };

    try {
      const pinHash = await hashPin(nextPin);

      const { error: profileError } = await supabase
        .from('member_profiles')
        .update({
          pin_hash: pinHash,
          must_change_pin: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
      if (profileError) return { error: profileError.message };

      const { error: authError } = await supabase.auth.updateUser({ password: `PIN-${nextPin}` });
      if (authError) return { error: authError.message };

      setNeedsPinChange(false);
      return { error: null };
    } catch {
      return { error: '通信に失敗しました。時間をおいてもう一度お試しください。' };
    }
  }, [user, loginId]);

  const forceResetPin = useCallback(async (lid: string, nextPin: string, adminKey: string) => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_MESSAGE, message: null };
    try {
      const { data, error } = await supabase.functions.invoke('reset-pin-admin', {
        body: { loginId: lid, nextPin, adminKey },
      });
      if (error || !data?.success) {
        return { error: data?.message ?? error?.message ?? 'PINの初期化に失敗しました。', message: null };
      }
      return { error: null, message: data.message as string };
    } catch {
      return { error: '通信に失敗しました。時間をおいてもう一度お試しください。', message: null };
    }
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (!user) return;
    try {
      await fetchProfileAndSubscription(user.id);
    } catch (error) {
      console.warn('[auth] refreshSubscription failed', error);
    }
  }, [user, fetchProfileAndSubscription]);

  const startCheckout = useCallback(async () => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_MESSAGE };
    if (!user) return { error: 'ログインが必要です。' };
    const priceId = import.meta.env.VITE_STRIPE_PRICE_ID as string | undefined;
    if (!priceId) return { error: 'Stripe価格IDが設定されていません。' };

    const baseUrl = window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, '');
    try {
      const { data, error } = await invokeWithTimeout(
        supabase.functions.invoke('create-checkout-session', {
          body: {
            customerEmail: user.email,
            userId: user.id,
            priceId,
            successUrl: `${baseUrl}/subscribe?result=success`,
            cancelUrl: `${baseUrl}/subscribe?result=cancel`,
          },
        }),
        FUNCTION_INVOKE_TIMEOUT_MS,
      );

      if (error || !data?.url) {
        return { error: '決済ページの作成に失敗しました。' };
      }
      window.location.assign(data.url as string);
      return { error: null };
    } catch (error) {
      console.warn('[checkout] failed to create session', error);
      return { error: timeoutErrorMessage(error) };
    }
  }, [user]);

  const openCustomerPortal = useCallback(async () => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_MESSAGE };
    if (!user) return { error: 'ログインが必要です。' };

    const baseUrl = window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, '');
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: {
          userId: user.id,
          returnUrl: `${baseUrl}/home`,
        },
      });
      if (error || !data?.url) {
        return { error: 'お支払い管理画面を開けませんでした。' };
      }
      window.location.href = data.url as string;
      return { error: null };
    } catch {
      return { error: '通信に失敗しました。時間をおいてもう一度お試しください。' };
    }
  }, [user]);

  const value = useMemo<AuthState>(() => ({
    user,
    loginId,
    subscription,
    trialDaysLeft,
    hasStripeSubscription,
    loading,
    needsPinChange,
    signIn,
    signUp,
    signOut,
    completeInitialPinChange,
    forceResetPin,
    refreshSubscription,
    startCheckout,
    openCustomerPortal,
  }), [
    user,
    loginId,
    subscription,
    trialDaysLeft,
    hasStripeSubscription,
    loading,
    needsPinChange,
    signIn,
    signUp,
    signOut,
    completeInitialPinChange,
    forceResetPin,
    refreshSubscription,
    startCheckout,
    openCustomerPortal,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
