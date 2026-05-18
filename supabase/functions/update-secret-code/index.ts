import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: `PIN-${newPin}`,
    });
    if (authUpdateError) {
      return jsonResponse(
        { success: false, message: authUpdateError.message ?? '認証パスワードの更新に失敗しました。' },
        500,
      );
    }

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

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse(
      { success: false, message: (error as Error).message ?? '想定外のエラーが発生しました。' },
      500,
    );
  }
});
