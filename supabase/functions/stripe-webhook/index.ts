import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@17?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2025-04-30.basil' });
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) return new Response('No signature', { status: 400 });

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret);
  } catch (err) {
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      if (!userId) break;

      let trialEndIso: string | null = null;
      let currentPeriodEndIso: string | null = null;
      let nextStatus: 'trialing' | 'active' = 'trialing';
      if (session.subscription) {
        try {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          if (sub.trial_end) trialEndIso = new Date(sub.trial_end * 1000).toISOString();
          if (sub.current_period_end) {
            currentPeriodEndIso = new Date(sub.current_period_end * 1000).toISOString();
          }
          nextStatus = sub.status === 'active' ? 'active' : 'trialing';
        } catch (err) {
          console.warn('[webhook] subscription retrieve failed', err);
        }
      }

      const nowIso = new Date().toISOString();
      const update: Record<string, unknown> = {
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        status: nextStatus,
        updated_at: nowIso,
      };
      if (trialEndIso) update.trial_end = trialEndIso;
      if (currentPeriodEndIso) update.current_period_end = currentPeriodEndIso;
      if (nextStatus === 'active') update.activated_at = nowIso;

      await supabaseAdmin.from('subscriptions').update(update).eq('user_id', userId);
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string | null;
      if (!customerId) break;

      await supabaseAdmin.from('subscriptions').update({
        status: 'active',
        updated_at: new Date().toISOString(),
      }).eq('stripe_customer_id', customerId);
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      const nowIso = new Date().toISOString();
      const update: Record<string, unknown> = {
        status:
          sub.status === 'active'
            ? 'active'
            : sub.status === 'trialing'
              ? 'trialing'
              : sub.status === 'past_due'
                ? 'past_due'
                : 'canceled',
        updated_at: nowIso,
      };
      if (sub.current_period_end) {
        update.current_period_end = new Date(sub.current_period_end * 1000).toISOString();
      }
      if (sub.trial_end) {
        update.trial_end = new Date(sub.trial_end * 1000).toISOString();
      }

      const { data: existing } = await supabaseAdmin
        .from('subscriptions')
        .select('activated_at, canceled_at')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();

      if (sub.status === 'active' && !existing?.activated_at) {
        update.activated_at = nowIso;
      }
      if ((sub.cancel_at_period_end || sub.status === 'canceled') && !existing?.canceled_at) {
        update.canceled_at = nowIso;
      }

      await supabaseAdmin
        .from('subscriptions')
        .update(update)
        .eq('stripe_customer_id', customerId);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const nowIso = new Date().toISOString();

      await supabaseAdmin.from('subscriptions').update({
        status: 'canceled',
        canceled_at: nowIso,
        updated_at: nowIso,
      }).eq('stripe_customer_id', customerId);
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
