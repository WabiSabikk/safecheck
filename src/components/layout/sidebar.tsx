'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardCheck,
  Thermometer,
  FileText,
  Settings,
  Users,
  Refrigerator,
  ShieldCheck,
  AlertOctagon,
  ListChecks,
  Award,
  Package,
  Tag,
  AlertTriangle,
  Globe,
  BookOpen,
  CreditCard,
  Bug,
  Truck,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/context';
import { useAuth } from '@/lib/auth/context';
import { canAccessFeature } from '@/lib/stripe/tier-check';
import type { TierLimits } from '@/lib/stripe/config';
import type { TranslationKey } from '@/lib/i18n/translations';
import type { LucideIcon } from 'lucide-react';
import type { SubscriptionTier } from '@/types/database';

interface NavItem {
  href: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
  requiredFeature?: keyof TierLimits;
}

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { orgId, supabase } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('free');

  useEffect(() => {
    if (!orgId) return;
    const fetchTier = async () => {
      const { data: org } = await supabase.from('organizations').select('subscription_tier').eq('id', orgId).single();
      if (org) setTier(org.subscription_tier || 'free');
    };
    fetchTier();
  }, [orgId, supabase]);

  const mainNav: NavItem[] = [
    { href: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
    { href: '/checklists/today', labelKey: 'nav.checklists', icon: ClipboardCheck },
    { href: '/temperature-logs', labelKey: 'nav.tempLogs', icon: Thermometer },
    { href: '/labels', labelKey: 'nav.labels', icon: Tag },
    { href: '/allergens', labelKey: 'nav.allergens', icon: AlertTriangle },
    { href: '/corrective-actions', labelKey: 'nav.correctiveActions', icon: AlertOctagon },
    { href: '/receiving', labelKey: 'nav.receivingLog', icon: Package },
    { href: '/pest-control', labelKey: 'nav.pestControl', icon: Bug, requiredFeature: 'pestControl' },
    { href: '/suppliers', labelKey: 'nav.suppliers', icon: Truck, requiredFeature: 'supplierManagement' },
    { href: '/reports', labelKey: 'reports.title', icon: FileText },
  ];

  const settingsNav: NavItem[] = [
    { href: '/settings', labelKey: 'settings.restaurant', icon: Settings },
    { href: '/settings/team', labelKey: 'settings.team', icon: Users },
    { href: '/settings/equipment', labelKey: 'settings.equipment', icon: Refrigerator },
    { href: '/settings/templates', labelKey: 'settings.templates', icon: ListChecks },
    { href: '/settings/certifications', labelKey: 'settings.certifications', icon: Award, requiredFeature: 'certTracking' },
    { href: '/settings/billing', labelKey: 'settings.billing', icon: CreditCard },
  ];

  const supportNav: NavItem[] = [
    { href: '/help', labelKey: 'nav.foodSafetyGuide', icon: BookOpen },
  ];

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <ShieldCheck className="h-6 w-6 text-emerald-600" />
        <span className="text-lg font-bold">SafeCheck</span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {mainNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const isLocked = item.requiredFeature && !canAccessFeature(tier, item.requiredFeature);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{t(item.labelKey)}</span>
                {isLocked && <Lock className="h-3 w-3 text-muted-foreground/60" />}
              </Link>
            );
          })}
        </div>

        <div className="mt-6">
          <p className="mb-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('settings.title')}
          </p>
          <div className="space-y-1">
            {settingsNav.map((item) => {
              const isActive = pathname === item.href;
              const isLocked = item.requiredFeature && !canAccessFeature(tier, item.requiredFeature);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1">{t(item.labelKey)}</span>
                  {isLocked && <Lock className="h-3 w-3 text-muted-foreground/60" />}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('nav.helpSection')}
          </p>
          <div className="space-y-1">
            {supportNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </aside>
  );
}
