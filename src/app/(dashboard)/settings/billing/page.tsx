'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth/context';
import { CreditCard, ExternalLink, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PricingCards } from '@/components/billing/pricing-cards';
import type { SubscriptionTier } from '@/types/database';

function BillingContent() {
  const { orgId, supabase, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [stripeStatus, setStripeStatus] = useState<string | null>(null);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [hasStripeCustomer, setHasStripeCustomer] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Subscription activated! Welcome aboard.');
    }
    if (searchParams.get('canceled') === 'true') {
      toast('Checkout canceled. No changes were made.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (authLoading) return;
    if (!orgId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const { data: org } = await supabase
          .from('organizations')
          .select('subscription_tier, stripe_subscription_status, stripe_current_period_end, stripe_customer_id')
          .eq('id', orgId)
          .single();

        if (org) {
          setTier(org.subscription_tier || 'free');
          setStripeStatus(org.stripe_subscription_status);
          setPeriodEnd(org.stripe_current_period_end);
          setHasStripeCustomer(!!org.stripe_customer_id);
        }
      } catch (err) {
        console.error('[Billing] Error:', err);
      }
      setLoading(false);
    };
    fetchData();
  }, [authLoading, orgId, supabase]);

  const handleCheckout = async (selectedTier: 'starter' | 'professional') => {
    const res = await window.fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier: selectedTier }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      toast.error(data.error || 'Failed to start checkout');
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    const res = await window.fetch('/api/stripe/portal', { method: 'POST' });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      toast.error(data.error || 'Failed to open billing portal');
    }
    setPortalLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  const tierLabel = tier === 'free' ? 'Free' : tier === 'starter' ? 'Starter' : 'Professional';
  const tierColor = tier === 'free' ? 'secondary' : tier === 'starter' ? 'default' : 'default';

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and payment method</p>
      </div>

      {/* Payment failed alert */}
      {stripeStatus === 'past_due' && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-red-800">Payment Failed</p>
              <p className="text-sm text-red-700">Please update your payment method to avoid losing access.</p>
            </div>
            {hasStripeCustomer && (
              <Button size="sm" variant="destructive" onClick={handlePortal} disabled={portalLoading}>
                {portalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Payment
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current plan card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">{tierLabel}</span>
                <Badge variant={tierColor}>
                  {stripeStatus === 'active' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                  {stripeStatus || 'free'}
                </Badge>
              </div>
              {tier !== 'free' && periodEnd && (
                <p className="text-sm text-muted-foreground mt-1">
                  {stripeStatus === 'active'
                    ? `Renews on ${new Date(periodEnd).toLocaleDateString()}`
                    : `Access until ${new Date(periodEnd).toLocaleDateString()}`}
                </p>
              )}
              {tier === 'free' && (
                <p className="text-sm text-muted-foreground mt-1">
                  7-day data retention, 1 location, 3 staff
                </p>
              )}
            </div>
            {hasStripeCustomer && (
              <Button variant="outline" onClick={handlePortal} disabled={portalLoading}>
                {portalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <ExternalLink className="mr-2 h-4 w-4" />
                Manage Subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          {tier === 'free' ? 'Upgrade your plan' : 'Change plan'}
        </h2>
        <PricingCards
          currentTier={tier}
          onSelectPlan={handleCheckout}
          mode="billing"
        />
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
