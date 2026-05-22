const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const INTERNAL_REQUEST_TIMEOUT_MS = 10000;

type Profile = {
  user_id: string;
  email: string;
  login_id: string;
  pin_hash: string;
  must_change_pin: boolean;
  updated_at: string;
};

type Subscription = {
  status?: string | null;
  trial_end?: string | null;
  stripe_subscription_id?: string | null;
};

type SessionPayload = {
  sub: string;
  email: string;
  profileUpdatedAt: string;
  iat: number;
  exp: number;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function base64UrlEncode(bytes: Uint8Array) {
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlEncodeText(value: string) {
  return base64UrlEncode(new TextEncoder().encode(value));
}

function base64UrlDecodeText(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    Math.ceil(value.length / 4) * 4,
    '=',
  );
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function hmacSignature(value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(serviceRoleKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return base64UrlEncode(new Uint8Array(signature));
}

async function createSessionToken(profile: Profile) {
  const now = Date.now();
  const payload: SessionPayload = {
    sub: profile.user_id,
    email: profile.email,
    profileUpdatedAt: profile.updated_at,
    iat: now,
    exp: now + SESSION_TTL_MS,
  };
  const encodedPayload = base64UrlEncodeText(JSON.stringify(payload));
  const signature = await hmacSignature(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

async function parseSessionToken(token: unknown) {
  if (typeof token !== 'string') return null;
  const [payloadPart, signaturePart] = token.split('.');
  if (!payloadPart || !signaturePart) return null;

  const expectedSignature = await hmacSignature(payloadPart);
  if (!safeEqual(signaturePart, expectedSignature)) return null;

  try {
    const payload = JSON.parse(base64UrlDecodeText(payloadPart)) as SessionPayload;
    if (!payload.sub || !payload.email || !payload.profileUpdatedAt || !payload.exp) return null;
    if (payload.exp <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(pin);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function supabaseFetch(path: string, init: RequestInit = {}, timeoutMs = INTERNAL_REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(`${supabaseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const body = await response.json();
    return body.message ?? body.error_description ?? body.error ?? fallback;
  } catch {
    return fallback;
  }
}

async function getProfileByEmail(email: string) {
  const response = await supabaseFetch(
    `/rest/v1/member_profiles?email=eq.${encodeURIComponent(email)}&select=user_id,email,login_id,pin_hash,must_change_pin,updated_at`,
    { method: 'GET' },
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'ユーザー情報を確認できませんでした。'));
  }
  const profiles = await response.json() as Profile[];
  return profiles[0] ?? null;
}

async function getProfileByUserId(userId: string) {
  const response = await supabaseFetch(
    `/rest/v1/member_profiles?user_id=eq.${encodeURIComponent(userId)}&select=user_id,email,login_id,pin_hash,must_change_pin,updated_at`,
    { method: 'GET' },
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'ユーザー情報を確認できませんでした。'));
  }
  const profiles = await response.json() as Profile[];
  return profiles[0] ?? null;
}

async function getSubscription(userId: string) {
  const response = await supabaseFetch(
    `/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(userId)}&select=status,trial_end,stripe_subscription_id`,
    { method: 'GET' },
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, '契約状態を確認できませんでした。'));
  }
  const subscriptions = await response.json() as Subscription[];
  const subscription = subscriptions[0] ?? null;

  if (subscription?.status === 'trialing' && subscription.trial_end) {
    const trialExpired = new Date(subscription.trial_end).getTime() <= Date.now();
    if (trialExpired) {
      await supabaseFetch(`/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ status: 'expired', updated_at: new Date().toISOString() }),
      }).catch(() => null);
      return { ...subscription, status: 'expired' };
    }
  }

  return subscription;
}

function trialDaysLeft(subscription: Subscription | null) {
  if (subscription?.status !== 'trialing' || !subscription.trial_end) return 0;
  return Math.max(
    0,
    Math.ceil((new Date(subscription.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );
}

function buildPayload(profile: Profile, subscription: Subscription | null, sessionToken: string) {
  return {
    success: true,
    sessionToken,
    user: { id: profile.user_id, email: profile.email },
    loginId: profile.login_id,
    mustChangePin: profile.must_change_pin,
    subscription: subscription?.status ?? 'none',
    trialDaysLeft: trialDaysLeft(subscription),
    hasStripeSubscription: Boolean(subscription?.stripe_subscription_id),
  };
}

async function validateSessionToken(token: unknown) {
  const payload = await parseSessionToken(token);
  if (!payload) return null;

  const profile = await getProfileByUserId(payload.sub);
  if (!profile) return null;
  if (profile.email !== payload.email) return null;
  if (profile.updated_at !== payload.profileUpdatedAt) return null;
  return profile;
}

async function updatePin(profile: Profile, nextPin: string) {
  const pinHash = await hashPin(nextPin);
  const updatedAt = new Date().toISOString();
  const response = await supabaseFetch(
    `/rest/v1/member_profiles?user_id=eq.${encodeURIComponent(profile.user_id)}&select=user_id,email,login_id,pin_hash,must_change_pin,updated_at`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        pin_hash: pinHash,
        must_change_pin: false,
        updated_at: updatedAt,
      }),
    },
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'PINの保存に失敗しました。'));
  }
  const profiles = await response.json() as Profile[];
  return profiles[0] ?? { ...profile, pin_hash: pinHash, must_change_pin: false, updated_at: updatedAt };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ success: false, message: 'method not allowed' }, 405);
  }

  try {
    const body = await req.json();
    const action = String(body.action ?? '');

    if (action === 'signIn') {
      const email = String(body.email ?? '').trim().toLowerCase();
      const pin = String(body.pin ?? '');
      if (!email || !/^\d{4}$/.test(pin)) {
        return jsonResponse({ success: false, message: 'メールアドレスと4桁のPINを入力してください。' }, 400);
      }

      const profile = await getProfileByEmail(email);
      const pinHash = await hashPin(pin);
      if (!profile || profile.pin_hash !== pinHash) {
        return jsonResponse({ success: false, message: 'メールアドレスまたはPINが違います。' }, 401);
      }

      const subscription = await getSubscription(profile.user_id);
      const sessionToken = await createSessionToken(profile);
      return jsonResponse(buildPayload(profile, subscription, sessionToken));
    }

    if (action === 'session') {
      const profile = await validateSessionToken(body.sessionToken);
      if (!profile) {
        return jsonResponse({ success: false, message: 'ログイン状態が無効です。再度ログインしてください。' }, 401);
      }
      const subscription = await getSubscription(profile.user_id);
      const sessionToken = await createSessionToken(profile);
      return jsonResponse(buildPayload(profile, subscription, sessionToken));
    }

    if (action === 'changePin') {
      const nextPin = String(body.nextPin ?? '');
      if (!/^\d{4}$/.test(nextPin)) {
        return jsonResponse({ success: false, message: '新しいPINは4桁の数字で入力してください。' }, 400);
      }

      const profile = await validateSessionToken(body.sessionToken);
      if (!profile) {
        return jsonResponse({ success: false, message: 'ログイン状態が無効です。再度ログインしてください。' }, 401);
      }

      const updatedProfile = await updatePin(profile, nextPin);
      const subscription = await getSubscription(updatedProfile.user_id);
      const sessionToken = await createSessionToken(updatedProfile);
      return jsonResponse(buildPayload(updatedProfile, subscription, sessionToken));
    }

    return jsonResponse({ success: false, message: 'unknown action' }, 400);
  } catch (error) {
    return jsonResponse(
      { success: false, message: (error as Error).message ?? '想定外のエラーが発生しました。' },
      500,
    );
  }
});
