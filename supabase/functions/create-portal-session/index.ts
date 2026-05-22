import Stripe from 'https://esm.sh/stripe@17?target=deno';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2025-04-30.basil',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type SessionPayload = {
  sub: string;
  email: string;
  profileUpdatedAt: string;
  exp: number;
};

type Profile = {
  user_id: string;
  email: string;
  updated_at: string;
};

type Subscription = {
  stripe_customer_id?: string | null;
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

async function parseSessionToken(token: unknown) {
  if (typeof token !== 'string') return null;
  const [payloadPart, signaturePart] = token.split('.');
  if (!payloadPart || !signaturePart) return null;
  if (!safeEqual(signaturePart, await hmacSignature(payloadPart))) return null;

  try {
    const payload = JSON.parse(base64UrlDecodeText(payloadPart)) as SessionPayload;
    if (!payload.sub || !payload.email || !payload.profileUpdatedAt || !payload.exp) return null;
    if (payload.exp <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

async function supabaseFetch(path: string, init: RequestInit = {}) {
  return fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

async function validateSession(token: unknown) {
  const payload = await parseSessionToken(token);
  if (!payload) return null;

  const response = await supabaseFetch(
    `/rest/v1/member_profiles?user_id=eq.${encodeURIComponent(payload.sub)}&select=user_id,email,updated_at`,
    { method: 'GET' },
  );
  if (!response.ok) return null;
  const profiles = await response.json() as Profile[];
  const profile = profiles[0] ?? null;
  if (!profile) return null;
  if (profile.email !== payload.email) return null;
  if (profile.updated_at !== payload.profileUpdatedAt) return null;
  return profile;
}

async function getSubscription(userId: string) {
  const response = await supabaseFetch(
    `/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(userId)}&select=stripe_customer_id`,
    { method: 'GET' },
  );
  if (!response.ok) return null;
  const subscriptions = await response.json() as Subscription[];
  return subscriptions[0] ?? null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { sessionToken, returnUrl } = await req.json();
    const profile = await validateSession(sessionToken);

    if (!profile) {
      return jsonResponse({ error: 'ログイン状態が無効です。再度ログインしてください。' }, 401);
    }
    if (!returnUrl) {
      return jsonResponse({ error: 'Missing required fields' }, 400);
    }

    const sub = await getSubscription(profile.user_id);
    let customerId = sub?.stripe_customer_id ?? null;

    if (!customerId) {
      const stripeCustomers = await stripe.customers.list({ email: profile.email, limit: 10 });
      const sortedCustomers = [...stripeCustomers.data].sort(
        (a, b) => (b.created ?? 0) - (a.created ?? 0),
      );
      const candidate = sortedCustomers[0];

      if (!candidate) {
        return jsonResponse(
          { error: 'Stripeにお客様の登録情報が見つかりません。サポートまでお問い合わせください。' },
          404,
        );
      }

      customerId = candidate.id;

      await supabaseFetch(`/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(profile.user_id)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        }),
      }).catch((updateError) => {
        console.warn('[portal] failed to persist stripe_customer_id', updateError);
      });
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return jsonResponse({ url: portal.url });
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});
