'use client';

import { WifiOff, RefreshCw, Check } from 'lucide-react';
import { useOffline } from '@/lib/offline/context';
import { useI18n } from '@/lib/i18n/context';

export function OfflineBanner() {
  const { isOnline, pendingCount, isSyncing, syncNow } = useOffline();
  const { t } = useI18n();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${
        !isOnline
          ? 'bg-amber-100 text-amber-800'
          : isSyncing
          ? 'bg-blue-100 text-blue-800'
          : 'bg-green-100 text-green-800'
      }`}
    >
      {!isOnline ? (
        <>
          <WifiOff className="h-4 w-4" />
          <span className="flex-1">{t('offline.banner')}</span>
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs">
              {t('offline.pendingChanges', { count: pendingCount })}
            </span>
          )}
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>{t('offline.syncing')}</span>
        </>
      ) : pendingCount > 0 ? (
        <>
          <RefreshCw className="h-4 w-4" />
          <span className="flex-1">
            {t('offline.pendingChanges', { count: pendingCount })}
          </span>
          <button
            onClick={syncNow}
            className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
          >
            Sync Now
          </button>
        </>
      ) : (
        <>
          <Check className="h-4 w-4" />
          <span>{t('offline.synced')}</span>
        </>
      )}
    </div>
  );
}
