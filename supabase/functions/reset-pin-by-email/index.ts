import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

function isUsableSubscription(sub: { status?: string | null; trial_end?: string | null } | null) {
  if (!sub?.status) return false;
  if (sub.status === 'active') return true;
  if (sub.status !== 'trialing') return false;
  if (!sub.trial_end) return false;
  return new Date(sub.trial_end).getTime() > Date.now();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('member_profiles')
      .select('user_id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (profileError) {
      return jsonResponse({ success: false, message: 'PINの更新に失敗しました。' }, 500);
    }
    if (!profile?.user_id) {
      return jsonResponse({ success: false, message: '有効な契約中のメールアドレスではありません。' }, 403);
    }

    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select('status, trial_end')
      .eq('user_id', profile.user_id)
      .maybeSingle();

    if (subscriptionError) {
      return jsonResponse({ success: false, message: '契約状態を確認できませんでした。' }, 500);
    }
    if (!isUsableSubscription(subscription)) {
      return jsonResponse({ success: false, message: '有効な契約中のメールアドレスではありません。' }, 403);
    }

    const newPin = String(nextPin);
    const pinHash = await hashPin(newPin);

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(profile.user_id, {
      password: `PIN-${newPin}`,
    });
    if (authError) {
      return jsonResponse({ success: false, message: authError.message ?? '認証情報の更新に失敗しました。' }, 500);
    }

    const { error: updateError } = await supabaseAdmin
      .from('member_profiles')
      .update({
        pin_hash: pinHash,
        must_change_pin: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', profile.user_id);

    if (updateError) {
      return jsonResponse({ success: false, message: 'PINの保存に失敗しました。' }, 500);
    }

    return jsonResponse({ success: true, message: 'PINを更新しました。新しいPINでログインしてください。' });
  } catch (error) {
    return jsonResponse(
      { success: false, message: (error as Error).message ?? '想定外のエラーが発生しました。' },
      500,
    );
  }
});
