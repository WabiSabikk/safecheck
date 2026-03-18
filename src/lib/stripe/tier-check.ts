import { TIER_LIMITS, type TierLimits } from './config';
import type { SubscriptionTier } from '@/types/database';

export function getTierLimits(tier: SubscriptionTier): TierLimits {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

export function canAccessFeature(
  tier: SubscriptionTier,
  feature: keyof TierLimits
): boolean {
  const value = TIER_LIMITS[tier]?.[feature];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  return false;
}

export function isWithinLimit(
  tier: SubscriptionTier,
  resource: 'maxLocations' | 'maxStaff' | 'maxChecklistTemplates',
  currentCount: number
): boolean {
  const limit = TIER_LIMITS[tier]?.[resource] ?? 0;
  return currentCount < limit;
}

export function getRequiredTier(feature: keyof TierLimits): SubscriptionTier {
  if (canAccessFeature('free', feature)) return 'free';
  if (canAccessFeature('starter', feature)) return 'starter';
  return 'professional';
}
