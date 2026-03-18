import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { priceIdToTier } from '@/lib/stripe/config';
import type Stripe from 'stripe';

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== 'subscription' || !session.subscription) break;

      const orgId = session.metadata?.org_id;
      if (!orgId) break;

      // Retrieve subscription to get price info
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items.data[0]?.price?.id;
      const tier = priceId ? priceIdToTier(priceId) : 'starter';
      const itemPeriodEnd = subscription.items.data[0]?.current_period_end;

      await supabaseAdmin
        .from('organizations')
        .update({
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscription.id,
          stripe_subscription_status: subscription.status,
          stripe_current_period_end: itemPeriodEnd
            ? new Date(itemPeriodEnd * 1000).toISOString()
            : null,
          subscription_tier: tier,
        })
        .eq('id', orgId);

      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const orgId = subscription.metadata?.org_id;

      // Find org by subscription ID if no metadata
      let targetOrgId = orgId;
      if (!targetOrgId) {
        const { data: org } = await supabaseAdmin
          .from('organizations')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single();
        targetOrgId = org?.id;
      }
      if (!targetOrgId) break;

      const priceId = subscription.items.data[0]?.price?.id;
      const tier = priceId ? priceIdToTier(priceId) : 'free';
      const itemPeriodEnd = subscription.items.data[0]?.current_period_end;

      const updateData: Record<string, unknown> = {
        stripe_subscription_status: subscription.status,
        stripe_current_period_end: itemPeriodEnd
          ? new Date(itemPeriodEnd * 1000).toISOString()
          : null,
      };

      // Only update tier if subscription is active (not when cancel_at_period_end)
      if (subscription.status === 'active' && !subscription.cancel_at_period_end) {
        updateData.subscription_tier = tier;
      }

      await supabaseAdmin
        .from('organizations')
        .update(updateData)
        .eq('id', targetOrgId);

      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;

      // Downgrade to free
      const { data: org } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (org) {
        await supabaseAdmin
          .from('organizations')
          .update({
            subscription_tier: 'free',
            stripe_subscription_status: 'canceled',
            stripe_subscription_id: null,
          })
          .eq('id', org.id);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      const { data: org } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (org) {
        await supabaseAdmin
          .from('organizations')
          .update({ stripe_subscription_status: 'past_due' })
          .eq('id', org.id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
