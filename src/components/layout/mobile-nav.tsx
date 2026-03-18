'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ClipboardCheck, Thermometer, Tag, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/context';
import type { TranslationKey } from '@/lib/i18n/translations';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
}

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  const navItems: NavItem[] = [
    { href: '/dashboard', labelKey: 'nav.home', icon: LayoutDashboard },
    { href: '/checklists/today', labelKey: 'nav.listsShort', icon: ClipboardCheck },
    { href: '/temperature-logs/new', labelKey: 'nav.tempShort', icon: Thermometer },
    { href: '/labels', labelKey: 'nav.labels', icon: Tag },
    { href: '/settings', labelKey: 'nav.more', icon: Menu },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 text-xs transition-colors',
                isActive
                  ? 'text-emerald-600 font-medium'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'text-emerald-600')} />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
