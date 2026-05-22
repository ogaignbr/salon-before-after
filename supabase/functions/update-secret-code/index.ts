import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LEGACY_AUTH_SYNC_TIMEOUT_MS = 12000;

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
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

async function syncLegacyAuthPassword(userId: string, pin: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LEGACY_AUTH_SYNC_TIMEOUT_MS);

  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')!}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      signal: controller.signal,
      headers: {
        apikey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: `PIN-${pin}` }),
    });
    if (!response.ok) {
      console.warn('[update-secret-code] legacy auth password sync failed', response.status);
      return false;
    }
    return true;
  } catch (error) {
    console.warn('[update-secret-code] legacy auth password sync timed out or failed', error);
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ success: false, message: 'unauthorized' }, 401);
    }

    const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!accessToken) {
      return jsonResponse({ success: false, message: 'unauthorized' }, 401);
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
    if (userError || !userData?.user) {
      return jsonResponse({ success: false, message: 'unauthorized' }, 401);
    }

    const userId = userData.user.id;

    const { nextSecretCode } = await req.json();
    if (!/^\d{4}$/.test(nextSecretCode ?? '')) {
      return jsonResponse(
        { success: false, message: '新しい暗証番号は4桁の数字で入力してください。' },
        400,
      );
    }

    const newPin = String(nextSecretCode);
    const pinHash = await hashPin(newPin);

    const { error: profileError } = await supabaseAdmin
      .from('member_profiles')
      .update({
        pin_hash: pinHash,
        must_change_pin: newPin === '0000',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (profileError) {
      return jsonResponse(
        { success: false, message: profileError.message ?? '暗証番号の保存に失敗しました。' },
        500,
      );
    }

    const legacyAuthSynced = await syncLegacyAuthPassword(userId, newPin);

    return jsonResponse({ success: true, legacyAuthSynced });
  } catch (error) {
    return jsonResponse(
      { success: false, message: (error as Error).message ?? '想定外のエラーが発生しました。' },
      500,
    );
  }
});
