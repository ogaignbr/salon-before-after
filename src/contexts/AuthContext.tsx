import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from '../lib/supabase';
import type { SubscriptionStatus } from '../types';

const NOT_CONFIGURED_MESSAGE =
  'サーバー設定が未完了のため、現在ログインできません。管理者にお問い合わせください。';
const FUNCTION_TIMEOUT_MS = 15000;
const RESET_PIN_TIMEOUT_MS = 30000;
const PIN_SESSION_STORAGE_KEY = 'pitacame:pin-session';

type AppUser = {
  id: string;
  email: string | null;
};

type FunctionResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  url?: string;
};

type PinAuthResponse = FunctionResponse & {
  sessionToken?: string;
  user?: AppUser;
  loginId?: string | null;
  mustChangePin?: boolean;
  subscription?: SubscriptionStatus;
  trialDaysLeft?: number;
  hasStripeSubscription?: boolean;
};

type StoredPinSession = {
  token: string;
  user: AppUser;
  savedAt: string;
};

function timeoutErrorMessage(error: unknown) {
  if (
    error instanceof DOMException && error.name === 'AbortError'
    || error instanceof Error && /timeout|abort/i.test(error.message)
  ) {
    return '通信がタイムアウトしました。電波状態を確認して、もう一度お試しください。';
  }
  return '通信に失敗しました。時間をおいてもう一度お試しください。';
}

