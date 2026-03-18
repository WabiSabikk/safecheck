'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/offline/register-sw';

export function ServiceWorkerInit() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
