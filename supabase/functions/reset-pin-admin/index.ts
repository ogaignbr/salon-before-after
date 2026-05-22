import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const adminKey = Deno.env.get('PIN_RESET_ADMIN_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const { loginId, nextPin, adminKey: inputKey } = await req.json();

    if (inputKey !== adminKey) {
      return new Response(
        JSON.stringify({ success: false, message: '初期化キーが正しくありません。' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!/^\d{4}$/.test(loginId ?? '') || !/^\d{4}$/.test(nextPin ?? '')) {
      return new Response(
        JSON.stringify({ success: false, message: 'IDとPINは4桁数字で入力してください。' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const pinHash = await hashPin(nextPin);
    const { data: profile, error } = await supabaseAdmin
      .from('member_profiles')
      .select('user_id')
      .eq('login_id', loginId)
      .maybeSingle();

    if (error || !profile?.user_id) {
      return new Response(
        JSON.stringify({ success: false, message: '対象のIDが見つかりません。' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from('member_profiles')
      .update({
        pin_hash: pinHash,
        must_change_pin: nextPin === '0000',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', profile.user_id);

    if (updateError) {
      return new Response(
        JSON.stringify({ success: false, message: 'PINの更新に失敗しました。' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'PINを初期化しました。' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
