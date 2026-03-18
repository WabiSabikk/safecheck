import type { SubscriptionTier } from '@/types/database';

export interface TierLimits {
  maxLocations: number;
  dataRetentionDays: number;
  maxStaff: number;
  pdfExport: boolean;
  customChecklists: boolean;
  maxChecklistTemplates: number;
  allergenTracking: boolean;
  certTracking: boolean;
  pestControl: boolean;
  supplierManagement: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    maxLocations: 1,
    dataRetentionDays: 30,
    maxStaff: 5,
    pdfExport: false,
    customChecklists: false,
    maxChecklistTemplates: 3,
    allergenTracking: true,
    certTracking: false,
    pestControl: false,
    supplierManagement: false,
  },
  starter: {
    maxLocations: 1,
    dataRetentionDays: 90,
    maxStaff: 15,
    pdfExport: true,
    customChecklists: false,
    maxChecklistTemplates: 10,
    allergenTracking: true,
    certTracking: true,
    pestControl: true,
    supplierManagement: true,
  },
  professional: {
    maxLocations: 3,
    dataRetentionDays: 365,
    maxStaff: Infinity,
    pdfExport: true,
    customChecklists: true,
    maxChecklistTemplates: Infinity,
    allergenTracking: true,
    certTracking: true,
    pestControl: true,
    supplierManagement: true,
  },
};

export const TIER_PRICES: Record<Exclude<SubscriptionTier, 'free'>, { monthly: number; label: string }> = {
  starter: { monthly: 19, label: 'Starter' },
  professional: { monthly: 39, label: 'Professional' },
};

export function getStripePriceId(tier: Exclude<SubscriptionTier, 'free'>): string | null {
  const map: Record<string, string | undefined> = {
    starter: process.env.STRIPE_PRICE_STARTER_MONTHLY,
    professional: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY,
  };
  return map[tier] || null;
}

export function priceIdToTier(priceId: string): SubscriptionTier {
  if (priceId === process.env.STRIPE_PRICE_STARTER_MONTHLY) return 'starter';
  if (priceId === process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY) return 'professional';
  return 'free';
}
