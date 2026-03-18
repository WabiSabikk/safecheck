'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, ArrowRight } from 'lucide-react';
import type { SubscriptionTier } from '@/types/database';

interface UpgradePromptProps {
  feature: string;
  requiredTier: SubscriptionTier;
  currentTier: SubscriptionTier;
}

const tierLabels: Record<SubscriptionTier, string> = {
  free: 'Free',
  starter: 'Starter ($19/mo)',
  professional: 'Professional ($39/mo)',
};

export function UpgradePrompt({ feature, requiredTier, currentTier }: UpgradePromptProps) {
  if (currentTier === requiredTier || currentTier === 'professional') return null;
  if (requiredTier === 'starter' && currentTier !== 'free') return null;

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 flex-shrink-0">
          <Lock className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-amber-900">{feature} requires {tierLabels[requiredTier]}</p>
          <p className="text-sm text-amber-700 mt-0.5">
            Upgrade your plan to unlock this feature.
          </p>
        </div>
        <Link href="/settings/billing">
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 flex-shrink-0">
            Upgrade
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
