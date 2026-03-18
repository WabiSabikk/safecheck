'use client';

import { I18nProvider } from '@/lib/i18n/context';
import { OfflineProvider } from '@/lib/offline/context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <OfflineProvider>
        {children}
      </OfflineProvider>
    </I18nProvider>
  );
}
