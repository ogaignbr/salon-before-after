import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@17?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2025-04-30.basil',
});

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, returnUrl } = await req.json();
    if (!userId || !returnUrl) {
      return jsonResponse({ error: 'Missing required fields' }, 400);
    }

    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();

    let customerId = (sub?.stripe_customer_id as string | null | undefined) ?? null;

    // DBに stripe_customer_id がまだ書かれていない場合は Stripe から検索する
    if (!customerId) {
      const { data: userResp, error: userErr } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (userErr || !userResp?.user?.email) {
        return jsonResponse(
          { error: 'ユーザー情報を取得できませんでした。' },
          404,
        );
      }

      const email = userResp.user.email;

      const stripeCustomers = await stripe.customers.list({ email, limit: 10 });
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

      // 以後のためにDBへ反映（失敗してもポータル発行は続行）
      try {
        await supabaseAdmin
          .from('subscriptions')
          .update({
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      } catch (updateError) {
        console.warn('[portal] failed to persist stripe_customer_id', updateError);
      }
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