function readStoredSession(): StoredPinSession | null {
  try {
    const raw = localStorage.getItem(PIN_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPinSession;
    if (!parsed?.token || !parsed?.user?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredSession(session: StoredPinSession) {
  try {
    localStorage.setItem(PIN_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage can fail in private browsing; the in-memory session still works.
  }
}

function removeStoredSession() {
  try {
    localStorage.removeItem(PIN_SESSION_STORAGE_KEY);
  } catch {
    // ignore storage failures
  }
}

async function callEdgeFunction<T extends FunctionResponse>(
  name: string,
  body: Record<string, unknown>,
  timeoutMs = FUNCTION_TIMEOUT_MS,
): Promise<T> {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) {
    return { success: false, message: NOT_CONFIGURED_MESSAGE } as T;
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null) as T | null;

    if (data) return data;
    return {
      success: false,
      message: response.ok ? '処理結果を確認できませんでした。' : '処理に失敗しました。',
    } as T;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

type AuthState = {
  user: AppUser | null;
  loginId: string | null;
  subscription: SubscriptionStatus;
  trialDaysLeft: number;
  hasStripeSubscription: boolean;
  loading: boolean;
  needsPinChange: boolean;
  signIn: (
    email: string,
    pin: string,
  ) => Promise<{ error: string | null; needsPinChange?: boolean; subscription?: SubscriptionStatus }>;
  signOut: () => Promise<void>;
  resetPinByEmail: (
    email: string,
    nextPin: string,
  ) => Promise<{ error: string | null; message: string | null }>;
  completeInitialPinChange: (
    currentSecretCode: string,
    nextSecretCode: string,
  ) => Promise<{ error: string | null }>;
  forceResetPin: (
    loginId: string,
    nextSecretCode: string,
    adminKey: string,
  ) => Promise<{ error: string | null; message: string | null }>;
  refreshSubscription: () => Promise<void>;
  startCheckout: () => Promise<{ error: string | null }>;
  openCustomerPortal: () => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loginId, setLoginId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus>('none');
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [hasStripeSubscription, setHasStripeSubscription] = useState(false);
  const [needsPinChange, setNeedsPinChange] = useState(false);
  const [loading, setLoading] = useState(true);

  const clearAuthState = useCallback(() => {
    removeStoredSession();
    setUser(null);
    setSessionToken(null);
    setLoginId(null);
    setSubscription('none');
    setTrialDaysLeft(0);
    setNeedsPinChange(false);
    setHasStripeSubscription(false);
    setLoading(false);
  }, []);

  const applyAuthPayload = useCallback((data: PinAuthResponse, fallbackToken?: string) => {
    const nextUser = data.user ?? null;
    const nextToken = data.sessionToken ?? fallbackToken ?? null;

    setUser(nextUser);
    setSessionToken(nextToken);
    setLoginId(data.loginId ?? null);
    setSubscription(data.subscription ?? 'none');
    setTrialDaysLeft(data.trialDaysLeft ?? 0);
    setHasStripeSubscription(Boolean(data.hasStripeSubscription));
    setNeedsPinChange(Boolean(data.mustChangePin));
    setLoading(false);

    if (nextUser && nextToken) {
      writeStoredSession({
        token: nextToken,
        user: nextUser,
        savedAt: new Date().toISOString(),
      });
    } else {
      removeStoredSession();
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const storedSession = readStoredSession();
    if (!storedSession) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    callEdgeFunction<PinAuthResponse>('pin-auth', {
      action: 'session',
      sessionToken: storedSession.token,
    })
      .then((data) => {
        if (cancelled) return;
        if (!data.success || !data.user) {
          clearAuthState();
          return;
        }
        applyAuthPayload(data, storedSession.token);
      })
      .catch((error) => {
        console.warn('[auth] failed to restore PIN session', error);
        if (!cancelled) clearAuthState();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applyAuthPayload, clearAuthState]);

  const signIn = useCallback(async (email: string, pin: string) => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_MESSAGE };
    if (!email.trim()) return { error: 'メールアドレスを入力してください。' };
    if (!/^\d{4}$/.test(pin)) return { error: 'PINは4桁の数字で入力してください。' };

    try {
      const data = await callEdgeFunction<PinAuthResponse>('pin-auth', {
        action: 'signIn',
        email: email.trim().toLowerCase(),
        pin,
      });

      if (!data.success || !data.user || !data.sessionToken) {
        return { error: data.message ?? 'メールアドレスまたはPINが違います。' };
      }

      applyAuthPayload(data);
      return {
        error: null,
        needsPinChange: Boolean(data.mustChangePin),
        subscription: data.subscription ?? 'none',
      };
    } catch (error) {
      return { error: timeoutErrorMessage(error) };
    }
  }, [applyAuthPayload]);

  const signOut = useCallback(async () => {
    clearAuthState();
    if (!isSupabaseConfigured) return;

    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.warn('[auth] Supabase local sign-out cleanup failed', error);
    }
  }, [clearAuthState]);

  const resetPinByEmail = useCallback(async (email: string, nextPin: string) => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_MESSAGE, message: null };
    if (!email.trim()) return { error: 'メールアドレスを入力してください。', message: null };
    if (!/^\d{4}$/.test(nextPin)) return { error: '新しいPINは4桁の数字で入力してください。', message: null };

    try {
      const data = await callEdgeFunction<FunctionResponse>(
        'reset-pin-by-email',
        { email: email.trim().toLowerCase(), nextPin },
        RESET_PIN_TIMEOUT_MS,
      );

      if (!data.success) {
        return { error: data.message ?? 'PINの更新に失敗しました。', message: null };
      }

      return {
        error: null,
        message: data.message ?? 'PINを更新しました。新しいPINでログインしてください。',
      };
    } catch (error) {
      return { error: timeoutErrorMessage(error), message: null };
    }
  }, []);

  const completeInitialPinChange = useCallback(async (_currentSecretCode: string, nextSecretCode: string) => {
    if (!user || !sessionToken) return { error: 'ログイン状態が無効です。再度ログインしてください。' };
    if (!/^\d{4}$/.test(nextSecretCode)) return { error: '新しいPINは4桁の数字で入力してください。' };
    if (nextSecretCode === '0000') return { error: '0000以外のPINを設定してください。' };

    try {
      const data = await callEdgeFunction<PinAuthResponse>('pin-auth', {
        action: 'changePin',
        sessionToken,
        nextPin: nextSecretCode,
      });

      if (!data.success || !data.user || !data.sessionToken) {
        return {
          error: data.message ?? 'PINの更新に失敗しました。時間をおいてもう一度お試しください。',
        };
      }

      applyAuthPayload(data, sessionToken);
      return { error: null };
    } catch (error) {
      return { error: timeoutErrorMessage(error) };
    }
  }, [applyAuthPayload, sessionToken, user]);

  const forceResetPin = useCallback(async (lid: string, nextSecretCode: string, adminKey: string) => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_MESSAGE, message: null };
    try {
      const data = await callEdgeFunction<FunctionResponse>('reset-pin-admin', {
        loginId: lid,
        nextPin: nextSecretCode,
        adminKey,
      });
      if (!data.success) {
        return { error: data.message ?? data.error ?? 'PINの初期化に失敗しました。', message: null };
      }
      return { error: null, message: data.message ?? 'PINを初期化しました。' };
    } catch {
      return { error: '通信に失敗しました。時間をおいてもう一度お試しください。', message: null };
    }
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (!sessionToken) return;
    try {
      const data = await callEdgeFunction<PinAuthResponse>('pin-auth', {
        action: 'session',
        sessionToken,
      });
      if (!data.success || !data.user) {
        clearAuthState();
        return;
      }
      applyAuthPayload(data, sessionToken);
    } catch (error) {
      console.warn('[auth] refreshSubscription failed', error);
    }
  }, [applyAuthPayload, clearAuthState, sessionToken]);

  const startCheckout = useCallback(async () => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_MESSAGE };
    if (!user || !sessionToken) return { error: 'ログインが必要です。' };
    const priceId = import.meta.env.VITE_STRIPE_PRICE_ID as string | undefined;
    if (!priceId) return { error: 'Stripe価格IDが設定されていません。' };

    const baseUrl = window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, '');
    try {
      const data = await callEdgeFunction<FunctionResponse>('create-checkout-session', {
        sessionToken,
        priceId,
        successUrl: `${baseUrl}/subscribe?result=success`,
        cancelUrl: `${baseUrl}/subscribe?result=cancel`,
      });

      if (!data.url) {
        return { error: data.message ?? data.error ?? '決済ページの作成に失敗しました。' };
      }
      window.location.assign(data.url);
      return { error: null };
    } catch (error) {
      console.warn('[checkout] failed to create session', error);
      return { error: timeoutErrorMessage(error) };
    }
  }, [sessionToken, user]);

  const openCustomerPortal = useCallback(async () => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED_MESSAGE };
    if (!user || !sessionToken) return { error: 'ログインが必要です。' };

    const baseUrl = window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, '');
    try {
      const data = await callEdgeFunction<FunctionResponse>('create-portal-session', {
        sessionToken,
        returnUrl: `${baseUrl}/home`,
      });
      if (!data.url) {
        return { error: data.message ?? data.error ?? 'お支払い管理画面を開けませんでした。' };
      }
      window.location.href = data.url;
      return { error: null };
    } catch {
      return { error: '通信に失敗しました。時間をおいてもう一度お試しください。' };
    }
  }, [sessionToken, user]);

  const value = useMemo<AuthState>(() => ({
    user,
    loginId,
    subscription,
    trialDaysLeft,
    hasStripeSubscription,
    loading,
    needsPinChange,
    signIn,
    signOut,
    resetPinByEmail,
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
    signOut,
    resetPinByEmail,
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
