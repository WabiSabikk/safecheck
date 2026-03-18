import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkoutSchema } from '@/lib/validations/stripe';
import { getStripePriceId } from '@/lib/stripe/config';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/utils/rate-limit';

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });
  }

  const ip = getClientIp(request);
  const rl = checkRateLimit(`stripe-checkout:${ip}`, RATE_LIMITS.api);
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { tier } = parsed.data;

  // Get user profile and org
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, role')
    .eq('id', user.id)
    .single();

  if (!profile?.org_id || profile.role !== 'owner') {
    return NextResponse.json({ error: 'Only restaurant owners can manage billing' }, { status: 403 });
  }

  // Get org
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('id, name, stripe_customer_id')
    .eq('id', profile.org_id)
    .single();

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  const priceId = getStripePriceId(tier);
  if (!priceId) {
    return NextResponse.json({ error: 'Price not configured' }, { status: 503 });
  }

  // Create or reuse Stripe customer
  let customerId = org.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name: org.name,
      metadata: { org_id: org.id, user_id: user.id },
    });
    customerId = customer.id;

    await supabaseAdmin
      .from('organizations')
      .update({ stripe_customer_id: customerId })
      .eq('id', org.id);
  }

  // Create checkout session
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/settings/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/settings/billing?canceled=true`,
    subscription_data: {
      metadata: { org_id: org.id },
    },
    metadata: { org_id: org.id },
  });

  return NextResponse.json({ url: session.url });
}
