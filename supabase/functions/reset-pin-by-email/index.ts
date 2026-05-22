const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const INTERNAL_REQUEST_TIMEOUT_MS = 10000;
const AUTH_UPDATE_ATTEMPTS = 3;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
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

function isUsableSubscription(sub: { status?: string | null; trial_end?: string | null } | null) {
  if (!sub?.status) return false;
  if (sub.status === 'active') return true;
  if (sub.status !== 'trialing') return false;
  if (!sub.trial_end) return false;
  return new Date(sub.trial_end).getTime() > Date.now();
}

async function updateAuthPassword(userId: string, pin: string) {
  let lastMessage = '認証情報の更新に失敗しました。';

  for (let attempt = 1; attempt <= AUTH_UPDATE_ATTEMPTS; attempt += 1) {
    try {
      const response = await supabaseFetch(`/auth/v1/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ password: `PIN-${pin}` }),
      }, 15000);

      if (response.ok) return { ok: true, message: null };
      lastMessage = await readErrorMessage(response, lastMessage);
    } catch (error) {
      lastMessage = error instanceof DOMException && error.name === 'AbortError'
        ? '認証情報の更新がタイムアウトしました。'
        : error instanceof Error
          ? error.message
          : lastMessage;
    }
  }

  return { ok: false, message: lastMessage };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ success: false, message: 'method not allowed' }, 405);
  }

  try {
    const { email, nextPin } = await req.json();
    const normalizedEmail = String(email ?? '').trim().toLowerCase();

    if (!normalizedEmail) {
      return jsonResponse({ success: false, message: 'メールアドレスを入力してください。' }, 400);
    }
    if (!/^\d{4}$/.test(nextPin ?? '')) {
      return jsonResponse({ success: false, message: '新しいPINは4桁の数字で入力してください。' }, 400);
    }

    const profileResponse = await supabaseFetch(
      `/rest/v1/member_profiles?email=eq.${encodeURIComponent(normalizedEmail)}&select=user_id`,
      { method: 'GET' },
    );
    if (!profileResponse.ok) {
      const message = await readErrorMessage(profileResponse, 'PINの更新に失敗しました。');
      return jsonResponse({ success: false, message }, 500);
    }

    const profiles = await profileResponse.json() as Array<{ user_id: string }>;
    const profile = profiles[0] ?? null;
    if (!profile?.user_id) {
      return jsonResponse({ success: false, message: '有効な契約中のメールアドレスではありません。' }, 403);
    }

    const subscriptionResponse = await supabaseFetch(
      `/rest/v1/subscriptions?user_id=eq.${profile.user_id}&select=status,trial_end`,
      { method: 'GET' },
    );
    if (!subscriptionResponse.ok) {
      const message = await readErrorMessage(subscriptionResponse, '契約状態を確認できませんでした。');
      return jsonResponse({ success: false, message }, 500);
    }

    const subscriptions = await subscriptionResponse.json() as Array<{ status?: string | null; trial_end?: string | null }>;
    if (!isUsableSubscription(subscriptions[0] ?? null)) {
      return jsonResponse({ success: false, message: '有効な契約中のメールアドレスではありません。' }, 403);
    }

    const newPin = String(nextPin);
    const authUpdate = await updateAuthPassword(profile.user_id, newPin);
    if (!authUpdate.ok) {
      return jsonResponse({ success: false, message: authUpdate.message }, 500);
    }

    const pinHash = await hashPin(newPin);
    const updateResponse = await supabaseFetch(`/rest/v1/member_profiles?user_id=eq.${profile.user_id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        pin_hash: pinHash,
        must_change_pin: false,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!updateResponse.ok) {
      const message = await readErrorMessage(updateResponse, 'PINの保存に失敗しました。');
      return jsonResponse({ success: false, message }, 500);
    }

    return jsonResponse({ success: true, message: 'PINを更新しました。新しいPINでログインしてください。' });
  } catch (error) {
    return jsonResponse(
      { success: false, message: (error as Error).message ?? '想定外のエラーが発生しました。' },
      500,
    );
  }
});
