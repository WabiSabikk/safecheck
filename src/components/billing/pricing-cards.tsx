'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { SubscriptionTier } from '@/types/database';

interface PricingCardsProps {
  currentTier?: SubscriptionTier;
  onSelectPlan?: (tier: 'starter' | 'professional') => Promise<void>;
  mode?: 'landing' | 'billing';
}

const plans = [
  {
    tier: 'free' as const,
    name: 'Free',
    price: 0,
    description: 'Everything you need to stay compliant',
    features: [
      { text: '1 location', included: true },
      { text: '30-day data retention', included: true },
      { text: '5 staff members', included: true },
      { text: '3 checklist templates', included: true },
      { text: 'Allergen tracking', included: true },
      { text: 'Temperature logging', included: true },
      { text: 'Corrective actions', included: true },
      { text: 'PDF export', included: false },
      { text: 'Pest control log', included: false },
      { text: 'Supplier management', included: false },
    ],
  },
  {
    tier: 'starter' as const,
    name: 'Starter',
    price: 19,
    description: 'Perfect for single-location restaurants',
    popular: false,
    features: [
      { text: 'Everything in Free, plus:', included: true },
      { text: '90-day data retention', included: true },
      { text: '15 staff members', included: true },
      { text: '10 checklist templates', included: true },
      { text: 'PDF export', included: true },
      { text: 'Pest control log', included: true },
      { text: 'Supplier management', included: true },
      { text: 'Certification tracking', included: true },
    ],
  },
  {
    tier: 'professional' as const,
    name: 'Professional',
    price: 39,
    description: 'For growing restaurants with multiple locations',
    popular: true,
    features: [
      { text: 'Everything in Starter, plus:', included: true },
      { text: '3 locations', included: true },
      { text: '1-year data retention', included: true },
      { text: 'Unlimited staff', included: true },
      { text: 'Unlimited templates', included: true },
      { text: 'Custom checklists', included: true },
    ],
  },
];

export function PricingCards({ currentTier = 'free', onSelectPlan, mode = 'landing' }: PricingCardsProps) {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleSelect = async (tier: 'starter' | 'professional') => {
    if (!onSelectPlan) return;
    setLoadingTier(tier);
    try {
      await onSelectPlan(tier);
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
      {plans.map((plan) => {
        const isCurrent = currentTier === plan.tier;
        const isPopular = 'popular' in plan && plan.popular;

        return (
          <Card
            key={plan.tier}
            className={`relative ${isPopular ? 'border-emerald-500 shadow-lg' : ''}`}
          >
            {isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-emerald-600">Most Popular</Badge>
              </div>
            )}
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">${plan.price}</span>
                {plan.price > 0 && <span className="text-muted-foreground">/mo</span>}
              </div>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-center gap-2 text-sm">
                    {f.included ? (
                      <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={f.included ? '' : 'text-muted-foreground'}>{f.text}</span>
                  </li>
                ))}
              </ul>

              {mode === 'billing' && plan.tier !== 'free' && (
                <Button
                  className={`w-full ${isPopular ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                  variant={isPopular ? 'default' : 'outline'}
                  disabled={isCurrent || loadingTier !== null}
                  onClick={() => handleSelect(plan.tier as 'starter' | 'professional')}
                >
                  {loadingTier === plan.tier && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`}
                </Button>
              )}

              {mode === 'billing' && plan.tier === 'free' && (
                <Button variant="outline" className="w-full" disabled>
                  {isCurrent ? 'Current Plan' : 'Free Plan'}
                </Button>
              )}

              {mode === 'landing' && plan.tier === 'free' && (
                <Link href="/register">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Start Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}

              {mode === 'landing' && plan.tier !== 'free' && (
                <Link href="/register">
                  <Button variant={isPopular ? 'default' : 'outline'} className={`w-full ${isPopular ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}>
                    Start Free, Upgrade Later
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
