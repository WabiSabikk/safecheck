'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  savePendingAction,
  getPendingActions,
  removePendingAction,
  cacheResponse,
  getCachedResponse,
  type PendingAction,
} from './db';

interface OfflineContextType {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  syncNow: () => Promise<void>;
  offlineFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const OfflineContext = createContext<OfflineContextType | null>(null);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      syncPending();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Count pending on mount
    getPendingActions().then(actions => setPendingCount(actions.length));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncPending = useCallback(async () => {
    const actions = await getPendingActions();
    if (actions.length === 0) return;

    setIsSyncing(true);
    for (const action of actions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: { 'Content-Type': 'application/json' },
          body: action.body,
        });
        if (response.ok) {
          await removePendingAction(action.id);
        } else if (action.retries >= 3) {
          await removePendingAction(action.id);
        } else {
          await savePendingAction({ ...action, retries: action.retries + 1 });
        }
      } catch {
        // Still offline or network error — leave for next sync
      }
    }
    const remaining = await getPendingActions();
    setPendingCount(remaining.length);
    setIsSyncing(false);
  }, []);

  const offlineFetch = useCallback(
    async (url: string, options?: RequestInit): Promise<Response> => {
      const method = options?.method?.toUpperCase() || 'GET';

      // For GET requests, try network first, fallback to cache
      if (method === 'GET') {
        if (navigator.onLine) {
          try {
            const response = await fetch(url, options);
            if (response.ok) {
              const data = await response.clone().json();
              await cacheResponse(url, data);
            }
            return response;
          } catch {
            // Network failed, try cache
          }
        }
        const cached = await getCachedResponse(url);
        if (cached !== null) {
          return new Response(JSON.stringify(cached), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'X-From-Cache': 'true' },
          });
        }
        return new Response(JSON.stringify({ error: 'Offline and no cached data' }), {
          status: 503,
        });
      }

      // For mutation requests (POST, PUT, DELETE), try network or queue
      if (navigator.onLine) {
        try {
          const response = await fetch(url, options);
          return response;
        } catch {
          // Network failed during send
        }
      }

      // Queue for later sync
      const action: PendingAction = {
        id: crypto.randomUUID(),
        type: guessActionType(url),
        url,
        method,
        body: options?.body as string || '{}',
        createdAt: new Date().toISOString(),
        retries: 0,
      };
      await savePendingAction(action);
      setPendingCount(prev => prev + 1);

      return new Response(JSON.stringify({ queued: true, id: action.id }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      });
    },
    []
  );

  return (
    <OfflineContext.Provider value={{ isOnline, pendingCount, isSyncing, syncNow: syncPending, offlineFetch }}>
      {children}
    </OfflineContext.Provider>
  );
}

function guessActionType(url: string): PendingAction['type'] {
  if (url.includes('temperature')) return 'temperature_log';
  if (url.includes('checklist')) return 'checklist_response';
  if (url.includes('corrective')) return 'corrective_action';
  if (url.includes('receiving')) return 'receiving_log';
  return 'food_label';
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) throw new Error('useOffline must be used within OfflineProvider');
  return context;
}
