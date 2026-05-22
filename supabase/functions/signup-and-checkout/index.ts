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

async function waitForLoginId(userId: string): Promise<string | null> {
  for (let i = 0; i < 8; i += 1) {
    const { data } = await supabaseAdmin
      .from('member_profiles')
      .select('login_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (data?.login_id) return data.login_id as string;
    await new Promise((r) => setTimeout(r, 500));
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, priceId, successUrl, cancelUrl } = await req.json();

    if (!email || !priceId || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 1. Check if user already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('member_profiles')
      .select('user_id, email')
      .eq('email', email)
      .maybeSingle();

    let userId: string;
    let loginId: string | null = null;

    if (existingProfile) {
      userId = existingProfile.user_id;
      loginId = await waitForLoginId(userId);
    } else {
      // 2. Create user via admin API (email auto-confirmed, no confirmation email)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: `auth-${crypto.randomUUID()}-${Date.now()}`,
        email_confirm: true,
      });

      if (authError) {
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      userId = authData.user.id;
      loginId = await waitForLoginId(userId);
    }

    // 3. Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      client_reference_id: userId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      payment_method_collection: 'always',
      subscription_data: {
        trial_period_days: 7,
        trial_settings: {
          end_behavior: { missing_payment_method: 'cancel' },
        },
        metadata: { user_id: userId },
      },
      metadata: { user_id: userId },
    });

    return new Response(
      JSON.stringify({ url: session.url, userId, loginId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
