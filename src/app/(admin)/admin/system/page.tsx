'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Database } from 'lucide-react';
import type { SystemHealth } from '@/types/admin';

export default function AdminSystemPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/system')
      .then(r => r.json())
      .then(setHealth)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  const totalRecords = health?.tables.reduce((sum, t) => sum + t.count, 0) || 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Activity className="h-6 w-6" />
        System Health
      </h1>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-violet-600" />
            <span className="text-sm text-muted-foreground">Total Records</span>
          </div>
          <span className="text-2xl font-bold mt-1 block">{totalRecords.toLocaleString()}</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {health?.tables.map(t => (
              <div key={t.name} className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm font-mono">{t.name}</span>
                <span className="text-sm font-bold">{t.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
